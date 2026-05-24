"use client"

import { useEffect, useState } from "react"
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
    const router = useRouter()
    const [showFoxAnimation, setShowFoxAnimation] = useState(false)

    // Trigger fox animation once when unlocked
    useEffect(() => {
        if (innovationUnlocked) {
            setShowFoxAnimation(true)
            const timer = setTimeout(() => setShowFoxAnimation(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [innovationUnlocked])

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">

            {/* VICTORY OVERLAY */}
            {missionCleared && clearInfo && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0F]/90 backdrop-blur-sm z-[60] pointer-events-auto">
                    <div className="animate-in zoom-in-95 fade-in duration-200 bg-[#111118] border border-[#22222E] rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">
                        
                        {/* Icon */}
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-semibold text-[#F1F1F5] mt-6">Mission Complete</h2>
                        <p className="text-xs text-[#5C5C7A] mt-1 font-mono">Module Restored</p>

                        {/* Aura Block */}
                        <div className="bg-[#0A0A0F] border border-[#22222E] rounded-xl p-4 mt-6">
                            <span className="text-2xl font-semibold font-mono text-indigo-400">+{clearInfo.auraEarned} AP</span>
                        </div>

                        {/* Combo */}
                        {clearInfo.comboStreak > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-sm text-amber-400 font-mono">Combo ×{clearInfo.comboStreak}</span>
                                {clearInfo.comboBonus > 0 && (
                                    <span className="text-xs text-[#5C5C7A] font-mono">(+{clearInfo.comboBonus})</span>
                                )}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors border-none"
                            >
                                Next Mission →
                            </button>
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="w-full bg-[#1C1C28] hover:bg-[#22222E] text-[#8B8BA7] border border-[#22222E] px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FOX: Shows up when innovation unlocks */}
            {showFoxAnimation && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0F]/90 backdrop-blur-sm z-50">
                    <div className="animate-in zoom-in-95 fade-in duration-200 flex flex-col items-center">
                        <div className="relative h-64 w-64 mb-6">
                            <Image
                                src="/characters/fox.png"
                                alt="Fox Innovation"
                                fill
                                className="object-contain relative z-10"
                            />
                        </div>

                        <div className="bg-[#111118] border border-amber-500/20 p-6 rounded-xl text-center shadow-2xl backdrop-blur-md">
                            <h2 className="text-xl font-semibold text-[#F1F1F5] mb-2">
                                Innovation Detected
                            </h2>
                            <p className="text-[#8B8BA7] text-sm max-w-md leading-relaxed">
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
