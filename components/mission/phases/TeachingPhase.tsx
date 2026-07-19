"use client"

import { MissionRecord } from "@/types"
import { GraduationCap, ArrowRight } from "lucide-react"
import Image from "next/image"

interface TeachingPhaseProps {
    mission: MissionRecord
    onComplete: () => void
}

export function TeachingPhase({ mission, onComplete }: TeachingPhaseProps) {
    const rawSlides = mission.teachingContent
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

    interface Point {
        id: string
        text: string
    }

    interface Slide {
        id: string
        title: string
        content: string | Point[]
    }

    const slides: Slide[] = rawSlides.map((slide: { title: string; content: string | string[] }, slideIdx: number) => {
        const slideId = `slide-${mission.id ?? 'm'}-${slideIdx}-${slide.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
        let content: string | Point[]
        if (Array.isArray(slide.content)) {
            content = slide.content.map((point: string, pointIdx: number) => ({
                id: `point-${slideId}-${pointIdx}-${point.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
                text: point
            }))
        } else {
            content = slide.content
        }
        return {
            id: slideId,
            title: slide.title,
            content
        }
    })

    return (
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6 bg-[#14141A]/98 z-40 overflow-y-auto">
            <div className="max-w-5xl w-full bg-[#1C1C24] border border-[#323242] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] max-h-full md:max-h-none flex flex-col backdrop-blur-xl relative">
                {/* Top border bar */}
                <div className="absolute top-0 inset-x-0 h-px bg-[#323242]" />

                {/* ─── Top: Centered Mission Title ─── */}
                <div className="flex flex-col items-center pt-10 pb-6 px-8">
                    <div className="size-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                        <GraduationCap className="size-6 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-[#F1F1F5] tracking-tight text-center">
                        {mission.title}
                    </h1>
                </div>

                {/* ─── Middle: Slides Grid ─── */}
                <div className="px-6 md:px-8 pb-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {slides.map(
                            (slide, index: number) => {
                                // If 3 slides, the third one spans full width
                                const isLastOdd = slides.length % 2 === 1 && index === slides.length - 1

                                return (
                                    <div
                                        key={slide.id}
                                        className={`bg-[#22222B] border border-[#323242] rounded-xl p-6 opacity-0 animate-[fadeSlideIn_0.5s_ease-out_forwards] ${isLastOdd ? "md:col-span-2" : ""
                                            }`}
                                        style={{ animationDelay: `${index * 200}ms` }}
                                    >
                                        <h3 className="text-sm font-medium text-[#F1F1F5] mb-3">
                                            {slide.title}
                                        </h3>
                                        {Array.isArray(slide.content) ? (
                                            <ul className="space-y-2 text-[#8B8BA7] text-sm leading-relaxed">
                                                {slide.content.map((point) => (
                                                    <li key={point.id} className="flex items-start gap-2.5">
                                                        <div className="size-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                                                        <span>{point.text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-[#8B8BA7] text-sm leading-relaxed">
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
                <div className="flex items-end justify-between px-6 md:px-8 pb-6 md:pb-8 pt-4 border-t border-[#323242] flex-shrink-0">
                    {/* Platypus + Label */}
                    <div className="flex flex-col items-center shrink-0">
                        <span className="text-xs font-semibold text-[#5C5C7A] uppercase mb-1">
                            Briefing
                        </span>
                        <div className="relative size-20 md:h-40 md:w-40">
                            <Image
                                src="/characters/platipus.png"
                                alt="Lead Mentor"
                                fill
                                sizes="(min-width: 768px) 160px, 80px"
                                className="object-contain animate-[float_3s_ease-in-out_infinite]"
                                priority
                            />
                        </div>
                    </div>

                    {/* Proceed Button */}
                    <button
                        type="button"
                        onClick={onComplete}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 md:px-8 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-colors group ml-4 border-none"
                    >
                        Proceed
                        <ArrowRight className="size-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    )
}
