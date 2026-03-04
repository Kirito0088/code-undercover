"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Terminal, Shield, Cpu, Code, Lock, CheckCircle2, Play } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { DashboardMission } from "@/types"

const difficultyConfig = {
    EASY: {
        icon: Terminal,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
    },
    MEDIUM: {
        icon: Shield,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
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
        if (isLocked) return
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
            }
        } catch {
            console.error("Failed to accept mission")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className={`relative rounded-xl p-6 border transition-all duration-300 shadow-lg overflow-hidden group ${isLocked
                ? "bg-gray-900/30 border-gray-800/50 opacity-60"
                : isCompleted
                    ? "bg-gray-900/40 border-green-900/30"
                    : "bg-gray-900/50 border-gray-800 hover:border-green-500/40 hover:bg-gray-800/50"
                }`}
        >
            {/* Top glow for active */}
            {isActive && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
            )}
            {/* Top glow for completed */}
            {isCompleted && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-600/50 to-transparent"></div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <DiffIcon className={`h-5 w-5 ${isLocked ? "text-gray-600" : diff.color}`} />
                    <span className="text-xs font-mono text-gray-500">#{String(mission.order).padStart(2, "0")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded-sm border ${isLocked ? "bg-gray-800/50 text-gray-600 border-gray-700" : `${diff.bg} ${diff.color} ${diff.border}`
                        }`}>
                        [{mission.difficulty}]
                    </span>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {isLocked && <Lock className="h-4 w-4 text-gray-600" />}
                </div>
            </div>

            {/* Title */}
            <h3 className={`text-lg font-bold mb-2 ${isLocked ? "text-gray-600" : "text-white"}`}>
                {mission.title}
            </h3>

            {/* Description */}
            <p className={`text-sm mb-6 line-clamp-3 ${isLocked ? "text-gray-700" : "text-gray-400"}`}>
                {isLocked ? "Complete the previous mission to unlock this briefing." : mission.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono flex items-center gap-1 ${isLocked ? "text-gray-700" : "text-gray-500"}`}>
                        <Code className="h-3 w-3" /> {mission.language}
                    </span>
                    <span className={`text-xs font-bold font-mono ${isLocked ? "text-gray-700" : "text-blue-400"}`}>
                        +{mission.auraReward} AURA
                    </span>
                </div>

                {isActive && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="font-mono text-xs font-bold bg-green-500 text-black border-green-500 hover:bg-green-400"
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
                        className="font-mono text-xs font-bold text-green-600"
                        onClick={handleAccept}
                        disabled={loading}
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> REVIEW
                    </Button>
                )}
                {isLocked && (
                    <span className="text-xs font-mono text-gray-700 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> LOCKED
                    </span>
                )}
            </div>
        </div>
    )
}
