"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useSession, signOut } from "next-auth/react"
import { Menu, Search, Bell, ChevronDown, User, History as HistoryIcon, LogOut } from "lucide-react"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { getNavOpenSnapshot, getNavOpenServerSnapshot, subscribeNavOpen, toggleNav } from "./navStore"
import { openCmdk } from "./cmdkStore"
import type { AgentSummary } from "./types"

const TABS = [
    { label: "Dashboard", href: "/dashboard", current: true },
    { label: "Daily Task", href: "/daily-tasks", pip: true },
    { label: "Debug Lab", href: "/debug-lab" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "History", href: "/history" },
]

function getHoursUntilMidnight() {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    return Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 3600000))
}

function usePopover() {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("click", onClick)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("click", onClick)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    return { open, setOpen, ref }
}

export default function Topbar({ agent }: { agent: AgentSummary }) {
    const { data: session } = useSession()
    const navOpen = useSyncExternalStore(subscribeNavOpen, getNavOpenSnapshot, getNavOpenServerSnapshot)
    const bell = usePopover()
    const menu = usePopover()
    const [hoursLeft, setHoursLeft] = useState<number | null>(null)

    useEffect(() => {
        setHoursLeft(getHoursUntilMidnight())
        const timer = setInterval(() => setHoursLeft(getHoursUntilMidnight()), 60000)
        return () => clearInterval(timer)
    }, [])

    const initials = agent.displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return (
        <header className="flex items-center gap-2 h-[52px] px-3 md:px-5 shrink-0 border-b border-dash-line sticky top-[56px] z-30 bg-[rgba(8,11,9,.82)] backdrop-blur-[14px]">
            <button
                type="button"
                onClick={() => toggleNav()}
                aria-label={navOpen ? "Close navigation" : "Open navigation"}
                className="md:hidden size-8 rounded-[8px] grid place-items-center text-dash-text-dim hover:bg-dash-surface-2 hover:text-dash-text transition-colors -ml-1.5"
            >
                <Menu className="size-4 stroke-[1.75]" />
            </button>

            <nav className="flex gap-0.5 h-full items-center overflow-x-auto no-scrollbar" aria-label="Primary">
                {TABS.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-current={tab.current ? "page" : undefined}
                        className={`h-[30px] px-2.5 rounded-[8px] text-[13px] font-medium flex items-center whitespace-nowrap transition-colors ${
                            tab.current ? "bg-dash-surface-2 text-dash-text" : "text-dash-text-dim hover:bg-dash-surface-2 hover:text-dash-text"
                        }`}
                    >
                        {tab.label}
                        {tab.pip && <span className="size-[5px] rounded-full bg-dash-accent ml-1.5" />}
                    </Link>
                ))}
            </nav>

            <div className="ml-auto flex items-center gap-1">
                <button
                    type="button"
                    onClick={openCmdk}
                    className="hidden sm:flex items-center gap-2 h-8 px-2.5 min-w-[210px] bg-dash-surface border border-dash-line rounded-[8px] text-dash-text-faint text-[12.5px] hover:border-dash-line-strong hover:bg-dash-surface-2 transition-colors"
                >
                    <Search className="size-3.5 stroke-[1.75]" />
                    Search missions
                    <kbd className="ml-auto font-dash-mono text-[9.5px] text-dash-text-faint border border-dash-line-strong rounded px-1 py-px bg-dash-surface-2">
                        ⌘K
                    </kbd>
                </button>

                <div className="relative" ref={bell.ref}>
                    <button
                        type="button"
                        onClick={() => bell.setOpen((v) => !v)}
                        aria-label="Notifications"
                        className="relative size-8 rounded-[8px] grid place-items-center text-dash-text-dim hover:bg-dash-surface-2 hover:text-dash-text transition-colors"
                    >
                        <Bell className="size-4 stroke-[1.75]" />
                        <span className="absolute top-1.5 right-[7px] size-1.5 rounded-full bg-dash-orange border-2 border-dash-bg" />
                    </button>
                    {bell.open && (
                        <div className="absolute right-0 top-[calc(100%+7px)] min-w-[212px] p-1 bg-dash-surface-2 border border-dash-line-strong rounded-[14px] shadow-[0_12px_32px_-8px_rgba(0,0,0,.7)] z-[100]">
                            <div className="px-2.5 pt-2.5 pb-2 border-b border-dash-line mb-1">
                                <div className="text-[12.5px] font-semibold">Notifications</div>
                                <div className="font-dash-mono text-[10px] text-dash-text-faint mt-0.5">1 unread</div>
                            </div>
                            <div className="px-2.5 py-2 text-[11.5px] text-dash-text-faint leading-relaxed">
                                <strong className="text-dash-orange">
                                    Daily task expires in {hoursLeft ?? "—"}h.
                                </strong>
                                <br />
                                Finish it to keep your streak.
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={menu.ref}>
                    <button
                        type="button"
                        onClick={() => menu.setOpen((v) => !v)}
                        className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-[8px] hover:bg-dash-surface-2 transition-colors"
                    >
                        <span className="size-6 rounded-[7px] grid place-items-center bg-[var(--dash-accent-wash)] border border-dash-accent-mid text-dash-accent font-dash-display font-semibold text-[11px]">
                            {initials || "U"}
                        </span>
                        <ChevronDown className="size-[13px] stroke-2 text-dash-text-faint" />
                    </button>
                    {menu.open && (
                        <div className="absolute right-0 top-[calc(100%+7px)] min-w-[212px] p-1 bg-dash-surface-2 border border-dash-line-strong rounded-[14px] shadow-[0_12px_32px_-8px_rgba(0,0,0,.7)] z-[100]">
                            <div className="px-2.5 pt-2.5 pb-2 border-b border-dash-line mb-1">
                                <div className="text-[12.5px] font-semibold">{agent.displayName}</div>
                                <div className="font-dash-mono text-[10px] text-dash-text-faint mt-0.5">
                                    {agent.agentId} · Rank {String(agent.rank).padStart(2, "0")}
                                </div>
                            </div>
                            <Link
                                href="/profile"
                                className="flex items-center gap-2.5 h-[31px] px-2.5 rounded-[8px] text-[12.5px] text-dash-text-dim hover:bg-dash-surface-3 hover:text-dash-text transition-colors"
                            >
                                <User className="size-3.5 stroke-[1.75]" /> Profile
                            </Link>
                            <Link
                                href="/history"
                                className="flex items-center gap-2.5 h-[31px] px-2.5 rounded-[8px] text-[12.5px] text-dash-text-dim hover:bg-dash-surface-3 hover:text-dash-text transition-colors"
                            >
                                <HistoryIcon className="size-3.5 stroke-[1.75]" /> Aura history
                            </Link>
                            {session && (
                                <button
                                    type="button"
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="flex items-center gap-2.5 w-full h-[31px] px-2.5 rounded-[8px] text-[12.5px] text-dash-text-dim hover:bg-dash-surface-3 hover:text-dash-text transition-colors text-left"
                                >
                                    <LogOut className="size-3.5 stroke-[1.75]" /> Sign out
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
