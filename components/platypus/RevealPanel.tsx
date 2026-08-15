"use client"

import { forwardRef, useEffect, useImperativeHandle } from "react"
import type { CompilerDiagnostic } from "@/types"
import { useRevealState, type RevealExplanation } from "./useRevealState"
import { PlatypusMascot } from "./PlatypusMascot"

/**
 * The Phase A → Phase B seam (T5): POSTs to the T3 explain route. Only ever
 * called from useRevealState's `reveal()`, which is only reachable from
 * Peeking — never during Peeking itself (invariant 1, zero prefetch).
 */
async function fetchExplanation(rootError: CompilerDiagnostic): Promise<RevealExplanation> {
    const response = await fetch("/api/compiler/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            rootErrorMessage: rootError.message,
            brokenLineContent: rootError.rawContext,
        }),
    })

    if (!response.ok) {
        // The route only ever 4xx's on malformed caller input and otherwise
        // resolves through lib/explainService.ts to a 200 with the ADR-004
        // fallback payload (never a 5xx) — a non-2xx here means our own
        // request was malformed, not that the explanation pipeline failed.
        throw new Error(`Explain API returned ${response.status}`)
    }

    const result = await response.json()
    return {
        explanation: result.explanation,
        directFix: result.directFix ?? null,
        source: result.source,
    }
}

export interface RevealPanelHandle {
    /**
     * Alternate entry point to the same "ask for help" action as the speech
     * bubble — wire to EditorPanel's `onRootErrorClick` (clicking the gutter
     * decal or the Root Error's squiggle). Routes through the same
     * `reveal()` as the mascot's button, so it is a no-op outside Peeking
     * and still only ever fires one fetch.
     */
    reveal: () => void
}

interface RevealPanelProps {
    /**
     * Forward EditorPanel's `onRootErrorChange` value here verbatim,
     * including the `null` it fires at the start of every compile — that
     * `null` is what drives the any-state → Hidden transition and the
     * stale-response guard.
     */
    rootError: CompilerDiagnostic | null
}

/** Mounts the Platypus mascot and hosts the Reveal Friction State Machine (ADR-003). */
export const RevealPanel = forwardRef<RevealPanelHandle, RevealPanelProps>(function RevealPanel(
    { rootError },
    ref
) {
    const { state, onRootErrorChange, reveal } = useRevealState({ fetchExplanation })

    useEffect(() => {
        onRootErrorChange(rootError)
    }, [rootError, onRootErrorChange])

    useImperativeHandle(ref, () => ({ reveal }), [reveal])

    if (state.status === "Hidden") return null

    return (
        <div className="pointer-events-auto" data-testid="reveal-panel">
            <PlatypusMascot state={state} onReveal={reveal} />
        </div>
    )
})
