"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface LevelIntroProps {
    onComplete?: () => void;
}

export function LevelIntro({ onComplete }: LevelIntroProps) {
    // Sequence states: "entering" -> "scanning" -> "verifying-yellow" -> "granted-green" -> "opening" -> "hidden"
    const [phase, setPhase] = useState<"entering" | "scanning" | "verifying-yellow" | "granted-green" | "opening" | "hidden">("entering")

    useEffect(() => {
        // Timings for the cinematic sequence
        const timings = [
            { time: 500, next: "scanning" as const }, // Fade in HUD, begin scan
            { time: 3500, next: "verifying-yellow" as const }, // Laser finishes, check auth
            { time: 4500, next: "granted-green" as const }, // Auth confirmed
        ];

        let cumulativeDelay = 0;
        const timeouts: NodeJS.Timeout[] = [];

        for (const t of timings) {
            cumulativeDelay += t.time;
            const to = setTimeout(() => setPhase(t.next), cumulativeDelay);
            timeouts.push(to);
        }

        return () => {
            timeouts.forEach(clearTimeout);
        }
    }, [])

    const handleStartMission = () => {
        if (phase !== "granted-green") return;
        setPhase("opening");
        setTimeout(() => setPhase("hidden"), 1300);
        if (onComplete) {
            setTimeout(onComplete, 1400);
        }
    }

    if (phase === "hidden") return null;

    return (
        <div className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-1000",
            phase === "opening" ? "opacity-0 pointer-events-none delay-500" : "opacity-100"
        )}>
            {/* Cinematic 16:9 Container */}
            <div className={cn(
                "relative w-full max-w-[1920px] aspect-video max-h-screen bg-[#070b13] border-4 border-gray-900 overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] transition-all duration-1000 transform",
                phase === "entering" ? "scale-95 opacity-0 blur-sm" : "scale-100 opacity-100 blur-none",
                phase === "opening" ? "scale-110 opacity-0 blur-md transition-all duration-[1200ms]" : ""
            )}>

                {/* HUD Background grid + scanlines */}
                <div className="absolute inset-0 bg-[#050a12] border-gray-800"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60"></div>
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none bg-black"></div>

                {/* Top/Bottom HUD Bars */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-40 pointer-events-none"></div>
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-40 pointer-events-none"></div>

                {/* Header Labels */}
                <div className="absolute top-8 inset-x-12 flex justify-between items-start z-50 pointer-events-none">
                    <div className="px-5 py-2 bg-cyan-950/30 border border-cyan-500/40 text-cyan-400 font-mono text-xs uppercase tracking-[0.3em] rounded backdrop-blur-sm">Sector 1A</div>
                    <div className="px-10 py-2 bg-black/50 border border-gray-700 text-gray-400 font-mono text-sm uppercase tracking-[0.3em] rounded backdrop-blur-md">System Security</div>
                    <div className="px-5 py-2 bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] rounded backdrop-blur-sm">Level 1</div>
                </div>

                <div className="absolute inset-0 flex">
                    {/* LEFT SIDE: Detective Platypus & Info */}
                    <div className="w-[45%] flex flex-col justify-center z-20 relative pl-16 pr-8">

                        {/* Mission Information Panel */}
                        <div className="mb-8 relative z-30 bg-black/60 border border-cyan-900/60 p-8 rounded-lg backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.8)] transform -translate-y-16 mt-32 border-l-[6px] border-l-cyan-500 max-w-md">
                            <h3 className="text-cyan-400 font-mono text-xs tracking-[0.3em] font-bold mb-3 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">LEVEL.1</h3>
                            <h1 className="text-5xl font-black tracking-widest text-[#f8fafc] mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] font-sans">SYSTEM BREACH</h1>
                            <p className="text-gray-300 text-[15px] leading-relaxed font-mono opacity-90">
                                Bypass the primary firewall grid to access the inner sanctum.
                                Security protocols are active. Bio-signature scanning required.
                            </p>
                        </div>

                        {/* Detective Platypus */}
                        <div className="absolute -left-20 -bottom-32 w-[700px] h-[950px] pointer-events-none z-20">
                            <div className="w-full h-full relative animate-[float_4s_ease-in-out_infinite]">
                                <Image
                                    src="/characters/detective_platypus.png"
                                    alt="Detective Platypus"
                                    fill
                                    className="object-cover object-top scale-110"
                                    priority
                                />
                                {/* Bottom dark gradient fading into the floor */}
                                <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#050a12] via-[#050a12] to-transparent"></div>
                                {/* Left dark gradient for shadow */}
                                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/80 to-transparent"></div>
                            </div>
                        </div>
                    </div>

                    {/* CENTER/RIGHT: Sci-Fi Security Door */}
                    <div className="flex-1 flex flex-col items-center justify-center z-10 p-12 relative">
                        {/* Background subtle glow behind door */}
                        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                            <div className="w-full h-full max-w-2xl aspect-square bg-cyan-900/5 blur-[120px] rounded-full"></div>
                        </div>

                        <div className="relative w-full max-w-xl aspect-[4/5] mt-24 bg-black/50 rounded-xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-900">
                            {/* Inner Door Frame */}
                            <div className={cn(
                                "absolute top-[100px] bottom-[100px] left-[10%] right-[10%] flex border-x-[4px] border-y-[1px] rounded-lg overflow-hidden bg-gray-950 transition-colors duration-500 ease-in-out",
                                phase === "entering" || phase === "scanning" ? "border-x-red-500 border-y-red-900/40 shadow-[0_0_30px_rgba(220,38,38,0.3)]" : "",
                                phase === "verifying-yellow" ? "border-x-yellow-500 border-y-yellow-900/40 shadow-[0_0_40px_rgba(234,179,8,0.5)]" : "",
                                phase === "granted-green" || phase === "opening" ? "border-x-green-500 border-y-green-900/40 shadow-[0_0_50px_rgba(34,197,94,0.6)]" : ""
                            )}>

                                {/* Left Door Panel */}
                                <div className={cn(
                                    "flex-1 border-r-[3px] border-dashed border-gray-800 bg-[#090b10] flex flex-col items-center justify-center gap-10 relative transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]",
                                    (phase === "entering" || phase === "scanning") ? "animate-[door-pulse-red_2s_infinite]" : "",
                                    phase === "opening" ? "translate-x-[-105%]" : "translate-x-0"
                                )}>
                                    <div className="w-3/4 h-[6px] bg-gray-800 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.8)]" />
                                    <div className="w-3/4 h-[6px] bg-gray-800 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.8)]" />
                                    <div className="w-3/4 h-[6px] bg-gray-800 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.8)]" />
                                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/50 to-transparent pointer-events-none"></div>
                                </div>

                                {/* Right Door Panel */}
                                <div className={cn(
                                    "flex-1 flex flex-col bg-[#090b10] items-center justify-center gap-10 relative transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]",
                                    (phase === "entering" || phase === "scanning") ? "animate-[door-pulse-red_2s_infinite]" : "",
                                    phase === "opening" ? "translate-x-[105%]" : "translate-x-0"
                                )}>
                                    <div className="w-3/4 h-[6px] bg-gray-800 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.8)]" />
                                    <div className="w-3/4 h-[6px] bg-gray-800 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.8)]" />
                                    <div className="w-3/4 h-[6px] bg-gray-800 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.8)]" />
                                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/50 to-transparent pointer-events-none"></div>
                                </div>

                                {/* Laser Scanner Overlay Line */}
                                {phase === "scanning" && (
                                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1),0_0_40px_rgba(239,68,68,0.8)] z-20 animate-[laser-scan_1.5s_linear_infinite]" />
                                )}

                                {/* Center Lock Indicator Sphere */}
                                <div className={cn(
                                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-sm rotate-45 border-[3px] z-30 transition-all duration-300",
                                    phase === "entering" || phase === "scanning" ? "bg-black border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.9)]" : "",
                                    phase === "verifying-yellow" ? "bg-yellow-950/80 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,1)]" : "",
                                    phase === "granted-green" || phase === "opening" ? "bg-green-950/80 border-green-400 shadow-[0_0_30px_rgba(34,197,94,1)] scale-110" : "",
                                    phase === "opening" ? "opacity-0" : "opacity-100"
                                )}>
                                    {/* Inner dot */}
                                    <div className={cn(
                                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full",
                                        phase === "entering" || phase === "scanning" ? "bg-red-500" : "",
                                        phase === "verifying-yellow" ? "bg-yellow-400 animate-ping" : "",
                                        phase === "granted-green" || phase === "opening" ? "bg-green-400" : ""
                                    )} />
                                </div>
                            </div>
                        </div>

                        {/* Status Text overlay below the door */}
                        <div className="h-10 mt-10 z-20">
                            <p className={cn(
                                "font-mono tracking-widest text-sm font-bold uppercase transition-colors duration-300",
                                phase === "entering" || phase === "scanning" ? "text-red-500 animate-[pulse_1s_infinite] drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "",
                                phase === "verifying-yellow" ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" : "",
                                phase === "granted-green" || phase === "opening" ? "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" : ""
                            )}>
                                {phase === "entering" ? "SYSTEM LOCKED" : ""}
                                {phase === "scanning" ? "SCANNING BIO-SIGNATURE..." : ""}
                                {phase === "verifying-yellow" ? "VERIFYING AUTHORIZATION..." : ""}
                                {(phase === "granted-green" || phase === "opening") ? "ACCESS GRANTED" : ""}
                            </p>
                        </div>

                        {/* START MISSION Cyan Button */}
                        <div className={cn(
                            "absolute left-1/2 -translate-x-1/2 transition-all duration-[1200ms] ease-in-out z-50 flex items-center justify-center pointer-events-auto",
                            phase === "entering" || phase === "scanning" || phase === "verifying-yellow" ? "opacity-0 bottom-8 translate-y-8 pointer-events-none" : "",
                            phase === "granted-green" ? "opacity-100 bottom-8 translate-y-0" : "",
                            phase === "opening" ? "opacity-100 bottom-1/2 translate-y-1/2 scale-125 pointer-events-none" : ""
                        )}>
                            <button
                                onClick={handleStartMission}
                                disabled={phase === "opening"}
                                className={cn(
                                    "px-12 py-4 bg-cyan-950/40 border border-cyan-400 text-cyan-300 font-bold font-mono tracking-[0.2em] rounded overflow-hidden relative group transition-all duration-300",
                                    phase === "opening" ? "shadow-[0_0_50px_rgba(34,211,238,0.8),0_0_80px_rgba(34,211,238,0.4)_inset] bg-cyan-900 border-cyan-300" : "shadow-[0_0_20px_rgba(34,211,238,0.4),0_0_40px_rgba(34,211,238,0.2)_inset] hover:bg-cyan-900 hover:shadow-[0_0_30px_rgba(34,211,238,0.7)]"
                                )}
                            >
                                <span className={cn(
                                    "relative z-10 text-sm transition-all duration-500",
                                    phase === "opening" ? "text-white text-lg tracking-[0.4em] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" : ""
                                )}>
                                    {phase === "opening" ? "INITIALIZING..." : "START MISSION"}
                                </span>
                                {/* Hover sweep effect (disabled during opening sequence) */}
                                {phase !== "opening" && (
                                    <div className="absolute inset-0 bg-cyan-400/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                )}
                                {/* Active sweep effect (during opening sequence) */}
                                {phase === "opening" && (
                                    <div className="absolute inset-x-0 bottom-0 h-full bg-cyan-400/40 animate-[pulse_1s_infinite]"></div>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
