"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle, Zap } from "lucide-react"
import type { MissionClearInfo } from "./MissionWorkspace"

interface CharacterManagerProps {
    phase: "TEACHING" | "MCQ" | "CODING"
    attemptCount: number
    innovationUnlocked: boolean
    missionCleared: boolean
    clearInfo: MissionClearInfo | null
    missionId: string
    systemMessage?: { sender: "platypus" | "fox", text: string } | null
}

export function CharacterManager({
    innovationUnlocked,
    missionCleared,
    clearInfo,
    systemMessage
}: CharacterManagerProps) {
    const { push } = useRouter()
    const [foxDismissed, setFoxDismissed] = useState(false)
    // Reset dismissed state when innovationUnlocked transitions to true,
    // so the fox animation replays correctly on prop changes.
    const prevUnlocked = useRef(innovationUnlocked)
    useEffect(() => {
        if (innovationUnlocked && !prevUnlocked.current) {
            setFoxDismissed(false)
        }
        prevUnlocked.current = innovationUnlocked
    }, [innovationUnlocked])
    const showFoxAnimation = innovationUnlocked && !foxDismissed

    // Auto-dismiss fox animation after 5 seconds
    useEffect(() => {
        if (showFoxAnimation) {
            const timer = setTimeout(() => setFoxDismissed(true), 5000)
            return () => clearTimeout(timer)
        }
    }, [showFoxAnimation])

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">

            {/* VICTORY OVERLAY */}
            {missionCleared && clearInfo && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#07080A]/90 backdrop-blur-sm z-[60] pointer-events-auto">
                    <div className="animate-in zoom-in-95 fade-in duration-200 bg-[#0D0E12] border border-[#1F261F] rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">
                        
                        {/* Icon */}
                        <div className="size-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="size-8 text-emerald-400" />
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-semibold text-[#E2E8F0] mt-6">Mission Complete</h2>
                        <p className="text-xs text-[#4A5D4A] mt-1 font-mono">Module Restored</p>

                        {/* Aura Block */}
                        <div className="bg-[#07080A] border border-[#1F261F] rounded-xl p-4 mt-6">
                            {clearInfo.isReplay ? (
                                <div className="flex flex-col gap-1">
                                    <span className="text-2xl font-semibold font-mono text-[#8F9F8F]">0 AP (Replay)</span>
                                    {clearInfo.wouldHaveEarned !== undefined && (
                                        <span className="text-xs text-[#4A5D4A] font-mono">Would have earned: {clearInfo.wouldHaveEarned} AP</span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-2xl font-semibold font-mono text-indigo-400">+{clearInfo.auraEarned} AP</span>
                            )}
                        </div>

                        {/* Combo */}
                        {clearInfo.comboStreak > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <Zap className="size-4 text-amber-400" />
                                <span className="text-sm text-amber-400 font-mono">Combo ×{clearInfo.comboStreak}</span>
                                {clearInfo.comboBonus > 0 && (
                                    <span className="text-xs text-[#4A5D4A] font-mono">(+{clearInfo.comboBonus})</span>
                                )}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                type="button"
                                onClick={() => push("/levels")}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors border-none"
                            >
                                Next Mission →
                            </button>
                            <button
                                type="button"
                                onClick={() => push("/dashboard")}
                                className="w-full bg-[#161820] hover:bg-[#1F261F] text-[#8F9F8F] border border-[#1F261F] px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FOX: Shows up when innovation unlocks */}
            {showFoxAnimation && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#07080A]/90 backdrop-blur-sm z-50">
                    <div className="animate-in zoom-in-95 fade-in duration-200 flex flex-col items-center">
                        <div className="relative size-64 mb-6">
                            <Image
                                src="/characters/fox.png"
                                alt="Fox Innovation"
                                fill
                                sizes="256px"
                                className="object-contain relative z-10"
                            />
                        </div>

                        <div className="bg-[#0D0E12] border border-amber-500/20 p-6 rounded-xl text-center shadow-2xl backdrop-blur-md">
                            <h2 className="text-xl font-semibold text-[#E2E8F0] mb-2">
                                Innovation Detected
                            </h2>
                            <p className="text-[#8F9F8F] text-sm max-w-md leading-relaxed">
                                {systemMessage?.sender === "fox"
                                    ? systemMessage.text
                                    : "Outstanding approach! You solved the mission using alternative logic. Fox badge awarded."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
