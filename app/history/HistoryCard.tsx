"use client"

import { useEffect, useRef, useState } from "react"
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
            return { color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" }
        case "MEDIUM":
            return { color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10" }
        case "HARD":
            return { color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10" }
        default:
            return { color: "text-[#5C5C7A]", border: "border-[#323242]", bg: "bg-[#1C1C24]" }
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
    const copiedTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
    const diff = getDifficultyStyle(mission.difficulty)

    useEffect(() => {
        const copiedTimeouts = copiedTimeoutsRef.current
        return () => {
            for (const timeout of copiedTimeouts) {
                clearTimeout(timeout)
            }
            copiedTimeouts.clear()
        }
    }, [])

    const clearCopiedTimeouts = () => {
        for (const timeout of copiedTimeoutsRef.current) {
            clearTimeout(timeout)
        }
        copiedTimeoutsRef.current.clear()
    }

    const handleCopy = async () => {
        if (!mission.submittedCode) return
        try {
            await navigator.clipboard.writeText(mission.submittedCode)
            setCopied(true)
            clearCopiedTimeouts()
            const copiedTimeout = setTimeout(() => {
                setCopied(false)
                copiedTimeoutsRef.current.delete(copiedTimeout)
            }, 2000)
            copiedTimeoutsRef.current.add(copiedTimeout)
        } catch {
            // Clipboard API might not be available
        }
    }

    return (
        <div
            className="group bg-[#1C1C24] border border-[#323242] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#3F3F52]"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Card Header — always visible */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? "Collapse mission details" : "Expand mission details"}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[#2A2A35]/50 transition-colors"
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-sm font-semibold text-[#F1F1F5]">
                                {mission.missionTitle}
                            </h3>
                            <span
                                className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${diff.color} ${diff.border} ${diff.bg}`}
                            >
                                {mission.difficulty}
                            </span>
                            {mission.innovationUnlocked && (
                                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                    🦊 Innovation
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-[#8B8BA7]">
                            <span className="flex items-center gap-1 text-indigo-400">
                                <Zap className="size-3" />
                                +{mission.auraReward} AP
                            </span>
                            <span>{mission.attemptCount} attempt{mission.attemptCount !== 1 ? "s" : ""}</span>
                            {mission.hintsUsed > 0 && (
                                <span className="flex items-center gap-1 text-amber-400/80">
                                    <Lightbulb className="size-3" />
                                    {mission.hintsUsed} hint{mission.hintsUsed !== 1 ? "s" : ""}
                                </span>
                            )}
                            <span className="text-[#5C5C7A]">{formatDate(mission.completedAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                    {isExpanded ? (
                        <ChevronUp className="size-5 text-[#8B8BA7] group-hover:text-indigo-400 transition-colors" />
                    ) : (
                        <ChevronDown className="size-5 text-[#8B8BA7] group-hover:text-indigo-400 transition-colors" />
                    )}
                </div>
            </button>

            {/* Expanded Code Section */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="border-t border-[#323242]">
                    {mission.submittedCode ? (
                        <div className="relative">
                            {/* Code Header */}
                            <div className="flex items-center justify-between px-5 py-3 bg-[#22222B] border-b border-[#323242]">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="size-2 rounded-full bg-[#323242]" />
                                        <div className="size-2 rounded-full bg-[#323242]" />
                                        <div className="size-2 rounded-full bg-[#323242]" />
                                    </div>
                                    <span className="text-xs font-mono text-[#8B8BA7]">
                                        solution.c
                                    </span>
                                    <span className="text-[10px] font-mono text-[#5C5C7A] uppercase">
                                        {mission.language}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 text-xs font-mono text-[#8B8BA7] hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-[#2A2A35]"
                                    title="Copy code"
                                    aria-label={copied ? "Code copied" : "Copy code to clipboard"}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="size-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Code Block */}
                            <div className="bg-[#14141A] overflow-x-auto custom-scrollbar">
                                <pre className="p-5 text-sm leading-relaxed">
                                    <code className="text-[#8B8BA7] font-mono whitespace-pre">
                                        {mission.submittedCode}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Code2 className="size-8 text-[#3A3A52] mx-auto mb-3" />
                            <p className="text-[#8B8BA7] font-mono text-sm">
                                Code was not saved for this mission.
                            </p>
                            <p className="text-[#5C5C7A] font-mono text-xs mt-1">
                                (Completed before history tracking was enabled)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
