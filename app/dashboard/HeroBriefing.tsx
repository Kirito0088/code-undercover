"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Play } from "lucide-react"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import DailyResetCountdown from "./DailyResetCountdown"
import type { AgentSummary, Mission, Sector } from "./types"

// Renamed from the reference's "MissionIntelStory" — that filename is already a
// real, unrelated feature in this app (a one-time "Origins of C" onboarding
// modal, app/dashboard/MissionIntelStory.tsx, gated by localStorage). Kept it
// intact rather than overwriting it; this is the new Level 1 briefing instead.
export default function HeroBriefing({
    agent,
    activeSector,
    nextMission,
}: {
    agent: AgentSummary
    activeSector: Sector
    nextMission: Mission | null
}) {
    const { push } = useRouter()
    const [loading, setLoading] = useState(false)

    const briefing = `Panda, Signal VX-013 just went dark over ${activeSector.codename}. Clear all ${activeSector.missionsTotal} nodes and bring our trace back online.`
    const [typed, setTyped] = useState("")
    const [typingDone, setTypingDone] = useState(false)

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reduceMotion) {
            setTyped(briefing)
            setTypingDone(true)
            return
        }
        let i = 0
        const timer = setInterval(() => {
            i++
            setTyped(briefing.slice(0, i))
            if (i >= briefing.length) {
                clearInterval(timer)
                setTypingDone(true)
            }
        }, 18)
        return () => clearInterval(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [briefing])

    const primaryLabel = nextMission ? `Start mission ${String(nextMission.index).padStart(2, "0")}` : `${activeSector.codename} cleared`

    const handleStart = async () => {
        if (!nextMission || loading) return
        setLoading(true)
        try {
            const res = await fetch("/api/missions/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: nextMission.id }),
            })
            const data = await res.json()
            if (res.ok && data.redirect) {
                push(data.redirect)
                return
            }
        } catch {
            console.error("Failed to start mission")
        }
        setLoading(false)
    }

    return (
        <section className="relative overflow-hidden border border-dash-line rounded-[18px] p-6 flex flex-wrap items-start gap-8 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] bg-dash-surface bg-[radial-gradient(110%_150%_at_0%_0%,var(--dash-accent-glow),transparent_58%)]">
            <div
                aria-hidden
                className="dash-scanline pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-dash-text to-transparent"
            />

            <div className="relative flex-1 min-w-[290px]">
                <div className="flex items-center gap-2 mb-3 font-dash-mono text-[10px] tracking-[.12em] uppercase text-dash-text-faint">
                    <span className="dash-pulse size-[5px] rounded-full bg-dash-accent" />
                    Transmission from Wolf · HQ Director · channel open
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-dash-mono text-[9.5px] font-medium tracking-[.16em] uppercase text-dash-text-faint">
                        Mission control
                    </span>
                    <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-full border border-dash-accent-mid bg-[var(--dash-accent-wash)] font-dash-mono text-[9.5px] font-medium tracking-[.1em] uppercase text-dash-accent">
                        <span className="size-[5px] bg-current" />
                        {activeSector.codename}
                    </span>
                    {agent.streakDays > 0 && (
                        <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-full border border-dash-orange-mid bg-[var(--dash-orange-wash)] font-dash-mono text-[9.5px] font-medium tracking-[.1em] uppercase text-dash-orange">
                            <span className="size-[5px] bg-current" />
                            {agent.streakDays}-day streak
                        </span>
                    )}
                </div>

                <h1 className="dash-glitch-once font-dash-display font-semibold text-[clamp(23px,2.5vw,30px)] tracking-[-.03em] leading-[1.12] mt-3 mb-2">
                    Take control. Decrypt. Defend.
                </h1>

                <p aria-hidden className="text-dash-text-dim max-w-[50ch] text-[13.5px] min-h-[1.4em]">
                    {typed}
                    {!typingDone && <span className="dash-cursor inline-block w-[2px] h-[1em] align-middle bg-dash-text-dim ml-0.5" />}
                </p>
                <p className="sr-only">{briefing}</p>

                <div className="flex gap-2 mt-5 flex-wrap">
                    <button
                        type="button"
                        onClick={handleStart}
                        disabled={!nextMission || loading}
                        className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-[8px] text-[13px] font-semibold bg-dash-accent text-dash-accent-ink shadow-[0_5px_18px_-8px_var(--dash-accent)] hover:bg-dash-accent-hover hover:shadow-[0_7px_22px_-8px_var(--dash-accent)] active:translate-y-px transition-all disabled:opacity-60 disabled:shadow-none"
                    >
                        <Play className="size-3.5" fill="currentColor" />
                        {loading ? "Loading…" : primaryLabel}
                    </button>
                    <Link
                        href="/daily-tasks"
                        className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-[8px] text-[13px] font-medium bg-dash-surface-2 border border-dash-line-strong text-dash-text-dim hover:bg-dash-surface-3 hover:text-dash-text hover:border-dash-surface-4 active:translate-y-px transition-all"
                    >
                        Daily task
                    </Link>
                    <Link
                        href="/debug-lab"
                        className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-[8px] text-[13px] font-medium bg-dash-surface-2 border border-dash-line-strong text-dash-text-dim hover:bg-dash-surface-3 hover:text-dash-text hover:border-dash-surface-4 active:translate-y-px transition-all"
                    >
                        Debug Lab
                    </Link>
                </div>
            </div>

            <DailyResetCountdown />
        </section>
    )
}
