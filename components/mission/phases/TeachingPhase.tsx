"use client"

import { MissionRecord } from "@/types"
import { GraduationCap, ArrowRight } from "lucide-react"
import Image from "next/image"

interface TeachingPhaseProps {
    mission: MissionRecord
    onComplete: () => void
}

export function TeachingPhase({ mission, onComplete }: TeachingPhaseProps) {
    const slides = mission.teachingContent
        ? JSON.parse(mission.teachingContent)
        : [
            {
                title: "Scanf() Function",
                content:
                    ["scanf() is used in C to take input from the user through the keyboard.",
                        "It reads the entered data and stores it in variables using format specifiers like %d, %f, etc.",
                        "We use & before variables to store their address.",
                        "It is defined in the <stdio.h> library."],
            },
            {
                title: "The Vulnerability",
                content: [
                    "In Code Undercover systems:",
                    "No input size checking → can cause buffer overflow if too much data is entered.",
                    "Unsafe for strings (%s) → stops at space and may overwrite memory.",
                    "Wrong input type issues → entering letters instead of numbers can break the program.",
                    "Input buffer problems → leftover characters (like \\n) can affect next inputs."
                ],
            },
        ]

    return (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#0a0a0a]/95 z-40">
            <div className="max-w-5xl w-full bg-[#0a0a0a] border border-green-500/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl relative flex flex-col">
                {/* Top gradient accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>

                {/* ─── Top: Centered Mission Title ─── */}
                <div className="flex flex-col items-center pt-10 pb-6 px-8">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                        <GraduationCap className="h-6 w-6 text-green-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white font-mono tracking-wide text-center">
                        {mission.title}
                    </h1>
                </div>

                {/* ─── Middle: Slides Grid ─── */}
                <div className="px-8 pb-6 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {slides.map(
                            (slide: { title: string; content: string | string[] }, index: number) => {
                                // If 3 slides, the third one spans full width
                                const isLastOdd = slides.length % 2 === 1 && index === slides.length - 1

                                return (
                                    <div
                                        key={index}
                                        className={`bg-gray-900/60 border border-gray-800/60 rounded-xl p-6 opacity-0 animate-[fadeSlideIn_0.5s_ease-out_forwards] ${isLastOdd ? "md:col-span-2" : ""
                                            }`}
                                        style={{ animationDelay: `${index * 200}ms` }}
                                    >
                                        <h3 className="text-base font-mono text-green-400 mb-3 font-semibold tracking-wide">
                                            {slide.title}
                                        </h3>
                                        {Array.isArray(slide.content) ? (
                                            <ul className="space-y-2 text-gray-300 text-sm leading-relaxed">
                                                {slide.content.map((point: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-green-500 mt-0.5 shrink-0">▸</span>
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {slide.content}
                                            </p>
                                        )}
                                    </div>
                                )
                            }
                        )}
                    </div>
                </div>

                {/* ─── Bottom Row: Platypus left, Button right ─── */}
                <div className="flex items-end justify-between px-8 pb-8 pt-4 border-t border-gray-800/50">
                    {/* Platypus + Label */}
                    <div className="flex flex-col items-center shrink-0">
                        <span className="text-xs font-bold text-green-400 font-mono tracking-[0.2em] uppercase mb-2">
                            AGENT BRIEFING
                        </span>
                        {/* ── PLATYPUS SIZE CONTROL ─────────────────────
                             Change h-XX and w-XX below to resize the character
                             Current: h-60 w-60 — increase/decrease as needed
                        ─────────────────────────────────────────────── */}
                        <div className="relative h-40 w-40">
                            <Image
                                src="/characters/platipus.png"
                                alt="Lead Mentor"
                                fill
                                className="object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                style={{ animation: "float 3s ease-in-out infinite" }}
                                priority
                            />
                        </div>
                    </div>

                    {/* Proceed Button */}
                    <button
                        onClick={onComplete}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold tracking-widest font-mono uppercase transition-all group shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)]"
                    >
                        PROCEED TO MCQ
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    )
}
