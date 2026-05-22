"use client"

import { useState } from "react"
import {
    ChevronDown,
    ChevronUp,
    Zap,
    AlertTriangle,
    Lightbulb,
    Copy,
    Check,
    Code2,
} from "lucide-react"

interface HistoryMission {
    id: string
    missionId: string
    missionOrder: number
    missionTitle: string
    difficulty: string
    language: string
    auraReward: number
    submittedCode: string | null
    attemptCount: number
    hintsUsed: number
    innovationUnlocked: boolean
    completedAt: Date | string | null
}

interface HistoryCardProps {
    mission: HistoryMission
    index: number
}

function getDifficultyStyle(difficulty: string) {
    switch (difficulty.toUpperCase()) {
        case "EASY":
            return { color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" }
        case "MEDIUM":
            return { color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" }
        case "HARD":
            return { color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" }
        default:
            return { color: "text-gray-400", border: "border-gray-500/30", bg: "bg-gray-500/10" }
    }
}

function formatDate(date: Date | string | null): string {
    if (!date) return "Unknown"
    const d = new Date(date)
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export function HistoryCard({ mission, index }: HistoryCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [copied, setCopied] = useState(false)
    const diff = getDifficultyStyle(mission.difficulty)

    const handleCopy = async () => {
        if (!mission.submittedCode) return
        try {
            await navigator.clipboard.writeText(mission.submittedCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Clipboard API might not be available
        }
    }

    return (
        <div
            className="group bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-700"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Card Header — always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/30 transition-colors"
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-lg font-bold text-white tracking-wide">
                                {mission.missionTitle}
                            </h3>
                            <span
                                className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${diff.color} ${diff.border} ${diff.bg}`}
                            >
                                {mission.difficulty}
                            </span>
                            {mission.innovationUnlocked && (
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400">
                                    🦊 Innovation
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                            <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                +{mission.auraReward} Aura
                            </span>
                            <span>{mission.attemptCount} attempt{mission.attemptCount !== 1 ? "s" : ""}</span>
                            {mission.hintsUsed > 0 && (
                                <span className="flex items-center gap-1 text-amber-500/70">
                                    <Lightbulb className="w-3 h-3" />
                                    {mission.hintsUsed} hint{mission.hintsUsed !== 1 ? "s" : ""}
                                </span>
                            )}
                            <span className="text-gray-600">{formatDate(mission.completedAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    )}
                </div>
            </button>

            {/* Expanded Code Section */}
            <div
                className={`overflow-hidden transition-all duration-400 ease-in-out ${
                    isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="border-t border-gray-800">
                    {mission.submittedCode ? (
                        <div className="relative">
                            {/* Code Header */}
                            <div className="flex items-center justify-between px-5 py-3 bg-[#161b22] border-b border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-gray-600/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-gray-600/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-gray-600/50" />
                                    </div>
                                    <span className="text-xs font-mono text-gray-400">
                                        solution.c
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-600 uppercase">
                                        {mission.language}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors px-2 py-1 rounded hover:bg-gray-800"
                                    title="Copy code"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                            <span className="text-green-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Code Block */}
                            <div className="bg-[#0d1117] overflow-x-auto custom-scrollbar">
                                <pre className="p-5 text-sm leading-relaxed">
                                    <code className="text-gray-300 font-mono whitespace-pre">
                                        {mission.submittedCode}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Code2 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-600 font-mono text-sm">
                                Code was not saved for this mission.
                            </p>
                            <p className="text-gray-700 font-mono text-xs mt-1">
                                (Completed before history tracking was enabled)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
