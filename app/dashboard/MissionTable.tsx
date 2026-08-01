"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Terminal, Shield, Cpu, Lock, CheckCircle2, Play } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { DashboardMission } from "@/types"

const difficultyConfig = {
    EASY: { icon: Terminal, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    MEDIUM: { icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    HARD: { icon: Cpu, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
} as const

function MissionRow({ mission }: { mission: DashboardMission }) {
    const { push } = useRouter()
    const [loading, setLoading] = useState(false)
    const diff = difficultyConfig[mission.difficulty as keyof typeof difficultyConfig] || difficultyConfig.EASY
    const DiffIcon = diff.icon

    const isLocked = mission.status === "LOCKED"
    const isCompleted = mission.status === "COMPLETED"
    const isActive = mission.status === "ACTIVE"

    const handleAccept = async () => {
        if (isLocked || loading) return
        setLoading(true)
        try {
            const res = await fetch("/api/missions/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id }),
            })
            const data = await res.json()
            if (res.ok && data.redirect) {
                push(data.redirect)
                return
            }
        } catch {
            console.error("Failed to accept mission")
        }
        setLoading(false)
    }

    return (
        <tr className="hover:bg-white/[.03] transition-colors group">
            <td className="px-6 py-4 align-middle font-mono text-xs font-bold text-[#5E6B65]">
                {String(mission.order).padStart(2, "0")}
            </td>
            <td className="px-6 py-4 align-middle">
                <span className={`font-mono text-sm font-semibold block truncate ${isLocked ? "text-[#5E6B65]" : "text-[#E2E8F0]"}`}>
                    {mission.title}
                </span>
            </td>
            <td className="px-6 py-4 align-middle">
                {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> COMPLETED
                    </span>
                )}
                {isActive && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE
                    </span>
                )}
                {isLocked && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#5E6B65]">
                        <Lock className="size-3" /> LOCKED
                    </span>
                )}
            </td>
            <td className="px-6 py-4 align-middle">
                <span className={`font-mono text-xs font-semibold ${isLocked ? "text-[#5E6B65]" : "text-emerald-400"}`}>
                    +{mission.auraReward} AP
                </span>
            </td>
            <td className="px-6 py-4 align-middle">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md border inline-flex items-center gap-1.5 ${isLocked ? "bg-white/[.03] text-[#5E6B65] border-white/[.06]" : `${diff.bg} ${diff.color} ${diff.border}`}`}>
                    <DiffIcon className="size-3" />
                    {mission.difficulty}
                </span>
            </td>
            <td className="px-6 py-4 align-middle text-right">
                {isActive && (
                    <Button
                        variant="default"
                        size="sm"
                        className="text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-black border-none"
                        onClick={handleAccept}
                        disabled={loading}
                    >
                        <Play className="size-3 mr-1" />
                        {loading ? "LOADING..." : "ACCEPT"}
                    </Button>
                )}
                {isCompleted && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                        onClick={handleAccept}
                        disabled={loading}
                    >
                        REVIEW
                    </Button>
                )}
                {isLocked && <span className="text-xs font-mono text-[#5E6B65]">—</span>}
            </td>
        </tr>
    )
}

export default function MissionTable({ missions }: { missions: DashboardMission[] }) {
    return (
        <div className="flex-1 min-h-0 bg-[#111413] border border-white/[.06] rounded-xl overflow-hidden flex flex-col">
            <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="border-b border-white/[.06] bg-[#111413] select-none text-[10px] uppercase font-bold tracking-wider text-[#5E6B65]">
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">Mission</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">AP</th>
                            <th className="px-6 py-4">Difficulty</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[.06]">
                        {missions.map((mission) => (
                            <MissionRow key={mission.id} mission={mission} />
                        ))}
                        {missions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-[#5E6B65] font-mono text-xs">
                                    No missions available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
