"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { ArrowLeft } from "lucide-react"

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0F]/98 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-700">

            {/* Main Panel */}
            <div className="w-full max-w-5xl bg-[#111118] border border-[#22222E] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[95vh] md:h-auto md:max-h-[95vh]">

                {/* Top Header */}
                <div className="h-14 border-b border-[#22222E] bg-[#16161F] flex items-center justify-between px-6 shrink-0">
                    <button onClick={handleContinue} className="text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-4 flex-1 justify-center relative">
                        <div className="absolute left-0 right-0 top-1/2 -mt-[0.5px] h-[1px] bg-[#22222E] z-[0]"></div>
                        <h2 className="text-sm font-medium text-[#8B8BA7] bg-[#16161F] px-4 z-10">MISSION INTEL</h2>
                    </div>
                    <button
                        onClick={handleContinue}
                        className="flex items-center gap-2 text-[#8B8BA7] hover:text-[#F1F1F5] text-xs font-medium transition-all duration-200 hover:bg-[#1C1C28] px-3 py-1.5 rounded border border-[#22222E] hover:border-[#2E2E3F]"
                    >
                        SKIP INTRO
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.277l6.323-3.905a1.5 1.5 0 0 0 0-2.554L3.288 4.818ZM13 4.5a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0v-9a1 1 0 0 1 1-1Z" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content Container */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar pt-6 relative flex flex-col">

                    {/* Top Section */}
                    <div className="flex flex-col md:flex-row gap-6 mb-6 items-start relative z-10">

                        {/* Platypus Agent */}
                        <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 relative">
                            <img
                                src="/characters/platipus.png"
                                alt="Agent"
                                className="w-full h-full object-contain filter drop-shadow-xl"
                            />
                        </div>

                        <div className="flex flex-col gap-4 flex-1">
                            {/* Agent Speech Bubble */}
                            <div className="relative bg-[#1C1C28] border border-[#22222E] text-[#F1F1F5] px-5 py-4 rounded-xl md:rounded-tl-none font-medium text-[15px] md:text-base leading-relaxed shadow-lg max-w-2xl">
                                <div className="absolute -left-[14px] top-0 w-0 h-0 border-r-[16px] border-r-[#1C1C28] border-b-[16px] border-b-transparent transform md:block hidden"></div>
                                <div className="absolute -top-[14px] left-10 w-0 h-0 border-b-[16px] border-b-[#1C1C28] border-r-[16px] border-r-transparent transform md:hidden"></div>
                                To master the code, you must know its history, Agent. Let&apos;s start with the origins of the C programming language.
                            </div>

                            {/* Title Section placed next to platypus */}
                            <div className="flex flex-col">
                                <div className="text-[10px] font-mono tracking-widest text-indigo-400 font-medium uppercase mb-0.5">Archive Entry: #1972-Bell</div>
                                <h1 className="text-3xl font-bold text-[#F1F1F5] tracking-tight font-sans">Origins of C</h1>
                            </div>
                        </div>

                    </div>

                    {/* Separator full line */}
                    <div className="w-full h-[1px] bg-[#22222E] mb-8"></div>

                    {/* Two-column layout grid below separator */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 relative pb-4">

                        {/* Left Column (Main content block) */}
                        <div className="md:col-span-8 flex flex-col gap-4">

                            {/* Repeated title block exactly as shown in reference */}
                            <div className="flex flex-col mb-1">
                                <div className="text-[10px] font-mono tracking-widest text-[#5C5C7A] font-medium uppercase mb-0.5">Archive Entry: #1972-Bell</div>
                                <h2 className="text-2xl font-bold text-[#F1F1F5] tracking-tight">Origins of C</h2>
                            </div>

                            {/* Large Retro Computer Image */}
                            <div className="w-full rounded-xl bg-black overflow-hidden border border-[#22222E] shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-0.5">
                                <img
                                    src="/characters/retro_computer.png"
                                    alt="1970s Terminal"
                                    className="w-full h-40 md:h-[200px] object-cover rounded-lg aspect-auto opacity-90 sepia-[0.3] hue-rotate-[160deg] contrast-[1.2] brightness-90"
                                />
                            </div>

                            {/* Second Speech bubble row */}
                            <div className="flex items-start gap-4 mt-6 border border-[#22222E] bg-[#16161F] p-5 rounded-xl relative">
                                {/* Small Avatar Bubble */}
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#22222E] bg-[#111118] shrink-0 absolute -left-5 -top-5 shadow-xl">
                                    <img
                                        src="/characters/platipus.png"
                                        alt="Agent Small"
                                        className="w-full h-full object-cover transform scale-[1.3] translate-y-1"
                                    />
                                </div>
                                <div className="relative pl-8 text-[#8B8BA7] font-medium text-sm leading-relaxed">
                                    <strong className="text-[#F1F1F5] font-semibold">Dennis Ritchie</strong> pioneered a new era of computing. His work laid the foundation of programming as we know it today.
                                </div>
                            </div>

                        </div>

                        {/* Right Column (Dennis Ritchie Profile & Specs) */}
                        <div className="md:col-span-4 flex flex-col relative z-20 pr-4">

                            {/* Floating ID Card picture */}
                            <div className="w-[140px] h-[180px] shrink-0 absolute -top-16 md:-top-24 right-4 md:left-4 mb-6 rounded-xl overflow-hidden border border-[#22222E] shadow-[0_0_20px_rgba(0,0,0,0.8)] bg-[#111118] transform hidden md:block">
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
                                    <div className="text-[10px] font-mono tracking-widest text-[#5C5C7A] mb-1">CLASSIFIED PROFILE</div>
                                    <div className="text-lg font-bold text-[#F1F1F5]">Dennis Ritchie:</div>
                                    <div className="text-sm text-[#8B8BA7]">The Architect</div>
                                </div>

                                <div className="w-full h-[1px] bg-[#22222E]"></div>

                                {/* Location / Era */}
                                <div className="flex flex-col">
                                    <div className="text-[10px] font-mono tracking-widest text-[#5C5C7A] mb-1">LOCATION / ERA</div>
                                    <div className="text-sm text-[#F1F1F5]">Bell Labs, New Jersey —</div>
                                    <div className="text-sm text-[#8B8BA7]">Circa 1972</div>
                                </div>

                                <div className="w-full h-[1px] bg-[#22222E]"></div>

                                {/* Briefing text */}
                                <div className="flex flex-col">
                                    <div className="text-[10px] font-mono tracking-widest text-[#5C5C7A] mb-1">OPERATIONAL BRIEFING</div>
                                    <div className="text-indigo-400 font-medium text-sm mb-1">Project C: The Foundation</div>
                                    <p className="text-xs text-[#8B8BA7] italic leading-relaxed">
                                        &quot;The Architect developed C to construct the Unix operating system. It became the portable machine code that built the modern digital world.&quot;
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer actions */}
                <div className="w-full border-t border-[#22222E] p-6 pr-8 bg-[#111118] flex justify-end shrink-0">
                    <Button
                        onClick={handleContinue}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 rounded-md h-12 transition-colors border-none"
                    >
                        Continue Mission
                    </Button>
                </div>
            </div>
        </div>
    )
}
