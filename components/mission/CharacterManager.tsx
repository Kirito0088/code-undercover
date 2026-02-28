"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface CharacterManagerProps {
    phase: "TEACHING" | "MCQ" | "CODING"
    attemptCount: number
    innovationUnlocked: boolean
    // Central message bus for characters
    systemMessage?: { sender: "platypus" | "panda" | "fox", text: string } | null
}

export function CharacterManager({
    phase,
    attemptCount,
    innovationUnlocked,
    systemMessage
}: CharacterManagerProps) {
    // Fox unlocked animation state
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

            {/* PANDA: Shows up on >= 2 attempts if in CODING phase */}
            {(attemptCount >= 2 && phase === "CODING") && (
                <div className="absolute bottom-10 right-10 flex flex-col items-end animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-blue-950/90 border border-blue-500/50 p-4 rounded-2xl rounded-br-none shadow-[0_0_20px_rgba(59,130,246,0.2)] max-w-xs mb-4 backdrop-blur-md">
                        <p className="text-blue-100 font-mono text-sm leading-relaxed">
                            {systemMessage?.sender === "panda"
                                ? systemMessage.text
                                : "Hey there! Don't worry about the errors. Even the best agents need a few tries. Check the hints if you're stuck!"}
                        </p>
                    </div>
                    <div className="relative h-48 w-48">
                        <Image
                            src="/characters/panda.png"
                            alt="Panda Support"
                            fill
                            className="object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                        />
                    </div>
                </div>
            )}

            {/* FOX: Shows up when innovation unlocks */}
            {showFoxAnimation && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                    <div className="animate-in zoom-in-50 fade-in duration-700 flex flex-col items-center">
                        <div className="relative h-64 w-64 mb-6">
                            {/* Gold Pulse Aura */}
                            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                            <Image
                                src="/characters/fox.png"
                                alt="Fox Innovation"
                                fill
                                className="object-contain relative z-10 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]"
                            />
                        </div>

                        {/* Badge Unlock UI */}
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

            {/* PLATYPUS Dialogue (The character itself stays in the LeftPanel for layout, but global popups can happen here) */}
            {(systemMessage?.sender === "platypus" && phase === "CODING") && (
                <div className="absolute bottom-4 left-4 animate-in slide-in-from-left-4 fade-in duration-300">
                    {/* Dialogue handled mostly in LeftPanel, but this acts as a fallback global toast if needed */}
                </div>
            )}
        </div>
    )
}
