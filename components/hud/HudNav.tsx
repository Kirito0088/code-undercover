import { LayoutDashboard, BookOpen, History, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { HudPanel } from "./HudPanel"
import { HudBadge } from "./HudBadge"

export type HudChannel = "dashboard" | "levels" | "history" | "daily"

interface HudNavProps {
    active: HudChannel
    className?: string
}

interface Channel {
    id: HudChannel
    href: string
    label: string
    icon: LucideIcon
    badge: string
}

const CHANNELS: Channel[] = [
    { id: "dashboard", href: "/dashboard", label: "HUD_01_CONTROL", icon: LayoutDashboard, badge: "OPEN" },
    { id: "levels", href: "/levels", label: "HUD_02_SECTORS", icon: BookOpen, badge: "OPEN" },
    { id: "history", href: "/history", label: "HUD_03_CHRONO", icon: History, badge: "LOGS" },
    { id: "daily", href: "/daily-tasks", label: "HUD_04_DAILY", icon: Zap, badge: "NEW" },
]

/**
 * The shared console-channel nav (HUD_01..04) that every authenticated page
 * previously re-implemented with slightly different radii, badges, and hover
 * styles. The active channel gets the surface lift + emerald fill; the rest
 * stay quiet until hovered.
 */
export function HudNav({ active, className = "" }: HudNavProps) {
    return (
        <HudPanel radius="lg" className={`p-2.5 ${className}`}>
            <div className="text-[10px] font-mono tracking-widest text-muted uppercase px-2 mb-1.5 select-none">
                Console Channels
            </div>
            <nav className="flex flex-col gap-1">
                {CHANNELS.map((channel) => {
                    const isActive = channel.id === active
                    const Icon = channel.icon
                    return (
                        <Link
                            key={channel.id}
                            href={channel.href}
                            className={`group flex items-center justify-between px-2.5 py-2 rounded-md font-medium text-xs transition-all duration-200 border min-h-11 sm:min-h-0 ${
                                isActive
                                    ? "bg-surface text-accent border-border"
                                    : "text-muted hover:bg-surface/40 hover:text-accent border-transparent hover:border-border"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon
                                    className={`size-3.5 transition-colors ${
                                        isActive ? "text-accent" : "text-muted group-hover:text-accent"
                                    }`}
                                />
                                <span className="font-mono text-[10px]">{channel.label}</span>
                            </div>
                            <HudBadge tone={isActive ? "active" : "dim"}>
                                {isActive ? "LIVE" : channel.badge}
                            </HudBadge>
                        </Link>
                    )
                })}
            </nav>
        </HudPanel>
    )
}
