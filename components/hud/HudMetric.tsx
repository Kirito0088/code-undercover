import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { HudPanel } from "./HudPanel"

interface HudMetricProps {
    icon: LucideIcon
    label: string
    value: ReactNode
    hint?: string
    tag?: string
    iconClass?: string
    valueClass?: string
    className?: string
}

/**
 * Standard metric tile: icon + uppercase label row, bold value, and a quiet
 * hint line. One shared shape for the OPERATIONAL AP / FIELD CLASSIF readouts
 * and the history stats row so metric labels never drift between pages.
 */
export function HudMetric({
    icon: Icon,
    label,
    value,
    hint,
    tag,
    iconClass = "text-accent",
    valueClass = "text-text",
    className = "",
}: HudMetricProps) {
    return (
        <HudPanel radius="lg" className={`p-4 flex flex-col justify-between text-left min-h-0 ${className}`}>
            <div className="flex justify-between items-start mb-1">
                <span className="text-muted text-[9px] font-mono tracking-wider flex items-center gap-1 uppercase select-none">
                    <Icon className={`size-3.5 ${iconClass}`} />
                    {label}
                </span>
                {tag && <span className="text-[8px] font-mono text-muted select-none">{tag}</span>}
            </div>
            <div>
                <span className={`block font-mono font-bold tracking-tight ${valueClass}`}>{value}</span>
                {hint && <span className="text-[9px] text-muted mt-0.5 block">{hint}</span>}
            </div>
        </HudPanel>
    )
}
