import type { ReactNode } from "react"

interface HudBadgeProps {
    children: ReactNode
    tone?: "active" | "dim" | "amber"
    className?: string
}

const TONES = {
    active: "text-accent bg-accent/10 border-accent/20",
    dim: "text-muted bg-transparent border-transparent",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
} as const

/**
 * Tiny mono status badge used for channel markers (LIVE / OPEN / LOGS / NEW).
 * `active` carries the emerald fill for the current channel, `dim` is the
 * quiet unselected state, `amber` is reserved for warning states.
 */
export function HudBadge({ children, tone = "dim", className = "" }: HudBadgeProps) {
    return (
        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border select-none ${TONES[tone]} ${className}`}>
            {children}
        </span>
    )
}
