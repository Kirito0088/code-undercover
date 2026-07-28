"use client"

import { useReducer } from "react"
import dynamic from "next/dynamic"
import type { MissionRecord, UserMissionRecord } from "@/types"
import { LeftPanel } from "./panels/LeftPanel"
import { EditorPanel } from "./panels/EditorPanel"
import { TerminalPanel } from "./panels/TerminalPanel"
import { TeachingPhase } from "./phases/TeachingPhase"
import { MCQPhase } from "./phases/MCQPhase"
import { CharacterManager } from "./CharacterManager"
import { cn } from "@/lib/utils"
import { ChevronLeft, Zap } from "lucide-react"
import Link from "next/link"

// Code-split: only needed for mission #1's first-time intro and the
// access-granted cinematic on mission clear, not on every workspace load.
const LevelIntro = dynamic(() => import("../LevelIntro").then((mod) => mod.LevelIntro), {
    ssr: false,
    loading: () => null,
})

interface MissionWorkspaceProps {
    mission: MissionRecord
    userMission: UserMissionRecord
    userProfile: { auraPoints: number; auraLevel: number; foxBadges: number }
}

export type TerminalLine = {
    id: string
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
    isReplay?: boolean
    wouldHaveEarned?: number
}

interface WorkspaceState {
    phase: "TEACHING" | "MCQ" | "CODING";
    hintsUsed: number;
    attemptCount: number;
    innovationUnlocked: boolean;
    missionCleared: boolean;
    clearInfo: MissionClearInfo | null;
    pendingClearInfo: MissionClearInfo | null;
    showIntro: boolean;
    showGrantedIntro: boolean;
    activeTab: "briefing" | "editor" | "terminal";
    terminalOutput: TerminalLine[];
}

type WorkspaceAction =
    | { type: "SET_PHASE"; phase: "TEACHING" | "MCQ" | "CODING" }
    | { type: "SET_HINTS_USED"; count: number }
    | { type: "SET_ATTEMPT_COUNT"; count: number }
    | { type: "SET_INNOVATION_UNLOCKED"; unlocked: boolean }
    | { type: "SET_MISSION_CLEARED"; cleared: boolean }
    | { type: "SET_CLEAR_INFO"; info: MissionClearInfo | null }
    | { type: "SET_PENDING_CLEAR_INFO"; info: MissionClearInfo | null }
    | { type: "SET_SHOW_INTRO"; show: boolean }
    | { type: "SET_SHOW_GRANTED_INTRO"; show: boolean }
    | { type: "SET_ACTIVE_TAB"; tab: "briefing" | "editor" | "terminal" }
    | { type: "SET_TERMINAL_OUTPUT"; output: TerminalLine[] };

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
    switch (action.type) {
        case "SET_PHASE":
            return { ...state, phase: action.phase };
        case "SET_HINTS_USED":
            return { ...state, hintsUsed: action.count };
        case "SET_ATTEMPT_COUNT":
            return { ...state, attemptCount: action.count };
        case "SET_INNOVATION_UNLOCKED":
            return { ...state, innovationUnlocked: action.unlocked };
        case "SET_MISSION_CLEARED":
            return { ...state, missionCleared: action.cleared };
        case "SET_CLEAR_INFO":
            return { ...state, clearInfo: action.info };
        case "SET_PENDING_CLEAR_INFO":
            return { ...state, pendingClearInfo: action.info };
        case "SET_SHOW_INTRO":
            return { ...state, showIntro: action.show };
        case "SET_SHOW_GRANTED_INTRO":
            return { ...state, showGrantedIntro: action.show };
        case "SET_ACTIVE_TAB":
            return { ...state, activeTab: action.tab };
        case "SET_TERMINAL_OUTPUT":
            return { ...state, terminalOutput: action.output };
        default:
            return state;
    }
}

export function MissionWorkspace({
    mission,
    userMission,
}: MissionWorkspaceProps) {
    const [state, dispatch] = useReducer(workspaceReducer, {
        phase: (userMission?.phase as "TEACHING" | "MCQ" | "CODING") || "TEACHING",
        hintsUsed: userMission?.hintsUsed || 0,
        attemptCount: userMission?.attemptCount || 0,
        innovationUnlocked: userMission?.innovationUnlocked || false,
        missionCleared: false,
        clearInfo: null,
        pendingClearInfo: null,
        showIntro: mission.order === 1 && (!userMission?.phase || userMission.phase === "TEACHING"),
        showGrantedIntro: false,
        activeTab: "editor",
        terminalOutput: [
            { id: "init-0", type: "system", message: "> Terminal initialized. Ready for code input." },
        ],
    });

    const setPhase = (phase: "TEACHING" | "MCQ" | "CODING") => dispatch({ type: "SET_PHASE", phase })
    const setHintsUsed = (count: number | ((prev: number) => number)) => {
        dispatch({ type: "SET_HINTS_USED", count: typeof count === "function" ? count(state.hintsUsed) : count })
    }
    const setAttemptCount = (count: number | ((prev: number) => number)) => {
        dispatch({ type: "SET_ATTEMPT_COUNT", count: typeof count === "function" ? count(state.attemptCount) : count })
    }
    const setInnovationUnlocked = (unlocked: boolean | ((prev: boolean) => boolean)) => {
        dispatch({ type: "SET_INNOVATION_UNLOCKED", unlocked: typeof unlocked === "function" ? unlocked(state.innovationUnlocked) : unlocked })
    }
    const setMissionCleared = (cleared: boolean) => dispatch({ type: "SET_MISSION_CLEARED", cleared })
    const setClearInfo = (info: MissionClearInfo | null) => dispatch({ type: "SET_CLEAR_INFO", info })
    const setPendingClearInfo = (info: MissionClearInfo | null | ((prev: MissionClearInfo | null) => MissionClearInfo | null)) => {
        dispatch({ type: "SET_PENDING_CLEAR_INFO", info: typeof info === "function" ? info(state.pendingClearInfo) : info })
    }
    const setShowIntro = (show: boolean) => dispatch({ type: "SET_SHOW_INTRO", show })
    const setShowGrantedIntro = (show: boolean) => dispatch({ type: "SET_SHOW_GRANTED_INTRO", show })
    const setActiveTab = (tab: "briefing" | "editor" | "terminal") => dispatch({ type: "SET_ACTIVE_TAB", tab })
    const setTerminalOutput = (val: TerminalLine[] | ((prev: TerminalLine[]) => TerminalLine[])) => {
        dispatch({ type: "SET_TERMINAL_OUTPUT", output: typeof val === "function" ? val(state.terminalOutput) : val })
    }

    // Called when user clicks "Finish Mission" in the terminal
    const handleFinishMission = () => {
        if (state.pendingClearInfo) {
            if (mission.order === 1) {
                // Only Level 1 gets the cinematic door animation
                setShowGrantedIntro(true)
            } else {
                // All other levels skip the animation and go straight to results
                setClearInfo(state.pendingClearInfo)
                setMissionCleared(true)
            }
        }
    }

    // Called when the access-granted intro finishes playing
    const handleGrantedIntroComplete = () => {
        setShowGrantedIntro(false)
        if (state.pendingClearInfo) {
            setClearInfo(state.pendingClearInfo)
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
        <div className="flex h-[calc(100vh-3.5rem)] w-full bg-[#14141A] text-[#F1F1F5] overflow-hidden flex-col relative selection:bg-indigo-500/30">
            {/* Top Workspace Header (h-14) */}
            <header className="h-14 w-full bg-[#131318] border-b border-[#323242] flex items-center justify-between px-6 z-20 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors">
                        <ChevronLeft className="size-4" />
                        <span>Dashboard</span>
                    </Link>
                    <div className="h-4 w-px bg-[#323242]" />
                    <h1 className="text-[#F1F1F5] font-headline font-bold text-sm tracking-wide">
                        {String(mission.order).padStart(2, "0")}. {mission.title}
                    </h1>
                </div>
                
                {/* Center Phase Tabs */}
                <div className="hidden sm:flex items-center h-full gap-8">
                    <span className={cn(
                        "h-full px-2 text-sm font-medium flex items-center transition-colors border-b-2 -mb-px",
                        state.phase === "TEACHING"
                            ? "text-[#F1F1F5] font-bold border-indigo-500"
                            : "text-[#8B8BA7] border-transparent"
                    )}>
                        Theory
                    </span>
                    <span className={cn(
                        "h-full px-2 text-sm font-medium flex items-center transition-colors border-b-2 -mb-px",
                        state.phase === "MCQ"
                            ? "text-[#F1F1F5] font-bold border-indigo-500"
                            : "text-[#8B8BA7] border-transparent"
                    )}>
                        Quiz
                    </span>
                    <span className={cn(
                        "h-full px-2 text-sm font-medium flex items-center transition-colors border-b-2 -mb-px",
                        state.phase === "CODING"
                            ? "text-[#F1F1F5] font-bold border-indigo-500"
                            : "text-[#8B8BA7] border-transparent"
                    )}>
                        Code
                    </span>
                </div>

                {/* Right Area: AP Indicator */}
                <div className="flex items-center gap-4">
                    <div className="text-xs text-indigo-400 font-mono flex items-center gap-1.5 bg-indigo-500/5 border border-[#323242] px-2.5 py-1 rounded-md">
                        <Zap className="size-3.5" />
                        <span>{userMission?.status === "COMPLETED" ? "0 AP (Replay)" : `+${mission.auraReward} AP`}</span>
                    </div>
                </div>
            </header>

            {/* Content Body Container */}
            <div className="flex-1 min-h-0 w-full relative flex flex-col">
                {/* Background ambient glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14, 185, 77, 0.04)_0%,transparent_70%)] pointer-events-none"></div>

                {/* Character Overlay Manager */}
                <CharacterManager
                    key={`${mission.id}_${state.innovationUnlocked}`}
                    phase={state.phase}
                    attemptCount={state.attemptCount}
                    innovationUnlocked={state.innovationUnlocked}
                    missionCleared={state.missionCleared}
                    clearInfo={state.clearInfo}
                    missionId={mission.id}
                />

                {/* Cinematic Level 1 Intro */}
                {state.phase === "TEACHING" && state.showIntro && (
                    <LevelIntro onComplete={handleIntroComplete} accessGranted={false} />
                )}

                {/* Full-screen Phases */}
                {state.phase === "TEACHING" && !state.showIntro && (
                    <TeachingPhase mission={mission} onComplete={handleTeachingComplete} />
                )}

                {/* Access Granted Intro */}
                {state.showGrantedIntro && (
                    <LevelIntro onComplete={handleGrantedIntroComplete} accessGranted={true} />
                )}

                {state.phase === "MCQ" && (
                    <MCQPhase
                        mission={mission}
                        onComplete={() => syncPhase("CODING")}
                    />
                )}

                {/* Coding Phase: 3-Panel Layout */}
                {state.phase === "CODING" && (
                    <div className="flex flex-col md:flex-row w-full h-full relative z-10 min-h-0">
                        {/* Mobile Tabs Header */}
                        <div className="flex md:hidden bg-[#1C1C24] border-b border-[#323242] p-2 gap-1 flex-shrink-0 w-full">
                            <button
                                type="button"
                                onClick={() => setActiveTab("briefing")}
                                className={cn(
                                    "flex-1 py-2 px-3 text-xs font-medium rounded transition-all text-center border",
                                    state.activeTab === "briefing"
                                        ? "bg-[#2A2A35] text-[#F1F1F5] border-[#323242]"
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
                                    state.activeTab === "editor"
                                        ? "bg-[#2A2A35] text-[#F1F1F5] border-[#323242]"
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
                                    state.activeTab === "terminal"
                                        ? "bg-[#2A2A35] text-[#F1F1F5] border-[#323242]"
                                        : "text-[#8B8BA7] hover:text-[#F1F1F5] border-transparent bg-transparent"
                                )}
                            >
                                Terminal
                            </button>
                        </div>

                        {/* LEFT: Briefing */}
                        <section className={cn(
                            "w-full md:w-[25%] md:min-w-[300px] shrink-0 md:h-full flex flex-col relative min-h-0",
                            state.activeTab === "briefing" ? "flex" : "hidden md:flex"
                        )}>
                            <LeftPanel mission={mission} missionCleared={state.missionCleared} attemptCount={state.attemptCount} />
                        </section>

                        {/* CENTER: Editor */}
                        <section className={cn(
                            "w-full md:w-[50%] md:min-w-[400px] flex-grow md:h-full flex flex-col relative min-w-0 min-h-0",
                            state.activeTab === "editor" ? "flex" : "hidden md:flex"
                        )}>
                            <EditorPanel
                                mission={mission}
                                setTerminalOutput={setTerminalOutput}
                                attemptCount={state.attemptCount}
                                setAttemptCount={setAttemptCount}
                                setInnovationUnlocked={setInnovationUnlocked}
                                setPendingClearInfo={setPendingClearInfo}
                                onRunStarted={() => setActiveTab("terminal")}
                            />
                        </section>

                        {/* RIGHT: Terminal & Hints */}
                        <section className={cn(
                            "w-full md:w-[25%] md:min-w-[340px] shrink-0 md:h-full flex flex-col relative min-h-0",
                            state.activeTab === "terminal" ? "flex" : "hidden md:flex"
                        )}>
                            <TerminalPanel
                                mission={mission}
                                terminalOutput={state.terminalOutput}
                                setTerminalOutput={setTerminalOutput}
                                hintsUsed={state.hintsUsed}
                                setHintsUsed={setHintsUsed}
                                attemptCount={state.attemptCount}
                                innovationUnlocked={state.innovationUnlocked}
                                onFinishMission={handleFinishMission}
                            />
                        </section>
                    </div>
                )}
            </div>
        </div>
    )
}
