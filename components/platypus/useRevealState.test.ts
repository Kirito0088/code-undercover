// @vitest-environment jsdom
//
// This file matches the "unit" project (environment: "node") by its .test.ts
// extension, but renderHook() needs a DOM. The hook itself stays a pure,
// renderless function — this override only affects the test harness.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRevealState } from "./useRevealState"
import type { CompilerDiagnostic } from "@/types"

const ROOT_ERROR: CompilerDiagnostic = {
    line: 4,
    column: 9,
    type: "error",
    message: "expected ';' before '}' token",
    rawContext: "int x = 1",
}

const OTHER_ROOT_ERROR: CompilerDiagnostic = {
    line: 9,
    column: 1,
    type: "error",
    message: "expected declaration",
    rawContext: "int y",
}

const PAYLOAD = {
    explanation: "Agent, you're missing a semicolon.",
    directFix: "int x = 1;",
    source: "static" as const,
}

/** A controllable promise so tests can resolve fetchExplanation at an exact tick. */
function deferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

describe("useRevealState", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("1. initial state is Hidden", () => {
        const fetchExplanation = vi.fn()
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        expect(result.current.state.status).toBe("Hidden")
    })

    it("2. Root Error arrives → auto-transitions to Peeking; fetch not called", () => {
        const fetchExplanation = vi.fn()
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })

        expect(result.current.state.status).toBe("Peeking")
        expect(fetchExplanation).not.toHaveBeenCalled()
    })

    it("3. Click in Peeking → Loading; fetch called exactly once", () => {
        const fetchExplanation = vi.fn().mockReturnValue(new Promise(() => {}))
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })
        act(() => {
            result.current.reveal()
        })

        expect(result.current.state.status).toBe("Loading")
        expect(fetchExplanation).toHaveBeenCalledTimes(1)
        expect(fetchExplanation).toHaveBeenCalledWith(ROOT_ERROR)
    })

    it("4. Response at 5ms → still Loading at t=400ms; DefaultExplanation at t≥500ms", async () => {
        const { promise, resolve } = deferred<typeof PAYLOAD>()
        const fetchExplanation = vi.fn().mockReturnValue(promise)
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })
        act(() => {
            result.current.reveal()
        })

        // Cache hit resolves almost immediately...
        await act(async () => {
            await vi.advanceTimersByTimeAsync(5)
            resolve(PAYLOAD)
        })

        // ...but the 500ms floor hasn't elapsed yet.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(395) // total 400ms
        })
        expect(result.current.state.status).toBe("Loading")

        await act(async () => {
            await vi.advanceTimersByTimeAsync(100) // total 500ms
        })
        expect(result.current.state.status).toBe("DefaultExplanation")
    })

    it("5. Response at 3000ms → DefaultExplanation at ~3000ms, not 3500ms (parallel, not additive)", async () => {
        const { promise, resolve } = deferred<typeof PAYLOAD>()
        const fetchExplanation = vi.fn().mockReturnValue(promise)
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })
        act(() => {
            result.current.reveal()
        })

        // 500ms floor elapses long before the fetch resolves — still Loading.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(500)
        })
        expect(result.current.state.status).toBe("Loading")

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2500) // total 3000ms
            resolve(PAYLOAD)
        })
        await act(async () => {
            await vi.advanceTimersByTimeAsync(0)
        })

        expect(result.current.state.status).toBe("DefaultExplanation")
    })

    it("6. Double-click in Peeking → exactly one fetch", () => {
        const fetchExplanation = vi.fn().mockReturnValue(new Promise(() => {}))
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })
        act(() => {
            result.current.reveal()
            result.current.reveal()
        })

        expect(fetchExplanation).toHaveBeenCalledTimes(1)
        expect(result.current.state.status).toBe("Loading")
    })

    it("7. New compile mid-Loading → returns to Hidden; late response discarded, not rendered", async () => {
        const { promise, resolve } = deferred<typeof PAYLOAD>()
        const fetchExplanation = vi.fn().mockReturnValue(promise)
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })
        act(() => {
            result.current.reveal()
        })
        expect(result.current.state.status).toBe("Loading")

        // Student recompiles while the request is in flight.
        act(() => {
            result.current.onRootErrorChange(null)
        })
        expect(result.current.state.status).toBe("Hidden")

        // The late response arrives after the fact.
        await act(async () => {
            resolve(PAYLOAD)
            await vi.advanceTimersByTimeAsync(1000)
        })

        expect(result.current.state.status).toBe("Hidden")
    })

    it("8. Clean compile (no Root Error) → stays Hidden", () => {
        const fetchExplanation = vi.fn()
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(null)
        })

        expect(result.current.state.status).toBe("Hidden")
        expect(fetchExplanation).not.toHaveBeenCalled()
    })

    it("9. Fallback payload from T3 → renders as a normal DefaultExplanation, no error UI", async () => {
        const fallbackPayload = {
            explanation: "Agent, the diagnostic signal is heavily scrambled on my end.",
            directFix: "",
            source: "fallback" as const,
        }
        const fetchExplanation = vi.fn().mockResolvedValue(fallbackPayload)
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })
        act(() => {
            result.current.reveal()
        })

        await act(async () => {
            await vi.advanceTimersByTimeAsync(500)
        })

        expect(result.current.state.status).toBe("DefaultExplanation")
        if (result.current.state.status === "DefaultExplanation") {
            expect(result.current.state.payload).toEqual(fallbackPayload)
        }
    })

    it("10. Peeking → Hidden on new compile without ever fetching", () => {
        const fetchExplanation = vi.fn()
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })
        expect(result.current.state.status).toBe("Peeking")

        act(() => {
            result.current.onRootErrorChange(null)
        })

        expect(result.current.state.status).toBe("Hidden")
        expect(fetchExplanation).not.toHaveBeenCalled()
    })

    it("bonus: a second Root Error while already past Hidden does not re-trigger Peeking mid-flow", async () => {
        const fetchExplanation = vi.fn().mockReturnValue(new Promise(() => {}))
        const { result } = renderHook(() => useRevealState({ fetchExplanation }))

        act(() => {
            result.current.onRootErrorChange(ROOT_ERROR)
        })
        act(() => {
            result.current.reveal()
        })
        expect(result.current.state.status).toBe("Loading")

        // Defensive: onRootErrorChange firing again with a non-null error while
        // already past Hidden must not reset or clobber the in-flight Loading state.
        act(() => {
            result.current.onRootErrorChange(OTHER_ROOT_ERROR)
        })

        expect(result.current.state.status).toBe("Loading")
    })
})
