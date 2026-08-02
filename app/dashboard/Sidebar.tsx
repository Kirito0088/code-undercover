"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { LayoutGrid, Users, Settings, ChevronLeft } from "lucide-react"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { getNavOpenSnapshot, getNavOpenServerSnapshot, subscribeNavOpen, closeNav } from "./navStore"
import type { AgentSummary, Sector } from "./types"

const RAIL_KEY = "cu:sidebar-rail"

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, current: true },
    { label: "Clubs", href: "/leaderboard", icon: Users, current: false },
    { label: "Settings", href: "/profile", icon: Settings, current: false },
]

const SCRAMBLE_CHARS = "0123456789ABCDEF"

// Count-up with a brief hex-scramble lead-in (250ms), settling to the real value.
function useScrambleCountUp(target: number, suffix: string, digits: number) {
    const [display, setDisplay] = useState(`${"0".repeat(digits)}${suffix}`)

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reduceMotion) {
            setDisplay(`${target}${suffix}`)
            return
        }

        const duration = 600
        const scrambleFor = 250
        const start = performance.now()
        let raf: number

        const tick = (now: number) => {
            const elapsed = now - start
            if (elapsed < scrambleFor) {
                const scrambled = Array.from({ length: digits }, () => SCRAMBLE_CHARS[Math.floor(Math.random() * 16)]).join("")
                setDisplay(`${scrambled}${suffix}`)
                raf = requestAnimationFrame(tick)
            } else if (elapsed < duration) {
                const progress = (elapsed - scrambleFor) / (duration - scrambleFor)
                setDisplay(`${Math.round(target * progress)}${suffix}`)
                raf = requestAnimationFrame(tick)
            } else {
                setDisplay(`${target}${suffix}`)
            }
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target, suffix, digits])

    return display
}

interface SidebarProps {
    agent: AgentSummary
    sectors: Sector[]
}

function SidebarContent({ agent, sectors, rail, onToggleRail }: SidebarProps & { rail: boolean; onToggleRail: () => void }) {
    const initials = agent.displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    const xpDisplay = useScrambleCountUp(agent.xpToNextRank, " XP", String(agent.xpToNextRank).length)
    const apDisplay = useScrambleCountUp(agent.auraPoints, " AP", String(agent.auraPoints).length)

    return (
        <>
            <div className="flex items-center gap-2 h-[52px] px-4 shrink-0 border-b border-dash-line">
                <span className="size-[26px] rounded-[7px] shrink-0 grid place-items-center bg-[var(--dash-accent-wash)] border border-dash-accent-mid text-dash-accent font-dash-mono text-[11px] font-semibold">
                    {"<>"}
                </span>
                {!rail && (
                    <span className="font-dash-display text-sm font-semibold tracking-tight whitespace-nowrap">
                        Code Undercover
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-3">
                {!rail && (
                    <div className="mx-3 mt-3 p-3 bg-dash-surface-2 border border-dash-line rounded-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-[9px] shrink-0 grid place-items-center bg-[var(--dash-accent-wash)] border border-dash-accent-mid text-dash-accent font-dash-display font-semibold text-[13px]">
                                {initials || "U"}
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-[13px] tracking-tight truncate">{agent.displayName}</div>
                                <div className="font-dash-mono text-[10px] text-dash-text-faint mt-px truncate">
                                    {agent.agentId} · Rank {String(agent.rank).padStart(2, "0")}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-3">
                            <div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-[11px] text-dash-text-dim">Next rank</span>
                                    <span className="font-dash-mono text-[11px] font-medium text-dash-accent tabular-nums">
                                        {xpDisplay}
                                    </span>
                                </div>
                                <div className="h-1 rounded-full bg-dash-surface-4 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-dash-accent transition-[width] duration-500"
                                        style={{ width: `${Math.round(agent.xpProgress * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-[11px] text-dash-text-dim">Aura points</span>
                                    <span className="font-dash-mono text-[11px] font-medium text-dash-orange tabular-nums">
                                        {apDisplay}
                                    </span>
                                </div>
                                <div className="h-1 rounded-full bg-dash-surface-4 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-dash-orange transition-[width] duration-500"
                                        style={{ width: `${Math.min(100, (agent.auraPoints / 500) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <nav className="px-3 pt-4 flex flex-col gap-px">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                data-tip={rail ? item.label : undefined}
                                data-tip-side="right"
                                aria-current={item.current ? "page" : undefined}
                                className={`flex items-center gap-3 h-[34px] px-2 rounded-[8px] text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    item.current
                                        ? "bg-[var(--dash-accent-wash)] text-dash-accent"
                                        : "text-dash-text-dim hover:bg-dash-surface-2 hover:text-dash-text"
                                }`}
                            >
                                <Icon className="size-4 stroke-[1.75] ml-[5px] shrink-0" />
                                {!rail && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {!rail && (
                    <div className="px-3 pt-5">
                        <div className="font-dash-mono text-[9.5px] font-medium tracking-[.16em] uppercase text-dash-text-faint px-2 pb-2">
                            Active sectors
                        </div>
                        <div className="flex flex-col gap-px">
                            {sectors.map((sector) => (
                                <div
                                    key={sector.id}
                                    data-tip={sector.locked ? sector.unlockHint : undefined}
                                    data-tip-side="right"
                                    className="flex items-center gap-2.5 h-[30px] px-2 rounded-[8px] text-[12.5px] text-dash-text-dim"
                                >
                                    <span className={`size-1.5 rounded-full shrink-0 ${sector.locked ? "bg-dash-line-strong" : "bg-dash-accent"}`} />
                                    <span className={sector.locked ? "" : "text-dash-text"}>{sector.codename}</span>
                                    <span className="ml-auto font-dash-mono text-[10px] text-dash-text-faint">
                                        {sector.locked ? "Locked" : `${Math.round((sector.missionsDone / sector.missionsTotal) * 100)}%`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-dash-line p-2 shrink-0">
                <button
                    type="button"
                    onClick={onToggleRail}
                    aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex items-center gap-3 w-full h-8 px-2.5 rounded-[8px] text-dash-text-faint text-xs hover:bg-dash-surface-2 hover:text-dash-text-dim transition-colors"
                >
                    <ChevronLeft className={`size-[15px] stroke-[1.75] transition-transform duration-200 ${rail ? "rotate-180" : ""}`} />
                    {!rail && <span>Collapse</span>}
                </button>
            </div>
        </>
    )
}

export default function Sidebar({ agent, sectors }: SidebarProps) {
    const [rail, setRail] = useState(false)
    const navOpen = useSyncExternalStore(subscribeNavOpen, getNavOpenSnapshot, getNavOpenServerSnapshot)

    useEffect(() => {
        if (localStorage.getItem(RAIL_KEY) === "1") setRail(true)
    }, [])

    useEffect(() => {
        if (!navOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeNav()
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [navOpen])

    const toggleRail = () => {
        setRail((prev) => {
            const next = !prev
            localStorage.setItem(RAIL_KEY, next ? "1" : "0")
            return next
        })
    }

    return (
        <>
            {/* Desktop / tablet rail */}
            <aside
                className={`hidden md:flex flex-col shrink-0 bg-dash-surface border-r border-dash-line sticky top-[56px] h-[calc(100dvh-56px)] transition-[width] duration-200 z-40 ${
                    rail ? "w-[60px]" : "w-[252px]"
                }`}
            >
                <SidebarContent agent={agent} sectors={sectors} rail={rail} onToggleRail={toggleRail} />
            </aside>

            {/* Mobile off-canvas */}
            {navOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={closeNav} />
                    <aside className="absolute left-0 top-0 h-full w-[252px] flex flex-col bg-dash-surface border-r border-dash-line">
                        <SidebarContent agent={agent} sectors={sectors} rail={false} onToggleRail={toggleRail} />
                    </aside>
                </div>
            )}
        </>
    )
}
