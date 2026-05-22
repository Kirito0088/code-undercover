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
                <div className="flex w-full h-full p-2 gap-2 relative z-10">
                    {/* LEFT: Briefing */}
                    <section className="w-[28%] min-w-[280px] h-full bg-gray-950/80 border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
                        <LeftPanel mission={mission} missionCleared={missionCleared} attemptCount={attemptCount} />
                    </section>

                    {/* CENTER: Editor */}
                    <section className="flex-1 h-full bg-gray-950/90 border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative min-w-0 min-h-0">
                        <EditorPanel
                            mission={mission}
                            setTerminalOutput={setTerminalOutput}
                            attemptCount={attemptCount}
                            setAttemptCount={setAttemptCount}
                            setInnovationUnlocked={setInnovationUnlocked}
                            setMissionCleared={setMissionCleared}
                            setClearInfo={setClearInfo}
                            setPendingClearInfo={setPendingClearInfo}
                        />
                    </section>

                    {/* RIGHT: Terminal & Hints */}
                    <section className="w-[28%] min-w-[280px] h-full bg-gray-950/80 border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
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
