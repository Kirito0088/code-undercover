"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import type { MissionClearInfo } from "./MissionWorkspace"

interface CharacterManagerProps {
    phase: "TEACHING" | "MCQ" | "CODING"
    attemptCount: number
    innovationUnlocked: boolean
    missionCleared: boolean
    clearInfo: MissionClearInfo | null
    systemMessage?: { sender: "platypus" | "fox", text: string } | null
}

export function CharacterManager({
    phase,
    attemptCount,
    innovationUnlocked,
    missionCleared,
    clearInfo,
    systemMessage
}: CharacterManagerProps) {
    const [showFoxAnimation, setShowFoxAnimation] = useState(false)
    const [showVictoryOverlay, setShowVictoryOverlay] = useState(false)

    // Trigger fox animation once when unlocked
    useEffect(() => {
        if (innovationUnlocked) {
            setShowFoxAnimation(true)
            const timer = setTimeout(() => setShowFoxAnimation(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [innovationUnlocked])

    // Trigger victory overlay when mission clears
    useEffect(() => {
        if (missionCleared) {
            setShowVictoryOverlay(true)
            const timer = setTimeout(() => setShowVictoryOverlay(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [missionCleared])

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">

            {/* VICTORY OVERLAY: Shows when mission is cleared */}
            {showVictoryOverlay && clearInfo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[60] pointer-events-auto">
                    <div className="animate-in zoom-in-75 fade-in duration-500 flex flex-col items-center">
                        {/* Success Pulse Ring */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-30 animate-pulse scale-150"></div>
                            <div className="relative h-28 w-28 bg-green-500/20 border-2 border-green-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                                <span className="text-5xl">✔</span>
                            </div>
                        </div>

                        {/* Main Badge */}
                        <div className="bg-gray-950/95 border border-green-500/50 p-8 rounded-2xl text-center shadow-[0_0_40px_rgba(34,197,94,0.2)] backdrop-blur-md max-w-sm">
                            <h2 className="text-3xl font-bold text-green-400 mb-1 font-mono tracking-[0.2em] uppercase">
                                MISSION CLEARED
                            </h2>
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-green-500/50 to-transparent my-4"></div>

                            {/* Aura Reward */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <span className="text-2xl font-bold text-yellow-400 font-mono">
                                    +{clearInfo.auraEarned}
                                </span>
                                <span className="text-yellow-400/80 text-sm font-mono uppercase tracking-wider">
                                    Aura
                                </span>
                            </div>

                            {/* Combo Bonus (conditional) */}
                            {clearInfo.comboStreak > 1 && (
                                <div className="flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg py-2 px-4 mt-2">
                                    <span className="text-lg">⚡</span>
                                    <span className="text-blue-400 font-mono font-bold text-sm">
                                        COMBO x{clearInfo.comboStreak}
                                    </span>
                                    {clearInfo.comboBonus > 0 && (
                                        <span className="text-blue-300 font-mono text-xs">
                                            (+{clearInfo.comboBonus} bonus)
                                        </span>
                                    )}
                                </div>
                            )}

                            <p className="text-gray-400 text-xs font-mono mt-4">
                                Module restored. Returning to base...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* PLATYPUS SUPPORT: Shows on >= 2 attempts ONLY if mission NOT cleared */}
            {(attemptCount >= 2 && phase === "CODING" && !missionCleared) && (
                <div className="absolute bottom-10 right-10 flex flex-col items-end animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-blue-950/90 border border-blue-500/50 p-4 rounded-2xl rounded-br-none shadow-[0_0_20px_rgba(59,130,246,0.2)] max-w-xs mb-4 backdrop-blur-md">
                        <p className="text-blue-100 font-mono text-sm leading-relaxed">
                            {systemMessage?.sender === "platypus"
                                ? systemMessage.text
                                : "Hey there! Don't worry about the errors. Even the best agents need a few tries. Check the hints if you're stuck!"}
                        </p>
                    </div>
                    <div className="relative h-48 w-48">
                        <Image
                            src="/characters/platypus.png"
                            alt="Platypus Support"
                            fill
                            className="object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                        />
                    </div>
                </div>
            )}

            {/* PLATYPUS SUCCESS: Shows after mission cleared (replaces encouragement) */}
            {(missionCleared && phase === "CODING") && (
                <div className="absolute bottom-10 right-10 flex flex-col items-end animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-green-950/90 border border-green-500/50 p-4 rounded-2xl rounded-br-none shadow-[0_0_20px_rgba(34,197,94,0.2)] max-w-xs mb-4 backdrop-blur-md">
                        <p className="text-green-100 font-mono text-sm leading-relaxed">
                            &quot;Great work, Agent. Module restored successfully. Your skills are evolving.&quot;
                        </p>
                    </div>
                    <div className="relative h-48 w-48">
                        <Image
                            src="/characters/platypus.png"
                            alt="Platypus Support"
                            fill
                            className="object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]"
                        />
                    </div>
                </div>
            )}

            {/* FOX: Shows up when innovation unlocks */}
            {showFoxAnimation && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                    <div className="animate-in zoom-in-50 fade-in duration-700 flex flex-col items-center">
                        <div className="relative h-64 w-64 mb-6">
                            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                            <Image
                                src="/characters/fox.png"
                                alt="Fox Innovation"
                                fill
                                className="object-contain relative z-10 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]"
                            />
                        </div>

                        <div className="bg-yellow-950/80 border border-yellow-500 p-6 rounded-xl text-center shadow-[0_0_30px_rgba(234,179,8,0.3)] backdrop-blur-md">
                            <h2 className="text-2xl font-bold text-yellow-400 mb-2 font-mono tracking-widest uppercase items-center flex gap-2 justify-center">
                                <span className="text-yellow-200">✨</span> INNOVATION DETECTED <span className="text-yellow-200">✨</span>
                            </h2>
                            <p className="text-yellow-100/80 max-w-md">
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
