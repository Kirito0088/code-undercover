import { useCallback, useRef, useState } from "react"
import type { CompilerDiagnostic } from "@/types"
// Type-only import — erased at build time, so this never pulls the Prisma-backed
// lib/explainService module (or its `db` dependency) into client bundles.
import type { ExplainSource } from "@/lib/explainService"

// ─────────────────────────────────────────────────────────────────────────────
// Reveal Friction State Machine (T5, binding — ADR-003).
//
//   compile OK / mount
//        Hidden ─────────────────────────────┐
//          │  fatal Root Error detected       │
//          │     (AUTOMATIC, no fetch)        │ new compile starts
//          ▼                                  │
//        Peeking ───────────────────────────┐ │
//          │  student CLICKS speech bubble    │ │
//          │     (fires the fetch)            │ │
//          ▼                                  │ │
//        Loading ───────────────────────────┐│ │
//          │  API resolves AND ≥500ms elapsed ││ │
//          ▼                                  ││ │
//        DefaultExplanation ◄─────────────────┴┴─┘
//
// A pure hook — no rendering required to exercise it (see useRevealState.test.ts).
// ─────────────────────────────────────────────────────────────────────────────

export interface RevealExplanation {
    explanation: string
    /**
     * Present in the payload from T3 but never rendered by this ticket —
     * T6 adds the premium gate that reads it. See invariant 4 in
     * .scratch/issues/T5-platypus-state-machine.md.
     */
    directFix: string | null
    source: ExplainSource
}

export type RevealState =
    | { status: "Hidden" }
    | { status: "Peeking"; rootError: CompilerDiagnostic }
    | { status: "Loading"; rootError: CompilerDiagnostic }
    | { status: "DefaultExplanation"; rootError: CompilerDiagnostic; payload: RevealExplanation }

export interface UseRevealStateOptions {
    /**
     * Fetches the explanation for a Root Error. Called exactly once per
     * reveal — never during Peeking (invariant 1).
     */
    fetchExplanation: (rootError: CompilerDiagnostic) => Promise<RevealExplanation>
    /** Artificial minimum floor for the Loading state (ADR-003). Defaults to 500ms. Do not "optimize" away. */
    minLoadingMs?: number
}

export interface UseRevealStateResult {
    state: RevealState
    /**
     * Wire to EditorPanel's `onRootErrorChange`. A `null` argument means "a
     * new compile has begun" (or resolved clean) and always resets to
     * Hidden — this is also what powers the stale-response guard. A
     * non-null Root Error only advances Hidden → Peeking; it is a no-op once
     * the machine has moved past Hidden for the current compile.
     */
    onRootErrorChange: (rootError: CompilerDiagnostic | null) => void
    /** Wire to the speech bubble's click/Enter/Space handler. Fires the fetch. */
    reveal: () => void
}

const DEFAULT_MIN_LOADING_MS = 500

export function useRevealState({
    fetchExplanation,
    minLoadingMs = DEFAULT_MIN_LOADING_MS,
}: UseRevealStateOptions): UseRevealStateResult {
    const [state, setState] = useState<RevealState>({ status: "Hidden" })

    // Mirrors `state` synchronously. reveal()'s double-click guard and the
    // stale-response check both need to read "what just happened" within the
    // same tick, before React has committed a re-render — state alone would
    // still show the old value to a second synchronous call.
    const stateRef = useRef<RevealState>(state)

    // Bumped every time a new compile begins (onRootErrorChange(null)). An
    // in-flight fetch captures the generation it started under; on resolve it
    // compares against the current value and discards itself on a mismatch —
    // the stale-response guard (invariant 3).
    const generationRef = useRef(0)

    const commit = useCallback((next: RevealState) => {
        stateRef.current = next
        setState(next)
    }, [])

    const onRootErrorChange = useCallback(
        (rootError: CompilerDiagnostic | null) => {
            if (rootError === null) {
                generationRef.current += 1
                commit({ status: "Hidden" })
                return
            }

            // Root Error auto-transitions Hidden -> Peeking, with zero
            // network calls (invariant 1). Once the machine has moved past
            // Hidden for this compile, further calls are ignored until the
            // next `null` reset — a rootError changing shape mid-flow (e.g.
            // Judge0 re-selecting the Root Error) must not clobber Loading
            // or DefaultExplanation out from under an in-flight request.
            if (stateRef.current.status === "Hidden") {
                commit({ status: "Peeking", rootError })
            }
        },
        [commit]
    )

    const reveal = useCallback(() => {
        const current = stateRef.current
        // Ignore double-clicks and stray calls outside Peeking — this is
        // what keeps a rapid double-click to exactly one in-flight request
        // (invariant 2). The check and the transition to Loading below both
        // happen synchronously against stateRef, so a second reveal() call
        // in the same tick already sees "Loading" and bails here.
        if (current.status !== "Peeking") return

        const { rootError } = current
        const generation = generationRef.current
        commit({ status: "Loading", rootError })

        const explanationPromise = fetchExplanation(rootError)
        const floorPromise = new Promise<void>((resolve) => setTimeout(resolve, minLoadingMs))

        // The 500ms floor is a Math.max via Promise.all, not a setTimeout
        // chain after the fetch — a 5ms cache hit and a 3s generation both
        // resolve at max(fetchTime, 500ms), never fetchTime + 500ms.
        Promise.all([explanationPromise, floorPromise])
            .then(([payload]) => {
                if (generationRef.current !== generation) return // stale — a new compile started
                commit({ status: "DefaultExplanation", rootError, payload })
            })
            .catch(() => {
                // fetchExplanation resolves to a fallback payload rather than
                // rejecting in normal operation (app/api/compiler/explain/route.ts
                // never surfaces a 5xx to the caller) — this catch is a defensive
                // backstop against a network-level rejection so Loading can't
                // strand the UI forever.
                if (generationRef.current !== generation) return
                commit({ status: "Hidden" })
            })
    }, [commit, fetchExplanation, minLoadingMs])

    return { state, onRootErrorChange, reveal }
}
