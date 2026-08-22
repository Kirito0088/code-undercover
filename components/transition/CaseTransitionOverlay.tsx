"use client"

// The blackboard that closes over the screen once a case-transition launches,
// with a chalk doodle + hand-written message — ported from the mockup's
// <div class="transition"> block (index.html/skill.html) and its chalkDraw/
// chalkWrite keyframes. Portaled to document.body so it always covers the
// full viewport regardless of where it's mounted or whether an ancestor
// happens to introduce a transform later.
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { kalam } from "@/lib/detective-fonts"
import type { TransitionPhase } from "@/hooks/useCaseTransition"
import styles from "./CaseTransitionOverlay.module.css"

interface CaseTransitionOverlayProps {
    phase: TransitionPhase
    message: string
}

export function CaseTransitionOverlay({ phase, message }: CaseTransitionOverlayProps) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (!mounted) return null

    const isVisible = phase === "visible" || phase === "writing"
    const isWriting = phase === "writing"

    return createPortal(
        <div
            className={`${styles.overlay} ${isVisible ? styles.visible : ""} ${isWriting ? styles.writing : ""} ${kalam.variable}`}
            aria-hidden="true"
        >
            <div className={styles.grain} />
            <svg className={styles.chalk} viewBox="0 0 620 330" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="cu-chalky" x="-15%" y="-15%" width="130%" height="130%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves={2} result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.4} xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>

                <g filter="url(#cu-chalky)" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                    <circle className={styles.draw} style={{ "--d": ".05s" } as React.CSSProperties} pathLength={1} cx={310} cy={92} r={38} />
                    <path className={styles.draw} style={{ "--d": ".38s" } as React.CSSProperties} pathLength={1} d="M337 119 L372 154" />
                    <path className={styles.draw} style={{ "--d": ".52s" } as React.CSSProperties} pathLength={1} d="M366 148 L378 160" strokeWidth={7} />
                    <path className={styles.draw} style={{ "--d": "1.02s" } as React.CSSProperties} pathLength={1} d="M168 246 q34 -13 68 0 t68 0 t68 0 t68 0" />
                </g>

                <text className={styles.word} x={310} y={212} textAnchor="middle" filter="url(#cu-chalky)">
                    {message}
                </text>

                <g className={styles.dots} fill="currentColor">
                    <circle style={{ "--d": "1.28s" } as React.CSSProperties} cx={286} cy={286} r={5} />
                    <circle style={{ "--d": "1.42s" } as React.CSSProperties} cx={310} cy={286} r={5} />
                    <circle style={{ "--d": "1.56s" } as React.CSSProperties} cx={334} cy={286} r={5} />
                </g>
            </svg>
        </div>,
        document.body
    )
}
