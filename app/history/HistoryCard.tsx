"use client"

import { useEffect, useRef, useState } from "react"
import {
    ChevronDown,
    ChevronUp,
    Zap,
    Lightbulb,
    Copy,
    Check,
    Code2,
    Sparkles
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
            return { color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-950/20" }
        case "MEDIUM":
            return { color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-950/20" }
        case "HARD":
            return { color: "text-red-400", border: "border-red-500/30", bg: "bg-red-950/20" }
        default:
            return { color: "text-[#8F9F8F]", border: "border-[#1F261F]", bg: "bg-[#181C18]" }
    }
}

function formatDate(date: Date | string | null): string {
    if (!date) return "Unknown Date"
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
    const copiedTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>> | null>(null)
    if (copiedTimeoutsRef.current === null) {
        copiedTimeoutsRef.current = new Set()
    }
    const copiedTimeouts = copiedTimeoutsRef.current
    const diff = getDifficultyStyle(mission.difficulty)

    const [formattedDate, setFormattedDate] = useState<string>(() => {
        if (!mission.completedAt) return "Unknown Date"
        try {
            return new Date(mission.completedAt).toISOString().split('T')[0]
        } catch {
            return "Unknown Date"
        }
    })

    useEffect(() => {
        setFormattedDate(formatDate(mission.completedAt))
    }, [mission.completedAt])

    useEffect(() => {
        return () => {
            for (const timeout of copiedTimeouts) {
                clearTimeout(timeout)
            }
            copiedTimeouts.clear()
        }
    }, [copiedTimeouts])

    const clearCopiedTimeouts = () => {
        for (const timeout of copiedTimeouts) {
            clearTimeout(timeout)
        }
        copiedTimeouts.clear()
    }

    const handleCopy = async () => {
        if (!mission.submittedCode) return
        try {
            await navigator.clipboard.writeText(mission.submittedCode)
            setCopied(true)
            clearCopiedTimeouts()
            const copiedTimeout = setTimeout(() => {
                setCopied(false)
                copiedTimeouts.delete(copiedTimeout)
            }, 2000)
            copiedTimeouts.add(copiedTimeout)
        } catch {
            // Clipboard API fallback
        }
    }

    return (
        <div
            className="group bg-[#0D0E12] border border-[#1F261F] hover:border-emerald-500/40 rounded-xl overflow-hidden transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-mono"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Card Header — clickable toggle */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? "Collapse mission details" : "Expand mission details"}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-[#181C18]/40 transition-colors cursor-pointer border-none"
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <h3 className="text-sm font-bold font-mono text-[#E2E8F0] group-hover:text-emerald-400 transition-colors">
                                Mission #{String(mission.missionOrder).padStart(2, "0")}: {mission.missionTitle}
                            </h3>
                            <span
                                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${diff.color} ${diff.border} ${diff.bg}`}
                            >
                                {mission.difficulty}
                            </span>
                            {mission.innovationUnlocked && (
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30 bg-amber-950/20 text-amber-400 flex items-center gap-1">
                                    <Sparkles className="size-3 text-amber-400" />
                                    INNOVATION UNLOCKED
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#8F9F8F]">
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                <Zap className="size-3 text-emerald-400" />
                                +{mission.auraReward} AP
                            </span>
                            <span className="text-[#4A5D4A]">|</span>
                            <span>{mission.attemptCount} attempt{mission.attemptCount !== 1 ? "s" : ""}</span>
                            {mission.hintsUsed > 0 && (
                                <>
                                    <span className="text-[#4A5D4A]">|</span>
                                    <span className="flex items-center gap-1 text-amber-400">
                                        <Lightbulb className="size-3" />
                                        {mission.hintsUsed} hint{mission.hintsUsed !== 1 ? "s" : ""}
                                    </span>
                                </>
                            )}
                            <span className="text-[#4A5D4A]">|</span>
                            <span className="text-[#4A5D4A] text-[10px]">{formattedDate}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                    {isExpanded ? (
                        <div className="size-8 rounded-md bg-[#181C18] border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <ChevronUp className="size-4" />
                        </div>
                    ) : (
                        <div className="size-8 rounded-md bg-[#181C18] border border-[#1F261F] flex items-center justify-center text-[#8F9F8F] group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                            <ChevronDown className="size-4" />
                        </div>
                    )}
                </div>
            </button>

            {/* Expanded Code Section */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="border-t border-[#1F261F]">
                    {mission.submittedCode ? (
                        <div className="relative">
                            {/* Code Header */}
                            <div className="flex items-center justify-between px-5 py-2.5 bg-[#161820] border-b border-[#1F261F] text-xs font-mono">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="size-2 rounded-full bg-red-500/60" />
                                        <div className="size-2 rounded-full bg-amber-500/60" />
                                        <div className="size-2 rounded-full bg-emerald-500/60" />
                                    </div>
                                    <span className="text-emerald-400 font-bold text-[11px]">
                                        declassified_solution.c
                                    </span>
                                    <span className="text-[9px] text-[#4A5D4A] uppercase bg-[#07080A] px-1.5 py-0.5 rounded border border-[#1F261F]">
                                        {mission.language}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 text-[11px] font-mono text-[#8F9F8F] hover:text-emerald-400 transition-colors px-2.5 py-1 rounded bg-[#07080A] hover:bg-[#181C18] border border-[#1F261F] cursor-pointer"
                                    title="Copy code"
                                    aria-label={copied ? "Code copied" : "Copy code to clipboard"}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="size-3.5 text-emerald-400" />
                                            <span className="text-emerald-400 font-bold">COPIED TO CLIPBOARD</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5" />
                                            <span>COPY CODE</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Code Block */}
                            <div className="bg-[#07080A] overflow-x-auto p-5 font-mono text-xs text-emerald-400 leading-relaxed custom-scrollbar">
                                <pre className="whitespace-pre">
                                    <code>{mission.submittedCode}</code>
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-[#07080A]">
                            <Code2 className="size-8 text-[#4A5D4A] mx-auto mb-2" />
                            <p className="text-[#8F9F8F] font-mono text-xs font-bold">
                                SOLUTION CODE NOT DECLASSIFIED
                            </p>
                            <p className="text-[#4A5D4A] font-mono text-[10px] mt-1">
                                (Completed prior to chrono logging protocol deployment)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
