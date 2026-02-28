"use client"

import { useState } from "react"
import type { MissionRecord, UserMissionRecord } from "@/types"
import { LeftPanel } from "./panels/LeftPanel"
import { EditorPanel } from "./panels/EditorPanel"
import { TerminalPanel } from "./panels/TerminalPanel"
import { TeachingPhase } from "./phases/TeachingPhase"
import { MCQPhase } from "./phases/MCQPhase"
import { CharacterManager } from "./CharacterManager"

interface MissionWorkspaceProps {
    mission: MissionRecord
    userMission: UserMissionRecord
    userProfile: { xp: number; level: number; foxBadges: number }
}

type TerminalLine = {
    type: "system" | "error" | "success" | "hint"
    message: string
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

    const [terminalOutput, setTerminalOutput] = useState<TerminalLine[]>([
        { type: "system", message: "> Terminal initialized. Ready for code input." },
    ])

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

    return (
        <div className="flex h-screen w-full bg-black text-white overflow-hidden relative font-mono selection:bg-green-500/30">
            {/* Background ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.04)_0%,transparent_70%)] pointer-events-none"></div>

            {/* Character Overlay Manager (handles Fox/Panda popups globally) */}
            <CharacterManager
                phase={phase}
                attemptCount={attemptCount}
                innovationUnlocked={innovationUnlocked}
            />

            {/* Full-screen Phases */}
            {phase === "TEACHING" && (
                <TeachingPhase mission={mission} onComplete={() => syncPhase("MCQ")} />
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
                    {/* LEFT: Briefing & Platypus Mentor */}
                    <section className="w-[28%] min-w-[280px] h-full bg-gray-950/80 border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
                        <LeftPanel mission={mission} />
                    </section>

                    {/* CENTER: Editor */}
                    <section className="flex-1 h-full bg-gray-950/90 border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
                        <EditorPanel
                            mission={mission}
                            setTerminalOutput={setTerminalOutput}
                            attemptCount={attemptCount}
                            setAttemptCount={setAttemptCount}
                            setInnovationUnlocked={setInnovationUnlocked}
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
                        />
                    </section>
                </div>
            )}
        </div>
    )
}
