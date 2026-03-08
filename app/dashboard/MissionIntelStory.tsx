"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { ArrowLeft, Info } from "lucide-react"

export function MissionIntelStory() {
    const [isVisible, setIsVisible] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const hasSeenIntro = localStorage.getItem("hasSeenIntroStory")
        if (!hasSeenIntro) {
            setIsVisible(true)
        }
    }, [])

    const handleContinue = () => {
        localStorage.setItem("hasSeenIntroStory", "true")
        setIsVisible(false)
    }

    if (!isMounted || !isVisible) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-700">

            {/* Main Panel */}
            <div className="w-full max-w-5xl bg-[#111824] border border-[#2a3746] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[95vh] md:h-auto md:max-h-[95vh]">

                {/* Top Header */}
                <div className="h-14 border-b border-[#2a3746] bg-[#161f2e] flex items-center justify-between px-6 shrink-0">
                    <button onClick={handleContinue} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-4 flex-1 justify-center relative">
                        <div className="absolute left-0 right-0 top-1/2 -mt-[0.5px] h-[1px] bg-gradient-to-r from-transparent via-[#2a3746] to-transparent z-[0]"></div>
                        <h2 className="text-base font-mono tracking-[0.3em] font-bold text-gray-300 bg-[#161f2e] px-4 z-10">MISSION INTEL</h2>
                    </div>
                    <button className="text-emerald-500 hover:text-emerald-400 transition-colors">
                        <Info className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content Container */}
                <div className="p-6 md:p-8 flex-1 overflow-visible pt-6 relative flex flex-col">

                    {/* Top Section */}
                    <div className="flex flex-col md:flex-row gap-6 mb-6 items-start relative z-10">

                        {/* Platypus Agent */}
                        <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 relative">
                            <img
                                src="/characters/platypus.png"
                                alt="Agent"
                                className="w-full h-full object-contain filter drop-shadow-xl"
                            />
                        </div>

                        <div className="flex flex-col gap-4 flex-1">
                            {/* Agent Speech Bubble */}
                            <div className="relative bg-[#d1d5db] text-gray-900 px-5 py-4 rounded-xl rounded-tl-none font-medium text-[15px] md:text-base leading-relaxed shadow-lg max-w-2xl">
                                <div className="absolute -left-[14px] top-0 w-0 h-0 border-r-[16px] border-r-[#d1d5db] border-b-[16px] border-b-transparent transform"></div>
                                To master the code, you must know its history, Agent. Let&apos;s start with the origins of the C programming language.
                            </div>

                            {/* Title Section placed next to platypus */}
                            <div className="flex flex-col">
                                <div className="text-[10px] font-mono tracking-widest text-[#10b981] font-medium uppercase mb-0.5">Archive Entry: #1972-Bell</div>
                                <h1 className="text-3xl font-bold text-white tracking-tight font-sans">Origins of C</h1>
                            </div>
                        </div>

                    </div>

                    {/* Separator full line (Under Dennis Ritchie picture later) */}
                    <div className="w-full h-[1px] bg-gradient-to-r from-[#2a3746] via-[#374151] to-transparent mb-8"></div>

                    {/* Two-column layout grid below separator */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 relative pb-4">

                        {/* Left Column (Main content block) */}
                        <div className="md:col-span-8 flex flex-col gap-4">

                            {/* Repeated title block exactly as shown in reference */}
                            <div className="flex flex-col mb-1">
                                <div className="text-[10px] font-mono tracking-widest text-[#64748b] font-medium uppercase mb-0.5">Archive Entry: #1972-Bell</div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Origins of C</h2>
                            </div>

                            {/* Large Retro Computer Image */}
                            <div className="w-full rounded-xl bg-black overflow-hidden border border-[#2a3746] shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-0.5">
                                <img
                                    src="/characters/retro_computer.png"
                                    alt="1970s Terminal"
                                    className="w-full h-40 md:h-[200px] object-cover rounded-lg aspect-auto opacity-90 sepia-[0.3] hue-rotate-[160deg] contrast-[1.2] brightness-90"
                                />
                            </div>

                            {/* Second Speech bubble row */}
                            <div className="flex items-start gap-4 mt-6 border border-[#2a3746]/50 bg-[#161f2e] p-5 rounded-xl relative">
                                {/* Small Avatar Bubble */}
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#374151] bg-[#1e293b] shrink-0 absolute -left-5 -top-5 shadow-xl">
                                    <img
                                        src="/characters/platypus.png"
                                        alt="Agent Small"
                                        className="w-full h-full object-cover transform scale-[1.3] translate-y-1"
                                    />
                                </div>
                                <div className="relative pl-8 text-gray-400 font-medium text-sm leading-relaxed">
                                    <strong className="text-gray-300 font-bold">Dennis Ritchie</strong> pioneered a new era of computing. His work laid the foundation of programming as we know it today.
                                </div>
                            </div>

                        </div>

                        {/* Right Column (Dennis Ritchie Profile & Specs) */}
                        <div className="md:col-span-4 flex flex-col relative z-20 pr-4">

                            {/* Floating ID Card picture */}
                            <div className="w-[140px] h-[180px] shrink-0 absolute -top-16 md:-top-24 right-4 md:left-4 mb-6 rounded-xl overflow-hidden border border-[#334155] shadow-[0_0_20px_rgba(0,0,0,0.8)] bg-[#0f172a] transform hidden md:block">
                                <img
                                    src="/characters/dennis_ritchie.png"
                                    alt="Dennis Ritchie"
                                    className="w-full h-full object-cover grayscale opacity-90 filter contrast-125"
                                />
                            </div>

                            {/* Specs Rows (Padded below the floating image) */}
                            <div className="space-y-4 pt-4 md:pt-[130px]">

                                {/* Profile section */}
                                <div className="flex flex-col">
                                    <div className="text-[10px] font-mono tracking-widest text-[#64748b] mb-1">CLASSIFIED PROFILE</div>
                                    <div className="text-lg font-bold text-gray-200">Dennis Ritchie:</div>
                                    <div className="text-sm text-[#94a3b8]">The Architect</div>
                                </div>

                                <div className="w-full h-[1px] bg-[#2a3746]"></div>

                                {/* Location / Era */}
                                <div className="flex flex-col">
                                    <div className="text-[10px] font-mono tracking-widest text-[#64748b] mb-1">LOCATION / ERA</div>
                                    <div className="text-sm text-gray-300">Bell Labs, New Jersey —</div>
                                    <div className="text-sm text-[#94a3b8]">Circa 1972</div>
                                </div>

                                <div className="w-full h-[1px] bg-[#2a3746]"></div>

                                {/* Briefing text */}
                                <div className="flex flex-col">
                                    <div className="text-[10px] font-mono tracking-widest text-[#64748b] mb-1">OPERATIONAL BRIEFING</div>
                                    <div className="text-[#10b981] font-medium text-sm mb-1">Project C: The Foundation</div>
                                    <p className="text-xs text-[#94a3b8] italic leading-relaxed">
                                        &quot;The Architect developed C to construct the Unix operating system. It became the portable machine code that built the modern digital world.&quot;
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer actions (Floating Bottom Right inside container) */}
                <div className="w-full border-t border-[#1e293b] p-6 pr-8 bg-[#111824] flex justify-end shrink-0">
                    <Button
                        onClick={handleContinue}
                        className="bg-[#10b981] hover:bg-[#059669] text-white font-bold tracking-wider px-8 uppercase shadow-[0_0_20px_rgba(16,185,129,0.2)] rounded-sm h-12"
                    >
                        Continue Mission
                    </Button>
                </div>
            </div>
        </div>
    )
}
