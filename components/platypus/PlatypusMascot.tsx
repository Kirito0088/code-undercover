"use client"

import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { RevealState } from "./useRevealState"

interface PlatypusMascotProps {
    state: RevealState
    /** Fires the fetch — wired to the speech bubble. No-op outside Peeking. */
    onReveal: () => void
}

/**
 * Purely presentational — every transition it renders is driven by the
 * `RevealState` produced by useRevealState. Never mounted for `Hidden`; the
 * caller (RevealPanel) is responsible for that.
 */
export function PlatypusMascot({ state, onReveal }: PlatypusMascotProps) {
    // Framer Motion's own hook — already wired to prefers-reduced-motion, so
    // components read this instead of querying matchMedia themselves.
    const prefersReducedMotion = useReducedMotion()

    if (state.status === "Hidden") return null

    return (
        <AnimatePresence>
            <motion.div
                key="platypus-mascot"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.92 }}
                transition={{ duration: prefersReducedMotion ? 0.01 : 0.25, ease: "easeOut" }}
                className="flex items-end gap-3"
                data-testid="platypus-mascot"
                data-state={state.status}
            >
                <Image
                    src="/characters/platipus.png"
                    alt="Platypus mentor"
                    width={56}
                    height={56}
                    className="rounded-full border border-[#1F261F] bg-[#0D0E12] shrink-0 shadow-lg"
                />

                {state.status === "Peeking" && (
                    <button
                        type="button"
                        onClick={onReveal}
                        aria-label="Ask Platypus to explain this error"
                        className="flex items-center rounded-2xl rounded-bl-sm bg-[#0D0E12] border border-[#1F261F] px-4 py-3 text-[#E2E8F0] hover:border-indigo-500/50 hover:bg-[#161820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
                    >
                        <PulsingDots reducedMotion={Boolean(prefersReducedMotion)} />
                    </button>
                )}

                {state.status === "Loading" && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center rounded-2xl rounded-bl-sm bg-[#0D0E12] border border-[#1F261F] px-4 py-3 text-[#E2E8F0]"
                    >
                        <span className="sr-only">Platypus is thinking&hellip;</span>
                        <PulsingDots reducedMotion={Boolean(prefersReducedMotion)} />
                    </div>
                )}

                {state.status === "DefaultExplanation" && (
                    <div
                        role="status"
                        className="max-w-sm rounded-2xl rounded-bl-sm bg-[#0D0E12] border border-[#1F261F] px-4 py-3 text-sm text-[#E2E8F0] whitespace-pre-line"
                    >
                        {/* directFix is intentionally never read here — T6 scope. */}
                        {state.payload.explanation}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    )
}

/**
 * The pulsing "(...)" beat — visible during both Peeking (inviting a click)
 * and Loading (the "Platypus is thinking" beat from ADR-003). Motion is
 * skipped under prefers-reduced-motion, but the dots themselves still render.
 */
function PulsingDots({ reducedMotion }: { reducedMotion: boolean }) {
    return (
        <span className="flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="size-1.5 rounded-full bg-[#8F9F8F]"
                    animate={reducedMotion ? { opacity: 1 } : { opacity: [0.3, 1, 0.3] }}
                    transition={
                        reducedMotion
                            ? undefined
                            : { duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }
                    }
                />
            ))}
        </span>
    )
}
