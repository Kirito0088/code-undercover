"use client"

import { useState } from "react"
import type { MissionRecord, UserMissionRecord } from "@/types"
import { LeftPanel } from "./panels/LeftPanel"
import { EditorPanel } from "./panels/EditorPanel"
import { TerminalPanel } from "./panels/TerminalPanel"
import { TeachingPhase } from "./phases/TeachingPhase"
import { MCQPhase } from "./phases/MCQPhase"
import { CharacterManager } from "./CharacterManager"
import { LevelIntro } from "../LevelIntro"
import { cn } from "@/lib/utils"
import { ChevronLeft, Zap } from "lucide-react"
import Link from "next/link"

interface MissionWorkspaceProps {
    mission: MissionRecord
    userMission: UserMissionRecord
    userProfile: { auraPoints: number; auraLevel: number; foxBadges: number }
}

type TerminalLine = {
    type: "system" | "error" | "success" | "hint" | "finish" | "input-prompt"
    message: string
    rawContext?: string
    isDiagnostic?: boolean
    onSubmit?: (val: string) => void
}

export interface MissionClearInfo {
    auraEarned: number
    comboStreak: number
    comboBonus: number
}

export function MissionWorkspace({
    mission,
    userMission,
}: MissionWorkspaceProps) {
    const [phase, setPhase] = useState<"TEACHING" | "MCQ" | "CODING">(
        (userMission.phase as "TEACHING" | "MCQ" | "CODING") || "TEACHING"
    )
    const [hintsUsed, setHintsUsed] = useState(userMission.hintsUsed || 0)
    const [attemptCount, setAttemptCount] = useState(
        userMission.attemptCount || 0
    )
    const [innovationUnlocked, setInnovationUnlocked] = useState(
        userMission.innovationUnlocked || false
    )
    const [missionCleared, setMissionCleared] = useState(false)
    const [clearInfo, setClearInfo] = useState<MissionClearInfo | null>(null)
    const [pendingClearInfo, setPendingClearInfo] = useState<MissionClearInfo | null>(null)
    const [showIntro, setShowIntro] = useState(
        mission.order === 1 && (!userMission.phase || userMission.phase === "TEACHING")
    )
    const [showGrantedIntro, setShowGrantedIntro] = useState(false)
    const [activeTab, setActiveTab] = useState<"briefing" | "editor" | "terminal">("editor")

    const [terminalOutput, setTerminalOutput] = useState<TerminalLine[]>([
        { type: "system", message: "> Terminal initialized. Ready for code input." },
    ])

    // Called when user clicks "Finish Mission" in the terminal
    const handleFinishMission = () => {
        if (pendingClearInfo) {
            if (mission.order === 1) {
                // Only Level 1 gets the cinematic door animation
                setShowGrantedIntro(true)
            } else {
                // All other levels skip the animation and go straight to results
                setClearInfo(pendingClearInfo)
                setMissionCleared(true)
            }
        }
    }

    // Called when the access-granted intro finishes playing
    const handleGrantedIntroComplete = () => {
        setShowGrantedIntro(false)
        if (pendingClearInfo) {
            setClearInfo(pendingClearInfo)
            setMissionCleared(true)
        }
    }

    // Server sync for phase
    const syncPhase = async (newPhase: "TEACHING" | "MCQ" | "CODING") => {
        setPhase(newPhase)
        try {
            await fetch("/api/missions/phase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id, phase: newPhase }),
            })
        } catch (e) {
            console.error("Failed to sync phase", e)
        }
    }

    // Called when Teaching Phase completes → transition to MCQ
    const handleTeachingComplete = () => {
        syncPhase("MCQ")
    }

    // Called when Level Intro (denied flow) finishes → transition to Teaching Briefing
    const handleIntroComplete = () => {
        setShowIntro(false)
    }

    return (
        <div className="flex h-[calc(100vh-3.5rem)] w-full bg-[#0A0A0F] text-[#F1F1F5] overflow-hidden flex-col relative selection:bg-indigo-500/30">
            {/* Top Workspace Header (h-14) */}
            <header className="h-14 w-full bg-[#131318] border-b border-[#22222E] flex items-center justify-between px-6 z-20 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        <span>Dashboard</span>
                    </Link>
                    <div className="h-4 w-px bg-[#22222E]" />
                    <h1 className="text-[#F1F1F5] font-headline font-bold text-sm tracking-wide">
                        {String(mission.order).padStart(2, "0")}. {mission.title}
                    </h1>
                </div>
                
                {/* Center Phase Tabs */}
                <div className="hidden sm:flex items-center h-full gap-8">
                    <span className={cn(
                        "h-full px-2 text-sm font-medium flex items-center transition-colors border-b-2 -mb-px",
                        phase === "TEACHING"
                            ? "text-[#F1F1F5] font-bold border-indigo-500"
                            : "text-[#8B8BA7] border-transparent"
                    )}>
                        Theory
                    </span>
                    <span className={cn(
                        "h-full px-2 text-sm font-medium flex items-center transition-colors border-b-2 -mb-px",
                        phase === "MCQ"
                            ? "text-[#F1F1F5] font-bold border-indigo-500"
                            : "text-[#8B8BA7] border-transparent"
                    )}>
                        Quiz
                    </span>
                    <span className={cn(
                        "h-full px-2 text-sm font-medium flex items-center transition-colors border-b-2 -mb-px",
                        phase === "CODING"
                            ? "text-[#F1F1F5] font-bold border-indigo-500"
                            : "text-[#8B8BA7] border-transparent"
                    )}>
                        Code
                    </span>
                </div>

                {/* Right Area: AP Indicator */}
                <div className="flex items-center gap-4">
                    <div className="text-xs text-indigo-400 font-mono flex items-center gap-1.5 bg-indigo-500/5 border border-[#22222E] px-2.5 py-1 rounded-md">
                        <Zap className="w-3.5 h-3.5" />
                        <span>+{mission.auraReward} AP</span>
                    </div>
                </div>
            </header>

            {/* Content Body Container */}
            <div className="flex-1 min-h-0 w-full relative flex flex-col">
                {/* Background ambient glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.04)_0%,transparent_70%)] pointer-events-none"></div>

                {/* Character Overlay Manager */}
                <CharacterManager
                    phase={phase}
                    attemptCount={attemptCount}
                    innovationUnlocked={innovationUnlocked}
                    missionCleared={missionCleared}
                    clearInfo={clearInfo}
                    missionId={mission.id}
                />

                {/* Cinematic Level 1 Intro */}
                {phase === "TEACHING" && showIntro && (
                    <LevelIntro onComplete={handleIntroComplete} accessGranted={false} />
                )}

                {/* Full-screen Phases */}
                {phase === "TEACHING" && !showIntro && (
                    <TeachingPhase mission={mission} onComplete={handleTeachingComplete} />
                )}

                {/* Access Granted Intro */}
                {showGrantedIntro && (
                    <LevelIntro onComplete={handleGrantedIntroComplete} accessGranted={true} />
                )}

                {phase === "MCQ" && (
                    <MCQPhase
                        mission={mission}
                        onComplete={() => syncPhase("CODING")}
                    />
                )}

                {/* Coding Phase: 3-Panel Layout */}
                {phase === "CODING" && (
                    <div className="flex flex-col md:flex-row w-full h-full relative z-10 min-h-0">
                        {/* Mobile Tabs Header */}
                        <div className="flex md:hidden bg-[#111118] border-b border-[#22222E] p-2 gap-1 flex-shrink-0 w-full">
                            <button
                                type="button"
                                onClick={() => setActiveTab("briefing")}
                                className={cn(
                                    "flex-1 py-2 px-3 text-xs font-medium rounded transition-all text-center border",
                                    activeTab === "briefing"
                                        ? "bg-[#1C1C28] text-[#F1F1F5] border-[#22222E]"
                                        : "text-[#8B8BA7] hover:text-[#F1F1F5] border-transparent bg-transparent"
                                )}
                            >
                                Briefing
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("editor")}
                                className={cn(
                                    "flex-1 py-2 px-3 text-xs font-medium rounded transition-all text-center border",
                                    activeTab === "editor"
                                        ? "bg-[#1C1C28] text-[#F1F1F5] border-[#22222E]"
                                        : "text-[#8B8BA7] hover:text-[#F1F1F5] border-transparent bg-transparent"
                                )}
                            >
                                Editor
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("terminal")}
                                className={cn(
                                    "flex-1 py-2 px-3 text-xs font-medium rounded transition-all text-center border",
                                    activeTab === "terminal"
                                        ? "bg-[#1C1C28] text-[#F1F1F5] border-[#22222E]"
                                        : "text-[#8B8BA7] hover:text-[#F1F1F5] border-transparent bg-transparent"
                                )}
                            >
                                Terminal
                            </button>
                        </div>

                        {/* LEFT: Briefing */}
                        <section className={cn(
                            "w-full md:w-[280px] shrink-0 md:h-full flex flex-col relative min-h-0",
                            activeTab === "briefing" ? "flex" : "hidden md:flex"
                        )}>
                            <LeftPanel mission={mission} missionCleared={missionCleared} attemptCount={attemptCount} />
                        </section>

                        {/* CENTER: Editor */}
                        <section className={cn(
                            "w-full md:w-auto flex-grow md:h-full flex flex-col relative min-w-0 min-h-0",
                            activeTab === "editor" ? "flex" : "hidden md:flex"
                        )}>
                            <EditorPanel
                                mission={mission}
                                setTerminalOutput={setTerminalOutput}
                                attemptCount={attemptCount}
                                setAttemptCount={setAttemptCount}
                                setInnovationUnlocked={setInnovationUnlocked}
                                setMissionCleared={setMissionCleared}
                                setClearInfo={setClearInfo}
                                setPendingClearInfo={setPendingClearInfo}
                                onRunStarted={() => setActiveTab("terminal")}
                            />
                        </section>

                        {/* RIGHT: Terminal & Hints */}
                        <section className={cn(
                            "w-full md:w-[320px] shrink-0 md:h-full flex flex-col relative min-h-0",
                            activeTab === "terminal" ? "flex" : "hidden md:flex"
                        )}>
                            <TerminalPanel
                                mission={mission}
                                terminalOutput={terminalOutput}
                                setTerminalOutput={setTerminalOutput}
                                hintsUsed={hintsUsed}
                                setHintsUsed={setHintsUsed}
                                attemptCount={attemptCount}
                                innovationUnlocked={innovationUnlocked}
                                onFinishMission={handleFinishMission}
                            />
                        </section>
                    </div>
                )}
            </div>
        </div>
    )
}
