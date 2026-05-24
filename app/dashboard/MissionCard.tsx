"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Terminal, Shield, Cpu, Code, Lock, CheckCircle2, Play } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { DashboardMission } from "@/types"

const difficultyConfig = {
    EASY: {
        icon: Terminal,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    MEDIUM: {
        icon: Shield,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
    },
    HARD: {
        icon: Cpu,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
    },
} as const

export function MissionCard({ mission }: { mission: DashboardMission }) {
    const router = useRouter()
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
                router.push(data.redirect)
                // Keep loading state true so button remains disabled while routing
                return
            }
        } catch {
            console.error("Failed to accept mission")
        }
        setLoading(false)
    }

    return (
        <div
            className={`relative rounded-xl p-6 border transition-all duration-300 shadow-lg overflow-hidden group ${isLocked
                ? "bg-[#0D0D14] border-[#323242] opacity-50"
                : isCompleted
                    ? "bg-[#1C1C24] border-emerald-500/20"
                    : "bg-[#1C1C24] border-[#323242] hover:border-[#3F3F52] hover:bg-[#14141C]"
                } ${isActive && !isCompleted ? "border-l-2 border-l-indigo-500" : ""}`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <DiffIcon className={`h-5 w-5 ${isLocked ? "text-[#3A3A52]" : diff.color}`} />
                    <span className="text-xs font-mono text-[#5C5C7A]">#{String(mission.order).padStart(2, "0")}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isActive && !isCompleted && (
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium">
                            In Progress
                        </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${isLocked ? "bg-[#2A2A35] text-[#5C5C7A] border-[#323242]" : `${diff.bg} ${diff.color} ${diff.border}`
                        }`}>
                        {mission.difficulty}
                    </span>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                    {isLocked && <Lock className="h-4 w-4 text-[#3A3A52]" />}
                </div>
            </div>

            {/* Title */}
            <h3 className={`text-lg font-semibold mb-2 ${isLocked ? "text-[#3A3A52]" : "text-[#F1F1F5]"}`}>
                {mission.title}
            </h3>

            {/* Description */}
            <p className={`text-sm mb-6 line-clamp-3 ${isLocked ? "text-[#3A3A52]" : "text-[#8B8BA7]"}`}>
                {isLocked ? "Complete the previous mission to unlock this briefing." : mission.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#323242]">
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono flex items-center gap-1 ${isLocked ? "text-[#3A3A52]" : "text-[#5C5C7A]"}`}>
                        <Code className="h-3 w-3" /> {mission.language}
                    </span>
                    <span className={`text-xs font-mono ${isLocked ? "text-[#3A3A52]" : "text-indigo-400"}`}>
                        +{mission.auraReward} AP
                    </span>
                </div>

                {isActive && (
                    <Button
                        variant="default"
                        size="sm"
                        className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white border-none"
                        onClick={handleAccept}
                        disabled={loading}
                    >
                        <Play className="h-3 w-3 mr-1" />
                        {loading ? "LOADING..." : "ACCEPT"}
                    </Button>
                )}
                {isCompleted && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                        onClick={handleAccept}
                        disabled={loading}
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" /> REVIEW
                    </Button>
                )}
                {isLocked && (
                    <span className="text-xs font-mono text-[#3A3A52] flex items-center gap-1">
                        <Lock className="h-3 w-3" /> LOCKED
                    </span>
                )}
            </div>
        </div>
    )
}
