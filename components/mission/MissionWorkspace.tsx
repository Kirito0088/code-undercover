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
        <div className="flex h-[calc(100vh-4rem)] w-full bg-black text-white overflow-hidden relative font-mono selection:bg-green-500/30">
            {/* Background ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.04)_0%,transparent_70%)] pointer-events-none"></div>

            {/* Character Overlay Manager (handles Fox/Panda popups globally) */}
            <CharacterManager
                phase={phase}
                attemptCount={attemptCount}
                innovationUnlocked={innovationUnlocked}
                missionCleared={missionCleared}
                clearInfo={clearInfo}
                missionId={mission.id}
            />

            {/* Cinematic Level 1 Intro (plays BEFORE teaching briefing) */}
            {phase === "TEACHING" && showIntro && (
                <LevelIntro onComplete={handleIntroComplete} accessGranted={false} />
            )}

            {/* Full-screen Phases */}
            {phase === "TEACHING" && !showIntro && (
                <TeachingPhase mission={mission} onComplete={handleTeachingComplete} />
            )}

            {/* Access Granted Intro (after successful code execution) */}
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
                <div className="flex flex-col md:flex-row w-full h-full p-2 gap-2 relative z-10">
                    {/* Mobile Tabs Header */}
                    <div className="flex md:hidden bg-gray-950 border border-gray-800 rounded-lg p-1 gap-1 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab("briefing")}
                            className={cn(
                                "flex-1 py-2 px-3 text-xs font-bold tracking-wider uppercase rounded font-mono transition-all text-center border",
                                activeTab === "briefing"
                                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                                    : "text-gray-400 hover:text-white border-transparent bg-transparent"
                            )}
                        >
                            Briefing
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("editor")}
                            className={cn(
                                "flex-1 py-2 px-3 text-xs font-bold tracking-wider uppercase rounded font-mono transition-all text-center border",
                                activeTab === "editor"
                                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                                    : "text-gray-400 hover:text-white border-transparent bg-transparent"
                            )}
                        >
                            Editor
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("terminal")}
                            className={cn(
                                "flex-1 py-2 px-3 text-xs font-bold tracking-wider uppercase rounded font-mono transition-all text-center border",
                                activeTab === "terminal"
                                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                                    : "text-gray-400 hover:text-white border-transparent bg-transparent"
                            )}
                        >
                            Terminal
                        </button>
                    </div>

                    {/* LEFT: Briefing */}
                    <section className={cn(
                        "w-full md:w-[28%] md:min-w-[280px] flex-1 md:h-full bg-gray-950/80 border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex-col relative",
                        activeTab === "briefing" ? "flex" : "hidden md:flex"
                    )}>
                        <LeftPanel mission={mission} missionCleared={missionCleared} attemptCount={attemptCount} />
                    </section>

                    {/* CENTER: Editor */}
                    <section className={cn(
                        "w-full md:w-auto flex-1 md:h-full bg-gray-950/90 border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex-col relative min-w-0 min-h-0",
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
                        "w-full md:w-[28%] md:min-w-[280px] flex-1 md:h-full bg-gray-950/80 border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex-col relative",
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
    )
}
