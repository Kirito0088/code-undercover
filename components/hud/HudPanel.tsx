import type { HTMLAttributes } from "react"

interface HudPanelProps extends HTMLAttributes<HTMLDivElement> {
    radius?: "md" | "lg" | "xl"
}

const RADIUS: Record<NonNullable<HudPanelProps["radius"]>, string> = {
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
}

/**
 * Shared agent-console panel: surface fill, hairline border, corner brackets,
 * and the signature top-right radial glow. Replaces hand-rolled `bg-[#0D0E12]
 * border border-emerald-500/20` card markup so every panel shares one radius,
 * one border tone, and one chrome treatment.
 */
export function HudPanel({ radius = "lg", className = "", children, ...rest }: HudPanelProps) {
    return (
        <div
            className={`relative overflow-hidden bg-surface border border-border ${RADIUS[radius]} ${className}`}
            {...rest}
        >
            <span className="absolute top-0 left-0 size-3 border-t border-l border-accent/40 pointer-events-none" />
            <span className="absolute top-0 right-0 size-3 border-t border-r border-accent/40 pointer-events-none" />
            <span className="absolute bottom-0 left-0 size-3 border-b border-l border-accent/40 pointer-events-none" />
            <span className="absolute bottom-0 right-0 size-3 border-b border-r border-accent/40 pointer-events-none" />
            <div className="absolute top-0 right-0 size-32 bg-[radial-gradient(ellipse_at_top_right,rgba(183,135,66,0.06),transparent_70%)] pointer-events-none" />
            {children}
        </div>
    )
}
