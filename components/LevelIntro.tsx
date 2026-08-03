"use client"

import { useReducer, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface LevelIntroProps {
    onComplete?: () => void;
    /** When true, the sequence plays the "access granted" flow (red → yellow → green → ACCESS GRANTED → auto-dismiss) */
    accessGranted?: boolean;
}

type IntroPhase =
    | "entering"
    | "scanning"
    | "verifying-yellow"
    | "denied-red"
    | "granted-green"
    | "opening"
    | "hidden";

interface IntroState {
    phase: IntroPhase;
}

type IntroAction = { type: "SET_PHASE"; phase: IntroPhase };

const initialState: IntroState = { phase: "entering" };

function introReducer(state: IntroState, action: IntroAction): IntroState {
    return { phase: action.phase };
}

// 1. Skip Button Component
interface SkipButtonProps {
    accessGranted: boolean;
    phase: IntroPhase;
    onSkip: () => void;
}

const SkipButton = ({ accessGranted, phase, onSkip }: SkipButtonProps) => {
    if (accessGranted || phase === "opening") return null;

    return (
        <button
            type="button"
            onClick={onSkip}
            className="absolute top-4 right-4 md:top-6 md:right-8 z-[110] flex items-center gap-1.5 text-xs text-[#8F9F8F] hover:text-[#E2E8F0] transition-all duration-200 bg-[#0D0E12]/80 hover:bg-[#161820] px-3.5 py-1.5 rounded-md border border-[#1F261F] hover:border-[#2A3A2A] backdrop-blur-sm shadow-md"
        >
            Skip Intro
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                <path d="M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.277l6.323-3.905a1.5 1.5 0 0 0 0-2.554L3.288 4.818ZM13 4.5a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0v-9a1 1 0 0 1 1-1Z" />
            </svg>
        </button>
    )
}

// 2. Door Panels and Lock Indicator Component
interface ScannerDoorProps {
    phase: IntroPhase;
    isDeniedPhase: boolean;
}

const ScannerDoor = ({ phase, isDeniedPhase }: ScannerDoorProps) => {
    return (
        <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-wxl aspect-[4/5] mt-16 md:mt-24 bg-black/50 rounded-xl p-3 md:p-4 shadow-2xl border border-[#1F261F]">
            <div className={cn(
                "absolute top-[18%] bottom-[18%] left-[10%] right-[10%] flex border-x-[4px] border-y-[1px] rounded-lg overflow-hidden bg-[#07080A] transition-colors duration-500 ease-in-out",
                phase === "entering" || phase === "scanning" ? "border-x-red-500 border-y-red-900/40 shadow-[0_0_30px_rgba(220,38,38,0.3)]" : "",
                phase === "verifying-yellow" ? "border-x-yellow-500 border-y-yellow-900/40 shadow-[0_0_40px_rgba(234,179,8,0.5)]" : "",
                isDeniedPhase ? "border-x-red-600 border-y-red-900/60 shadow-[0_0_50px_rgba(220,38,38,0.7)]" : "",
                phase === "granted-green" || phase === "opening" ? "border-x-green-500 border-y-green-900/40 shadow-[0_0_50px_rgba(34,197,94,0.6)]" : ""
            )}>
                {/* Left Door Panel */}
                <div className={cn(
                    "flex-1 border-r-[3px] border-dashed border-[#1F261F] bg-[#0D0E12] flex flex-col items-center justify-center gap-6 md:gap-10 relative transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]",
                    (phase === "entering" || phase === "scanning") ? "animate-[door-pulse-red_2s_infinite]" : "",
                    isDeniedPhase ? "animate-[door-pulse-denied_0.5s_ease-out_3]" : "",
                    phase === "opening" ? "translate-x-[-105%]" : "translate-x-0"
                )}>
                    <div className="w-3/4 h-[6px] bg-[#161820] rounded-full" />
                    <div className="w-3/4 h-[6px] bg-[#161820] rounded-full" />
                    <div className="w-3/4 h-[6px] bg-[#161820] rounded-full" />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/50 to-transparent pointer-events-none"></div>
                </div>

                {/* Right Door Panel */}
                <div className={cn(
                    "flex-1 flex flex-col bg-[#0D0E12] items-center justify-center gap-6 md:gap-10 relative transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]",
                    (phase === "entering" || phase === "scanning") ? "animate-[door-pulse-red_2s_infinite]" : "",
                    isDeniedPhase ? "animate-[door-pulse-denied_0.5s_ease-out_3]" : "",
                    phase === "opening" ? "translate-x-[105%]" : "translate-x-0"
                )}>
                    <div className="w-3/4 h-[6px] bg-[#161820] rounded-full" />
                    <div className="w-3/4 h-[6px] bg-[#161820] rounded-full" />
                    <div className="w-3/4 h-[6px] bg-[#161820] rounded-full" />
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/50 to-transparent pointer-events-none"></div>
                </div>

                {/* Laser Scanner Overlay Line */}
                {phase === "scanning" && (
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1),0_0_40px_rgba(239,68,68,0.8)] z-20 animate-[laser-scan_1.5s_linear_infinite]" />
                )}

                {/* Center Lock Indicator Sphere */}
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-sm rotate-45 border-[3px] z-30 transition-all duration-300",
                    phase === "entering" || phase === "scanning" ? "bg-black border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.9)]" : "",
                    phase === "verifying-yellow" ? "bg-yellow-950/80 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,1)]" : "",
                    isDeniedPhase ? "bg-red-950/80 border-red-500 shadow-[0_0_30px_rgba(220,38,38,1)] scale-110 animate-[denied-shake_0.4s_ease-in-out_2]" : "",
                    phase === "granted-green" || phase === "opening" ? "bg-green-950/80 border-green-400 shadow-[0_0_30px_rgba(34,197,94,1)] scale-110" : "",
                    phase === "opening" ? "opacity-0" : "opacity-100"
                )}>
                    <div className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full",
                        phase === "entering" || phase === "scanning" ? "bg-red-500" : "",
                        phase === "verifying-yellow" ? "bg-yellow-400 animate-ping" : "",
                        isDeniedPhase ? "bg-red-500 animate-ping" : "",
                        phase === "granted-green" || phase === "opening" ? "bg-green-400" : ""
                    )} />
                </div>

                {/* ACCESS DENIED X overlay */}
                {isDeniedPhase && (
                    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        <div className="relative">
                            <div className="size-20 relative animate-[denied-x-appear_0.3s_ease-out_forwards]">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[4px] bg-red-500 rotate-45 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[4px] bg-red-500 -rotate-45 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// 3. Status Text Overlay Component
interface StatusTextProps {
    phase: IntroPhase;
    isDeniedPhase: boolean;
}

const StatusText = ({ phase, isDeniedPhase }: StatusTextProps) => {
    return (
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
    )
}

// 4. Start Mission Button Component
interface StartButtonProps {
    phase: IntroPhase;
    isDeniedPhase: boolean;
    onStart: () => void;
}

const StartButton = ({ phase, isDeniedPhase, onStart }: StartButtonProps) => {
    return (
        <div className={cn(
            "absolute left-1/2 -translate-x-1/2 transition-all duration-[1200ms] ease-in-out z-50 flex items-center justify-center pointer-events-auto",
            phase === "entering" || phase === "scanning" || phase === "verifying-yellow" ? "opacity-0 bottom-8 translate-y-8 pointer-events-none" : "",
            isDeniedPhase ? "opacity-100 bottom-8 translate-y-0" : "",
            phase === "granted-green" ? "opacity-0 bottom-8 translate-y-8 pointer-events-none" : "",
            phase === "opening" ? "opacity-0 bottom-8 translate-y-8 pointer-events-none" : ""
        )}>
            <button
                type="button"
                onClick={onStart}
                disabled={phase !== "denied-red"}
                className={cn(
                    "px-8 py-3 md:px-12 md:py-4 font-bold font-mono tracking-[0.2em] rounded overflow-hidden relative group transition-all duration-300",
                    isDeniedPhase
                        ? "bg-red-950/40 border border-red-500 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.4),0_0_40px_rgba(239,68,68,0.2)_inset] hover:bg-red-900 hover:shadow-[0_0_30px_rgba(239,68,68,0.7)] animate-[denied-btn-glow_2s_ease-in-out_infinite]"
                        : "bg-cyan-950/40 border border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4),0_0_40px_rgba(34,211,238,0.2)_inset] hover:bg-cyan-900 hover:shadow-[0_0_30px_rgba(34,211,238,0.7)]"
                )}
            >
                <span className="relative z-10 text-sm">
                    START MISSION
                </span>
                <div className={cn(
                    "absolute inset-0 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out",
                    isDeniedPhase ? "bg-red-500/20" : "bg-cyan-400/20"
                )}></div>
            </button>
        </div>
    )
}

// 5. Main LevelIntro Component
export function LevelIntro({ onComplete, accessGranted = false }: LevelIntroProps) {
    const [state, dispatch] = useReducer(introReducer, initialState)
    const startTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>> | null>(null)
    if (startTimeoutsRef.current === null) {
        startTimeoutsRef.current = new Set()
    }
    const startTimeouts = startTimeoutsRef.current
    const onCompleteRef = useRef(onComplete)

    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    const clearStartTimeouts = () => {
        for (const timeout of startTimeouts) {
            clearTimeout(timeout)
        }
        startTimeouts.clear()
    }

    useEffect(() => {
        let t1: ReturnType<typeof setTimeout> | undefined;
        let t2: ReturnType<typeof setTimeout> | undefined;
        let t3: ReturnType<typeof setTimeout> | undefined;
        let t4: ReturnType<typeof setTimeout> | undefined;
        let t5: ReturnType<typeof setTimeout> | undefined;
        let t6: ReturnType<typeof setTimeout> | undefined;

        if (accessGranted) {
            t1 = setTimeout(() => dispatch({ type: "SET_PHASE", phase: "scanning" }), 500);
            t2 = setTimeout(() => dispatch({ type: "SET_PHASE", phase: "verifying-yellow" }), 4000);
            t3 = setTimeout(() => dispatch({ type: "SET_PHASE", phase: "granted-green" }), 8500);
            t4 = setTimeout(() => dispatch({ type: "SET_PHASE", phase: "opening" }), 10500);
            t5 = setTimeout(() => dispatch({ type: "SET_PHASE", phase: "hidden" }), 11800);
            t6 = setTimeout(() => onCompleteRef.current?.(), 11900);
        } else {
            t1 = setTimeout(() => dispatch({ type: "SET_PHASE", phase: "scanning" }), 500);
            t2 = setTimeout(() => dispatch({ type: "SET_PHASE", phase: "verifying-yellow" }), 4000);
            t3 = setTimeout(() => dispatch({ type: "SET_PHASE", phase: "denied-red" }), 8500);
        }

        return () => {
            if (t1) clearTimeout(t1);
            if (t2) clearTimeout(t2);
            if (t3) clearTimeout(t3);
            if (t4) clearTimeout(t4);
            if (t5) clearTimeout(t5);
            if (t6) clearTimeout(t6);
        }
    }, [accessGranted])

    useEffect(() => {
        return () => {
            for (const timeout of startTimeouts) {
                clearTimeout(timeout)
            }
            startTimeouts.clear()
        }
    }, [startTimeouts])

    const handleStartMission = () => {
        if (state.phase !== "denied-red") return;
        clearStartTimeouts();
        dispatch({ type: "SET_PHASE", phase: "opening" });
        startTimeouts.add(setTimeout(() => dispatch({ type: "SET_PHASE", phase: "hidden" }), 1300));
        startTimeouts.add(setTimeout(() => onCompleteRef.current?.(), 1400));
    }

    const handleSkip = () => {
        dispatch({ type: "SET_PHASE", phase: "hidden" });
        onCompleteRef.current?.();
    }

    if (state.phase === "hidden") return null;

    const isDeniedPhase = state.phase === "denied-red";

    return (
        <div className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-1000",
            accessGranted ? "bg-black/60 backdrop-blur-md" : "bg-black",
            state.phase === "opening" ? "opacity-0 pointer-events-none delay-500" : "opacity-100"
        )}>
            <SkipButton
                accessGranted={accessGranted}
                phase={state.phase}
                onSkip={handleSkip}
            />

            <div className={cn(
                "relative w-full h-full md:h-auto max-w-[1920px] md:aspect-video max-h-screen overflow-hidden transition-all duration-1000 transform",
                accessGranted ? "bg-transparent border-none shadow-none" : "bg-[#07080A] border-4 border-[#1F261F] shadow-2xl",
                state.phase === "entering" ? "scale-95 opacity-0 blur-sm" : "scale-100 opacity-100 blur-none",
                state.phase === "opening" ? "scale-110 opacity-0 blur-md transition-all duration-[1200ms]" : ""
            )}>
                {!accessGranted && (
                    <>
                        <div className="absolute inset-0 bg-[#07080A] border-[#1F261F]"></div>
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0D0E12_1px,transparent_1px),linear-gradient(to_bottom,#0D0E12_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60"></div>
                        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none bg-black"></div>

                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-40 pointer-events-none"></div>
                        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-40 pointer-events-none"></div>

                        <div className="absolute top-4 md:top-8 inset-x-4 md:inset-x-12 flex justify-between items-start z-50 pointer-events-none">
                            <div className="px-3 py-1 md:px-5 md:py-2 bg-indigo-950/20 border border-indigo-500/30 text-indigo-400 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] rounded backdrop-blur-sm">Sector 1A</div>
                            <div className="hidden sm:block px-6 py-1 md:px-10 md:py-2 bg-black/50 border border-[#1F261F] text-[#8F9F8F] font-mono text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] rounded backdrop-blur-md">System Security</div>
                            <div className={cn(
                                "px-3 py-1 md:px-5 md:py-2 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] rounded backdrop-blur-sm transition-all duration-500",
                                isDeniedPhase
                                    ? "bg-red-950/30 border border-red-500/60 text-red-400"
                                    : "bg-emerald-950/30 border border-emerald-500/40 text-emerald-400"
                            )}>Level 1</div>
                        </div>
                    </>
                )}

                {isDeniedPhase && (
                    <div className="absolute inset-0 z-[60] pointer-events-none animate-[denied-flash_0.6s_ease-out_forwards]">
                        <div className="absolute inset-0 bg-red-900/30"></div>
                    </div>
                )}

                <div className="absolute inset-0 flex">
                    <div className="flex-1 flex flex-col items-center justify-center z-10 p-12 relative">
                        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                            <div className={cn(
                                "w-full h-full max-w-2xl aspect-square blur-[120px] rounded-full transition-colors duration-700",
                                isDeniedPhase ? "bg-red-900/10" : "bg-indigo-950/5"
                            )}></div>
                        </div>

                        <ScannerDoor
                            phase={state.phase}
                            isDeniedPhase={isDeniedPhase}
                        />

                        <StatusText
                            phase={state.phase}
                            isDeniedPhase={isDeniedPhase}
                        />

                        <StartButton
                            phase={state.phase}
                            isDeniedPhase={isDeniedPhase}
                            onStart={handleStartMission}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
