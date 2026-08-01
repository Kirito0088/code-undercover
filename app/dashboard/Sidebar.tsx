"use client"

import { useState } from "react"
import { Search, LayoutDashboard, Users, Settings, Menu, X } from "lucide-react"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"

export interface SidebarSector {
    name: string
    status: "active" | "locked" | "complete"
}

export interface AppSidebarProps {
    agentName: string
    agentIdShort: string
    rank: string
    rankColorClass: string
    rankShadowClass: string
    auraPoints: number
    nextThreshold: number
    sectors: SidebarSector[]
    className?: string
}

const statusDotClass: Record<SidebarSector["status"], string> = {
    active: "bg-emerald-400 animate-pulse",
    complete: "bg-emerald-500",
    locked: "bg-[#3A423C]",
}

// ─── Desktop sidebar: agent profile, rank progress, nav, active sectors, CTA ───
export function AppSidebar({
    agentName,
    agentIdShort,
    rank,
    rankColorClass,
    rankShadowClass,
    auraPoints,
    nextThreshold,
    sectors,
    className = "hidden lg:flex sticky top-0 h-screen",
}: AppSidebarProps) {
    const progressPercent = Math.round(Math.min(100, (auraPoints / nextThreshold) * 100))

    return (
        <aside className={`flex flex-col w-[280px] shrink-0 bg-[#111413] border-r border-white/[.06] overflow-y-auto ${className}`}>
            {/* Agent Profile Card */}
            <div className="p-5 border-b border-white/[.06]">
                <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-lg font-mono font-bold text-emerald-400 shadow-inner shrink-0">
                        {agentName[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-mono font-bold text-[#E2E8F0] truncate">
                            {agentName}
                        </div>
                        <div className="text-[10px] font-mono text-[#5E6B65] truncate">
                            ID: {agentIdShort}
                        </div>
                    </div>
                </div>

                <div className="inline-flex items-center gap-1.5 mt-3 bg-[#161820]/50 border border-white/[.06] px-2 py-0.5 rounded-sm">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-[#8F9F8F]">
                        Clearance: <span className={`${rankColorClass} ${rankShadowClass}`}>{rank}</span>
                    </span>
                </div>

                {/* Rank Progress Bar */}
                <div className="mt-3">
                    <div className="flex justify-between text-[9px] font-mono text-[#8F9F8F] mb-1">
                        <span>RANK PROGRESS</span>
                        <span className="text-emerald-400">{progressPercent}%</span>
                    </div>
                    <div className="flex gap-1 h-1.5 w-full">
                        {Array.from({ length: 20 }).map((_, i) => {
                            const isFilled = i < Math.floor((progressPercent / 100) * 20)
                            return (
                                <div
                                    key={i}
                                    className={`h-full flex-1 rounded-none transition-all duration-300 ${
                                        isFilled ? "bg-emerald-400" : "bg-emerald-950"
                                    }`}
                                />
                            )
                        })}
                    </div>
                </div>

                {/* AP Display */}
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-mono tracking-widest text-[#5E6B65] uppercase">Aura Points</span>
                    <span className="text-sm font-mono font-bold text-[#E2E8F0]">{auraPoints} AP</span>
                </div>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative flex items-center bg-[#181C18] border border-white/[.06] rounded-lg px-3 py-2 cursor-pointer hover:border-emerald-500/30 transition-all">
                    <Search className="size-4 text-[#5E6B65] mr-2 shrink-0" />
                    <span className="text-xs text-[#5E6B65] flex-1">Search</span>
                    <kbd className="bg-[#111413] text-[#5E6B65] border border-white/[.06] px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                        ⌘K
                    </kbd>
                </div>
            </div>

            {/* Navigation */}
            <nav className="px-3 space-y-1">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-emerald-400 bg-[#181C18] font-medium border border-white/[.06]"
                >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                </Link>
                <Link
                    href="/leaderboard"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8F9F8F] hover:text-[#E2E8F0] hover:bg-[#181C18] transition-colors"
                >
                    <Users className="size-4" />
                    Clubs
                </Link>
                <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8F9F8F] hover:text-[#E2E8F0] hover:bg-[#181C18] transition-colors"
                >
                    <Settings className="size-4" />
                    Settings
                </Link>
            </nav>

            {/* Active Sectors */}
            <div className="px-3 mt-6">
                <span className="block px-3 mb-2 text-[10px] uppercase font-bold tracking-wider text-[#5E6B65]">
                    Active Sectors
                </span>
                <div className="space-y-0.5">
                    {sectors.map((sector) => (
                        <div
                            key={sector.name}
                            className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-[#8F9F8F]"
                        >
                            <div className={`size-2 rounded-full ${statusDotClass[sector.status]}`} />
                            {sector.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Primary CTA */}
            <div className="mt-auto p-4 border-t border-white/[.06]">
                <Link
                    href="/levels"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold shadow-[0_0_24px_rgba(52,211,153,.25)] transition-colors"
                >
                    Resume Mission
                </Link>
            </div>
        </aside>
    )
}

// ─── Mobile drawer: hamburger trigger + off-canvas overlay wrapping AppSidebar ───
export default function MobileSidebarDrawer(props: AppSidebarProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden inline-flex items-center justify-center size-9 rounded-lg border border-white/[.06] bg-[#111413] text-[#8F9F8F] hover:text-emerald-400 hover:border-emerald-500/30 transition-colors shrink-0"
            >
                <Menu className="size-4" />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] shadow-2xl">
                        <AppSidebar {...props} className="flex h-full" />
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close navigation menu"
                            className="absolute top-4 right-[-44px] size-9 inline-flex items-center justify-center rounded-lg bg-[#111413] border border-white/[.06] text-[#8F9F8F] hover:text-emerald-400"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
