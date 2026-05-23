"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface LevelIntroProps {
    onComplete?: () => void;
    /** When true, the sequence plays the "access granted" flow (red → yellow → green → ACCESS GRANTED → auto-dismiss) */
    accessGranted?: boolean;
}

export function LevelIntro({ onComplete, accessGranted = false }: LevelIntroProps) {
    // Phase states:
    // Denied flow:  "entering" → "scanning" → "verifying-yellow" → "denied-red" (shows START MISSION button)
    // Granted flow: "entering" → "scanning" → "verifying-yellow" → "granted-green" → "opening" → "hidden"
    const [phase, setPhase] = useState<
        "entering" | "scanning" | "verifying-yellow" | "denied-red" | "granted-green" | "opening" | "hidden"
    >("entering")

    useEffect(() => {
        const timeouts: NodeJS.Timeout[] = [];

        if (accessGranted) {
            // ── ACCESS GRANTED flow: red → yellow → green → auto open ──
            const timings = [
                { time: 500, next: "scanning" as const },
                { time: 3500, next: "verifying-yellow" as const },
                { time: 4500, next: "granted-green" as const },
            ];
            let cumulativeDelay = 0;
            for (const t of timings) {
                cumulativeDelay += t.time;
                const to = setTimeout(() => setPhase(t.next), cumulativeDelay);
                timeouts.push(to);
            }
            // Auto open after granted
            const autoOpen = setTimeout(() => setPhase("opening"), cumulativeDelay + 2000);
            timeouts.push(autoOpen);
            const autoHide = setTimeout(() => setPhase("hidden"), cumulativeDelay + 3300);
            timeouts.push(autoHide);
            if (onComplete) {
                const autoComplete = setTimeout(onComplete, cumulativeDelay + 3400);
                timeouts.push(autoComplete);
            }
        } else {
            // ── ACCESS DENIED flow: red → yellow → denied ──
            const timings = [
                { time: 500, next: "scanning" as const },
                { time: 3500, next: "verifying-yellow" as const },
                { time: 4500, next: "denied-red" as const },
            ];
            let cumulativeDelay = 0;
            for (const t of timings) {
                cumulativeDelay += t.time;
                const to = setTimeout(() => setPhase(t.next), cumulativeDelay);
                timeouts.push(to);
            }
        }

        return () => {
            timeouts.forEach(clearTimeout);
        }
    }, [accessGranted, onComplete])

    const handleStartMission = () => {
        if (phase !== "denied-red") return;
        setPhase("opening");
        setTimeout(() => setPhase("hidden"), 1300);
        if (onComplete) {
            setTimeout(onComplete, 1400);
        }
    }

    const handleSkip = () => {
        // Immediately skip the entire cinematic
        setPhase("hidden");
        if (onComplete) {
            onComplete();
        }
    }

    if (phase === "hidden") return null;

    // Determine if the current phase should show red-denial styling
    const isDeniedPhase = phase === "denied-red";

    return (
        <div className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-1000",
            accessGranted ? "bg-black/60 backdrop-blur-md" : "bg-black",
            phase === "opening" ? "opacity-0 pointer-events-none delay-500" : "opacity-100"
        )}>
            {/* Skip Button — top-right corner (only on denied/first-time flow) */}
            {!accessGranted && phase !== "opening" && (
                <button
                    onClick={handleSkip}
                    className="absolute top-6 right-8 z-[110] flex items-center gap-2 text-gray-400 hover:text-white font-mono text-xs tracking-wider uppercase transition-all duration-200 bg-black/40 hover:bg-white/10 px-4 py-2 rounded border border-gray-700/50 hover:border-gray-500 backdrop-blur-sm shadow-lg"
                >
                    SKIP
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.277l6.323-3.905a1.5 1.5 0 0 0 0-2.554L3.288 4.818ZM13 4.5a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0v-9a1 1 0 0 1 1-1Z" />
                    </svg>
                </button>
            )}
            {/* Cinematic 16:9 Container */}
            <div className={cn(
                "relative w-full max-w-[1920px] aspect-video max-h-screen overflow-hidden transition-all duration-1000 transform",
                accessGranted ? "bg-transparent border-none shadow-none" : "bg-[#070b13] border-4 border-gray-900 shadow-[0_0_120px_rgba(0,0,0,1)]",
                phase === "entering" ? "scale-95 opacity-0 blur-sm" : "scale-100 opacity-100 blur-none",
                phase === "opening" ? "scale-110 opacity-0 blur-md transition-all duration-[1200ms]" : ""
            )}>

                {/* Background UI Elements (Hidden on Access Granted overlay) */}
                {!accessGranted && (
                    <>
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
                            <div className={cn(
                                "px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] rounded backdrop-blur-sm transition-all duration-500",
                                isDeniedPhase
                                    ? "bg-red-950/30 border border-red-500/60 text-red-400"
                                    : "bg-emerald-950/30 border border-emerald-500/40 text-emerald-400"
                            )}>Level 1</div>
                        </div>
                    </>
                )}

                {/* ACCESS DENIED flash overlay */}
                {isDeniedPhase && (
                    <div className="absolute inset-0 z-[60] pointer-events-none animate-[denied-flash_0.6s_ease-out_forwards]">
                        <div className="absolute inset-0 bg-red-900/30"></div>
                    </div>
                )}

                <div className="absolute inset-0 flex">

                    {/* CENTER/RIGHT: Sci-Fi Security Door */}
                    <div className="flex-1 flex flex-col items-center justify-center z-10 p-12 relative">
                        {/* Background subtle glow behind door */}
                        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                            <div className={cn(
                                "w-full h-full max-w-2xl aspect-square blur-[120px] rounded-full transition-colors duration-700",
                                isDeniedPhase ? "bg-red-900/10" : "bg-cyan-900/5"
                            )}></div>
                        </div>

                        <div className="relative w-full max-w-xl aspect-[4/5] mt-24 bg-black/50 rounded-xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-900">
                            {/* Inner Door Frame */}
                            <div className={cn(
                                "absolute top-[100px] bottom-[100px] left-[10%] right-[10%] flex border-x-[4px] border-y-[1px] rounded-lg overflow-hidden bg-gray-950 transition-colors duration-500 ease-in-out",
                                phase === "entering" || phase === "scanning" ? "border-x-red-500 border-y-red-900/40 shadow-[0_0_30px_rgba(220,38,38,0.3)]" : "",
                                phase === "verifying-yellow" ? "border-x-yellow-500 border-y-yellow-900/40 shadow-[0_0_40px_rgba(234,179,8,0.5)]" : "",
                                isDeniedPhase ? "border-x-red-600 border-y-red-900/60 shadow-[0_0_50px_rgba(220,38,38,0.7)]" : "",
                                phase === "granted-green" || phase === "opening" ? "border-x-green-500 border-y-green-900/40 shadow-[0_0_50px_rgba(34,197,94,0.6)]" : ""
                            )}>

                                {/* Left Door Panel */}
                                <div className={cn(
                                    "flex-1 border-r-[3px] border-dashed border-gray-800 bg-[#090b10] flex flex-col items-center justify-center gap-10 relative transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]",
                                    (phase === "entering" || phase === "scanning") ? "animate-[door-pulse-red_2s_infinite]" : "",
                                    isDeniedPhase ? "animate-[door-pulse-denied_0.5s_ease-out_3]" : "",
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
                                    isDeniedPhase ? "animate-[door-pulse-denied_0.5s_ease-out_3]" : "",
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
                                    isDeniedPhase ? "bg-red-950/80 border-red-500 shadow-[0_0_30px_rgba(220,38,38,1)] scale-110 animate-[denied-shake_0.4s_ease-in-out_2]" : "",
                                    phase === "granted-green" || phase === "opening" ? "bg-green-950/80 border-green-400 shadow-[0_0_30px_rgba(34,197,94,1)] scale-110" : "",
                                    phase === "opening" ? "opacity-0" : "opacity-100"
                                )}>
                                    {/* Inner dot */}
                                    <div className={cn(
                                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full",
                                        phase === "entering" || phase === "scanning" ? "bg-red-500" : "",
                                        phase === "verifying-yellow" ? "bg-yellow-400 animate-ping" : "",
                                        isDeniedPhase ? "bg-red-500 animate-ping" : "",
                                        phase === "granted-green" || phase === "opening" ? "bg-green-400" : ""
                                    )} />
                                </div>

                                {/* ACCESS DENIED X overlay on the door */}
                                {isDeniedPhase && (
                                    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                                        <div className="relative">
                                            {/* Large X mark */}
                                            <div className="w-20 h-20 relative animate-[denied-x-appear_0.3s_ease-out_forwards]">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[4px] bg-red-500 rotate-45 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[4px] bg-red-500 -rotate-45 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Text overlay below the door */}
                        <div className="h-10 mt-10 z-20">
                            <p className={cn(
                                "font-mono tracking-widest text-sm font-bold uppercase transition-colors duration-300",
                                phase === "entering" || phase === "scanning" ? "text-red-500 animate-[pulse_1s_infinite] drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "",
                                phase === "verifying-yellow" ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" : "",
                                isDeniedPhase ? "text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-[denied-text-flicker_0.15s_linear_4]" : "",
                                phase === "granted-green" || phase === "opening" ? "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" : ""
                            )}>
                                {phase === "entering" ? "SYSTEM LOCKED" : ""}
                                {phase === "scanning" ? "SCANNING BIO-SIGNATURE..." : ""}
                                {phase === "verifying-yellow" ? "VERIFYING AUTHORIZATION..." : ""}
                                {isDeniedPhase ? "⛔ ACCESS DENIED ⛔" : ""}
                                {(phase === "granted-green" || phase === "opening") ? "✓ ACCESS GRANTED ✓" : ""}
                            </p>
                        </div>

                        {/* START MISSION Button — shows after ACCESS DENIED */}
                        <div className={cn(
                            "absolute left-1/2 -translate-x-1/2 transition-all duration-[1200ms] ease-in-out z-50 flex items-center justify-center pointer-events-auto",
                            // Hide during entering/scanning/verifying phases
                            phase === "entering" || phase === "scanning" || phase === "verifying-yellow" ? "opacity-0 bottom-8 translate-y-8 pointer-events-none" : "",
                            // Show after denied
                            isDeniedPhase ? "opacity-100 bottom-8 translate-y-0" : "",
                            // Show during granted (auto-dismiss flow)
                            phase === "granted-green" ? "opacity-0 bottom-8 translate-y-8 pointer-events-none" : "",
                            // Opening animation
                            phase === "opening" ? "opacity-0 bottom-8 translate-y-8 pointer-events-none" : ""
                        )}>
                            <button
                                onClick={handleStartMission}
                                disabled={phase !== "denied-red"}
                                className={cn(
                                    "px-12 py-4 font-bold font-mono tracking-[0.2em] rounded overflow-hidden relative group transition-all duration-300",
                                    isDeniedPhase
                                        ? "bg-red-950/40 border border-red-500 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.4),0_0_40px_rgba(239,68,68,0.2)_inset] hover:bg-red-900 hover:shadow-[0_0_30px_rgba(239,68,68,0.7)] animate-[denied-btn-glow_2s_ease-in-out_infinite]"
                                        : "bg-cyan-950/40 border border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4),0_0_40px_rgba(34,211,238,0.2)_inset] hover:bg-cyan-900 hover:shadow-[0_0_30px_rgba(34,211,238,0.7)]"
                                )}
                            >
                                <span className="relative z-10 text-sm">
                                    START MISSION
                                </span>
                                {/* Hover sweep effect */}
                                <div className={cn(
                                    "absolute inset-0 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out",
                                    isDeniedPhase ? "bg-red-500/20" : "bg-cyan-400/20"
                                )}></div>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
