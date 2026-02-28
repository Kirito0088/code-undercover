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
                title: "Memory Allocation Fundamentals",
                content:
                    "Pointers allow direct manipulation of memory. When a pointer loses its reference to a valid memory address but the pointer itself still exists, it becomes a dangling pointer.",
            },
            {
                title: "The Vulnerability",
                content:
                    "In Code Undercover systems, dangling pointers lead to unauthorized access. Your mission is to secure the code by tracking valid memory references and setting pointers to NULL when freed.",
            },
        ]

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-[#0a0a0a] z-40">
            <div className="max-w-4xl w-full bg-gray-950/80 border border-green-500/20 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col md:flex-row relative">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>

                {/* Left Side: Platypus Mentor */}
                <div className="md:w-1/3 bg-gray-900 border-r border-gray-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(transparent_50%,rgba(34,197,94,0.03)_50%)] bg-[length:100%_4px]"></div>

                    <h2 className="text-xl font-bold text-green-400 font-mono tracking-widest uppercase mb-6 relative z-10 text-center">
                        AGENT BRIEFING
                    </h2>

                    <div className="relative h-64 w-full">
                        <Image
                            src="/characters/platypus.png"
                            alt="Lead Mentor"
                            fill
                            className="object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                            style={{ animation: "float 3s ease-in-out infinite" }}
                            priority
                        />
                    </div>
                </div>

                {/* Right Side: Slides Content */}
                <div className="md:w-2/3 p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
                            {mission.title}
                        </h1>
                    </div>

                    <div className="space-y-8 mb-10">
                        {slides.map(
                            (slide: { title: string; content: string }, index: number) => (
                                <div
                                    key={index}
                                    className="opacity-0 animate-[fadeSlideIn_0.5s_ease-out_forwards]"
                                    style={{ animationDelay: `${index * 200}ms` }}
                                >
                                    <h3 className="text-lg font-mono text-green-400 mb-2">
                                        {slide.title}
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {slide.content}
                                    </p>
                                </div>
                            )
                        )}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-800">
                        <button
                            onClick={onComplete}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold tracking-widest font-mono uppercase transition-all group shadow-[0_0_15px_rgba(22,163,74,0.4)]"
                        >
                            PROCEED TO MCQ
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
