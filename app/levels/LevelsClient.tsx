"use client"

import React, { useState } from "react"
import { BookOpen, Play, Zap, CheckCircle, Lock, Target, X } from "lucide-react"
import type { MissionStatus } from "@/types"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { getRankBadgeStyles } from "@/lib/aura"
import { HudPage } from "@/components/hud/HudPage"
import { HudPanel } from "@/components/hud/HudPanel"
import { HudNav } from "@/components/hud/HudNav"
import { LevelNode, BEGINNER_CURRICULUM, INTERMEDIATE_CURRICULUM, EXPERT_CURRICULUM, TRACKS } from "./curriculum"

interface LevelsClientProps {
    user: {
        name: string | null
        email: string | null
        auraPoints: number
        auraLevel: number
        comboStreak: number
        foxBadges: number
    } | null
    dbMissions: {
        id: string
        order: number
        title: string
        description: string
        difficulty: string
        auraReward: number
    }[]
    userMissions: {
        id: string
        missionId: string
        status: string
    }[]
    currentRank: string
    nextThreshold: number
}

// 1. Left Sidebar Component
interface LeftSidebarProps {
    user: LevelsClientProps["user"];
    currentRank: string;
    nextThreshold: number;
    rankStyles: { colorText: string; shadow: string };
}

const LeftSidebar = ({ user, currentRank, nextThreshold, rankStyles }: LeftSidebarProps) => {
    // Generate a simple identifier string
    const emailPrefix = user?.email ? user.email.split('@')[0].toUpperCase() : "AGENT";
    const displayId = emailPrefix.substring(0, 8);

    return (
        <aside className="w-full xl:w-[240px] shrink-0 flex flex-col gap-6">
            {/* Agent Dossier block */}
            <HudPanel radius="lg" className="p-5 flex flex-col items-center">
                {/* Barcode/Serial Details */}
                <div className="w-full flex justify-between items-center mb-4 border-b border-[#1F261F] pb-2 font-mono text-[10px] text-[#4A5D4A]">
                    <span>SYS.OP // CODE</span>
                    <span>ID: {displayId}</span>
                </div>

                {/* Avatar Scanner Reticle */}
                <div className="relative mb-4 group/avatar">
                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                    <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-500 rounded-br-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>

                    <div className="size-16 bg-[#161820]/80 rounded-sm border border-[#1F261F] flex items-center justify-center text-2xl font-mono font-bold text-emerald-400 shadow-inner select-none drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">
                        {(user?.name || "U")[0].toUpperCase()}
                    </div>
                </div>

                <div className="text-center w-full">
                    <span className="text-[10px] font-mono tracking-widest text-[#4A5D4A] uppercase block">AGENT CODENAME</span>
                    <h2 className="text-base font-mono font-bold text-[#E2E8F0] truncate max-w-full tracking-wide">
                        {user?.name || "Anonymous Agent"}
                    </h2>

                    <div className="inline-flex items-center gap-1.5 mt-2 bg-[#161820]/50 border border-[#1F261F] px-2.5 py-1 rounded-sm">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-mono font-medium text-[#8F9F8F]">
                            Clearance: <span className={`${rankStyles.colorText} ${rankStyles.shadow}`}>{currentRank}</span>
                        </span>
                    </div>
                </div>

                {/* Segmented Clearance gauge */}
                <div className="w-full mt-5 pt-3 border-t border-[#1F261F]">
                    <div className="flex justify-between text-[11px] font-mono text-[#8F9F8F] mb-1.5">
                        <span>PROGRESS</span>
                        <span className="text-emerald-400">{Math.round(Math.min(100, ((user?.auraPoints ?? 0) / nextThreshold) * 100))}%</span>
                    </div>

                    <div className="flex gap-0.5 h-2 w-full bg-[#181C18] p-0.5 rounded-sm border border-[#1F261F]/30">
                        {Array.from({ length: 10 }).map((_, i) => {
                            const isFilled = i < Math.min(10, Math.floor(((user?.auraPoints ?? 0) / nextThreshold) * 10));
                            return (
                                <div
                                    key={i}
                                    className={`h-full flex-grow rounded-xs transition-all duration-300 ${
                                        isFilled
                                            ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]'
                                            : 'bg-transparent'
                                    }`}
                                />
                            );
                        })}
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-[#4A5D4A] mt-1.5">
                        <span>{user?.auraPoints ?? 0} AP</span>
                        <span>{nextThreshold} AP</span>
                    </div>
                </div>
            </HudPanel>

            {/* Navigation List */}
            <HudNav active="levels" />
        </aside>
    )
}

// 2. Path Selection Tabs Component
interface PathSelectionTabsProps {
    activePath: 'Beginner' | 'Intermediate' | 'Expert';
    onSelect: (path: 'Beginner' | 'Intermediate' | 'Expert') => void;
}

const PathSelectionTabs = ({ activePath, onSelect }: PathSelectionTabsProps) => {
    const paths: { key: 'Beginner' | 'Intermediate' | 'Expert'; track: typeof TRACKS.ALPHA; icon: typeof BookOpen; desc: string }[] = [
        { key: 'Beginner', track: TRACKS.ALPHA, icon: BookOpen, desc: "Sequential C fundamentals, variables, switch controls, and loop protocols." },
        { key: 'Intermediate', track: TRACKS.BETA, icon: Play, desc: "Pointers, dynamic structs, file streams, and recursive memory operations." },
        { key: 'Expert', track: TRACKS.GAMMA, icon: Zap, desc: "Assembly compilation, bare-metal bootloaders, multithread locks, and overflows." },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paths.map(({ key, track, icon: Icon, desc }) => {
                const isActive = activePath === key
                const activeCls = isActive
                    ? `${track.border} shadow-[0_0_20px_rgba(16,185,129,0.08)] bg-[#181C18]/40`
                    : "border-[#1F261F] hover:bg-[#181C18]/40"

                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onSelect(key)}
                        className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden text-left ${activeCls}`}
                    >
                        <div className="flex justify-between items-start w-full">
                            <div className={`size-10 rounded-sm flex items-center justify-center border border-[#1F261F] ${isActive ? `${track.text} bg-[#161820]` : 'bg-[#07080A] text-[#8F9F8F]'}`}>
                                <Icon className="size-5" />
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                isActive ? 'bg-[#181C18] border-[#1F261F]' + track.text : 'bg-[#0D0E12] border-[#1F261F] text-[#8F9F8F]'
                            }`}>
                                {track.clearance}
                            </span>
                        </div>
                        <div className="mt-2 text-left">
                            <span className="text-[10px] font-mono text-[#4A5D4A] uppercase block">{track.name}</span>
                            <h3 className="text-sm font-bold text-[#E2E8F0] tracking-tight">{track.label} Curriculum</h3>
                            <p className="text-[12px] text-[#8F9F8F] mt-1 line-clamp-2">{desc}</p>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

// 3. Campaign Progress Bar Component
interface CampaignProgressBarProps {
    activePath: string
    pathCompletions: number
    totalPathLevels: number
    pathPercent: number
}

const CampaignProgressBar = ({ activePath, pathCompletions, totalPathLevels, pathPercent }: CampaignProgressBarProps) => {
    const track = activePath === 'Beginner' ? TRACKS.ALPHA : activePath === 'Intermediate' ? TRACKS.BETA : TRACKS.GAMMA

    return (
        <HudPanel radius="xl" className="p-5">
            <div className="flex justify-between items-end mb-4 relative z-10 font-mono">
                <div>
                    <span className="text-[11px] font-mono tracking-widest text-[#4A5D4A] uppercase block select-none">Operative Track Status</span>
                    <h3 className="text-base font-bold text-[#E2E8F0] mt-0.5">{track.label.toUpperCase()} TRACK DECRYPTION RATE</h3>
                </div>
                <span className={`text-sm font-bold ${track.text}`}>{pathPercent}%</span>
            </div>

            {/* Segmented Ticks (20 Ticks) */}
            <div className="flex gap-1.5 h-4 w-full relative z-10 bg-[#07080A]/80 p-1 rounded-md border border-[#1F261F]">
                {Array.from({ length: 20 }).map((_, i) => {
                    const isFilled = i < Math.round((pathPercent / 100) * 20);
                    return (
                        <div
                            key={i}
                            className={`h-full flex-1 rounded-sm transition-all duration-500 ease-out ${
                                isFilled
                                    ? `${track.bar} shadow-[0_0_10px_rgba(16,185,129,0.6)]`
                                    : 'bg-[#181C18]'
                            }`}
                        />
                    );
                })}
            </div>

            <div className="flex justify-between font-mono text-[10px] text-[#4A5D4A] mt-2 relative z-10 px-1 select-none">
                <span>PATH: {track.code}</span>
                <span>STATUS: {pathCompletions} OF {totalPathLevels} NODE CHANNELS RESTORED</span>
            </div>
        </HudPanel>
    )
}

// 4. Active Track Header Component
interface ActiveTrackHeaderProps {
    activePath: string
    pathPercent: number
    pathCompletions: number
    totalPathLevels: number
}

const ActiveTrackHeader = ({ activePath, pathPercent, pathCompletions, totalPathLevels }: ActiveTrackHeaderProps) => {
    const track = activePath === 'Beginner' ? TRACKS.ALPHA : activePath === 'Intermediate' ? TRACKS.BETA : TRACKS.GAMMA
    const desc = activePath === 'Beginner'
        ? "Sequential C fundamentals and logic structures. Complete real levels to advance through Sector Alpha."
        : activePath === 'Intermediate'
            ? "Solve complex memory allocations, structural files, recursion structures, and custom matrices in Sector Beta."
            : "Conquer advanced systems programming, security audits, and deep memory operations in Sector Gamma."

    return (
        <HudPanel radius="xl" className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-left font-mono">
                <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${track.text}`}>Active Operative Track</span>
                <h3 className="text-lg font-black text-[#E2E8F0] tracking-tight mt-1">{activePath} Path Curriculum</h3>
                <p className="text-[13px] text-[#8F9F8F] mt-1 leading-relaxed max-w-2xl font-sans">{desc}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto bg-[#181C18]/30 border border-[#1F261F] px-4 py-2 rounded-sm font-mono">
                <div className="text-left">
                    <span className="text-[10px] text-[#4A5D4A] block select-none">HUD_METRIC</span>
                    <span className="text-xs font-bold text-[#E2E8F0]">{pathCompletions} / {totalPathLevels} NODES</span>
                </div>
                <div className={`size-8 rounded-sm border border-[#1F261F] flex items-center justify-center font-mono font-bold text-xs ${track.text} bg-[#07080A] shadow-inner select-none`}>
                    {pathPercent}%
                </div>
            </div>
        </HudPanel>
    )
}

// 5. Level Item Component
interface LevelItemProps {
    lvl: LevelNode
    index: number
    status: MissionStatus
    isLocked: boolean
    realMissionId?: string
    onOpenModal: (lvl: LevelNode) => void
}

const LevelItem = ({ lvl, index, status, isLocked, realMissionId, onOpenModal }: LevelItemProps) => {
    const isCompleted = status === "COMPLETED"
    const isCurrentlyUnlocked = status === "ACTIVE"
    const track = TRACKS[lvl.track]

    const cardContent = (
        <>
            <div className="flex items-start sm:items-center gap-4 text-left flex-1 min-w-0 font-mono">
                {/* Status Icon */}
                <div className={`size-10 rounded-sm flex items-center justify-center border shrink-0 transition-all duration-300 ${
                    isCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : isCurrentlyUnlocked
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40"
                        : "bg-[#181C18]/50 text-[#4A5D4A] border-transparent"
                }`}>
                    {isCompleted ? (
                        <CheckCircle className="size-5" />
                    ) : isLocked ? (
                        <Lock className="size-4" />
                    ) : (
                        <Play className={`size-4 fill-current ${track.text}`} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-mono font-bold text-[#4A5D4A]">
                            #{String(index + 1).padStart(2, '0')}
                        </span>
                        <h4 className={`font-mono text-sm font-bold truncate ${isCompleted ? "text-[#8F9F8F] line-through decoration-[#1F261F]" : "text-[#E2E8F0] group-hover:text-emerald-400 transition-colors"}`}>
                            {lvl.title}
                        </h4>
                        <span className={`text-[9px] font-mono uppercase bg-[#161820] border border-[#1F261F] px-1.5 py-0.25 rounded font-bold ${track.text}`}>
                            {lvl.difficulty}
                        </span>
                    </div>
                    <p className="text-[12px] text-[#8F9F8F] mt-1 max-w-[580px] leading-normal line-clamp-1">
                        {lvl.description}
                    </p>
                </div>
            </div>

            {/* Action Button / Payload */}
            <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-[#1F261F]/30 sm:border-0 pt-3 sm:pt-0 shrink-0 font-mono">
                <span className="text-[11px] font-mono text-[#4A5D4A] select-none">
                    PAYLOAD: <strong className={track.text}>+{lvl.auraReward} AP</strong>
                </span>

                {isCompleted ? (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-emerald-400 font-bold select-none">RESOLVED</span>
                        {realMissionId && (
                            <Link
                                href={`/mission/${realMissionId}`}
                                className="bg-[#181C18] hover:bg-[#202520] text-[#E2E8F0] text-xs font-semibold px-4 py-2 rounded-sm transition-all text-center whitespace-nowrap border border-[#1F261F] font-mono"
                                onClick={(e) => e.stopPropagation()}
                            >
                                &gt; REPLAY
                            </Link>
                        )}
                    </div>
                ) : isCurrentlyUnlocked ? (
                    realMissionId ? (
                        <Link
                            href={`/mission/${realMissionId}`}
                            className="bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold px-4 py-2 rounded-sm transition-all shadow-md shadow-emerald-500/15 text-center whitespace-nowrap font-mono"
                            onClick={(e) => e.stopPropagation()}
                        >
                            &gt; INFILTRATE
                        </Link>
                    ) : (
                        <span
                            className="bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 text-emerald-400 text-xs font-bold px-4 py-2 rounded-sm transition-all text-center whitespace-nowrap font-mono"
                        >
                            &gt; DECRYPT
                        </span>
                    )
                ) : (
                    <span className="text-xs text-[#4A5D4A] font-mono flex items-center gap-1.5 select-none">
                        <Lock className="size-3.5" /> RESTRICTED
                    </span>
                )}
            </div>
        </>
    )

    const cardClassName = `border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
        isCompleted
            ? "bg-[#0D0E12]/30 border-[#1F261F]/50 opacity-80"
            : isCurrentlyUnlocked
            ? "bg-[#0D0E12] border-[#1F261F] hover:border-emerald-500/30 hover:bg-[#181C18]/40 group"
            : "bg-[#07080A]/50 border-[#1F261F]/20 opacity-40"
    }`

    return (
        <button
            type="button"
            disabled={isLocked}
            onClick={() => {
                if (!isLocked && !isCompleted) {
                    onOpenModal(lvl)
                }
            }}
            className={`${cardClassName} text-left w-full cursor-pointer disabled:cursor-not-allowed`}
        >
            {cardContent}
        </button>
    )
}

// 6. Main LevelsClient Component
export function LevelsClient({
    user,
    dbMissions,
    userMissions,
    currentRank,
    nextThreshold
}: LevelsClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathParam = searchParams ? searchParams.get('path') : null

    // Compute activePath inline from URL param to avoid Derived value copied into state (no-derived-state)
    const activePath: 'Beginner' | 'Intermediate' | 'Expert' =
        (pathParam === 'Beginner' || pathParam === 'Intermediate' || pathParam === 'Expert')
            ? pathParam
            : 'Beginner'

    const handlePathSelect = (path: 'Beginner' | 'Intermediate' | 'Expert') => {
        const params = new URLSearchParams(searchParams?.toString() ?? '')
        params.set('path', path)
        router.push(`/levels?${params.toString()}`)
    }

    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; level: LevelNode | null }>({
        isOpen: false,
        level: null
    })

    const userMissionsMap = new Map(userMissions.map((um) => [um.missionId, um]))

    // Get levels for the active path, injecting the dynamic realId from dbMissions
    const getLevelsList = (): LevelNode[] => {
        const baseCurriculum = activePath === 'Beginner'
            ? BEGINNER_CURRICULUM
            : activePath === 'Intermediate'
            ? INTERMEDIATE_CURRICULUM
            : EXPERT_CURRICULUM

        return baseCurriculum.map(lvl => {
            const dbMatch = dbMissions.find(m => m.order === lvl.order)
            if (dbMatch) {
                return { ...lvl, realId: dbMatch.id }
            }
            return lvl
        })
    }

    const currentLevels = getLevelsList()

    // Calculate completions for the current path
    const getPathCompletions = (path: 'Beginner' | 'Intermediate' | 'Expert') => {
        const curriculum = path === 'Beginner'
            ? BEGINNER_CURRICULUM
            : path === 'Intermediate'
            ? INTERMEDIATE_CURRICULUM
            : EXPERT_CURRICULUM

        let completed = 0
        curriculum.forEach((lvl) => {
            const dbMatch = dbMissions.find(m => m.order === lvl.order)
            if (dbMatch) {
                const um = userMissionsMap.get(dbMatch.id)
                if (um?.status === "COMPLETED") {
                    completed++
                }
            }
        })
        return completed
    }

    const pathCompletions = getPathCompletions(activePath)
    const totalPathLevels = currentLevels.length
    const pathPercent = Math.round((pathCompletions / totalPathLevels) * 100)

    // Solve the status for a level node using global-order sequential unlock,
    // mirroring the dashboard mission service: the lowest-order non-completed
    // mission is ACTIVE, everything before it is COMPLETED, everything after is LOCKED.
    const getLevelStatus = (lvl: LevelNode): {
        status: MissionStatus
        isLocked: boolean
        realMissionId?: string
    } => {
        if (!lvl.realId) {
            return { status: "LOCKED", isLocked: true }
        }

        const um = userMissionsMap.get(lvl.realId)
        const status = (um?.status || "LOCKED") as MissionStatus

        if (status === "COMPLETED") {
            return { status, isLocked: false, realMissionId: lvl.realId }
        }

        // Find the lowest global order across ALL real missions that is not completed.
        const allMissions = [...BEGINNER_CURRICULUM, ...INTERMEDIATE_CURRICULUM, ...EXPERT_CURRICULUM]
        const unresolved = allMissions
            .map(m => {
                const dbMatch = dbMissions.find(x => x.order === m.order)
                if (!dbMatch) return { order: m.order, completed: true }
                return { order: m.order, completed: userMissionsMap.get(dbMatch.id)?.status === "COMPLETED" }
            })
            .filter(x => !x.completed)
            .sort((a, b) => a.order - b.order)

        const nextActiveOrder = unresolved.length > 0 ? unresolved[0].order : Infinity

        if (lvl.order === nextActiveOrder) {
            return { status: "ACTIVE", isLocked: false, realMissionId: lvl.realId }
        }

        return { status: "LOCKED", isLocked: true, realMissionId: lvl.realId }
    }

    const rankStyles = getRankBadgeStyles(currentRank)

    return (
        <HudPage
            eyebrow="CURRICULUM_DECK // OPERATIVE_MODULES"
            title="Curriculum & Sectors"
            subtitle="Select a training path below. 60 missions across three clearance sectors — complete them in order to climb from rookie to Platypus."
        >
            <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left side: Dossier column */}
                    <div className="w-full lg:w-auto animate-terminal-flicker animation-delay-75">
                        <LeftSidebar
                            user={user}
                            currentRank={currentRank}
                            nextThreshold={nextThreshold}
                            rankStyles={rankStyles}
                        />
                    </div>

                    {/* Right side: Interactive layout grid */}
                    <main className="flex-grow min-w-0 flex flex-col gap-6">
                        {/* PATH SELECTION TABS */}
                        <div className="animate-terminal-flicker animation-delay-150">
                            <PathSelectionTabs
                                activePath={activePath}
                                onSelect={handlePathSelect}
                            />
                        </div>

                        {/* Track Progress Bar (Dynamic) */}
                        <div className="animate-terminal-flicker animation-delay-225">
                            <CampaignProgressBar
                                activePath={activePath}
                                pathCompletions={pathCompletions}
                                totalPathLevels={totalPathLevels}
                                pathPercent={pathPercent}
                            />
                        </div>

                        {/* PATH LEVEL DESCRIPTION HEADER */}
                        <div className="animate-terminal-flicker animation-delay-225">
                            <ActiveTrackHeader
                                activePath={activePath}
                                pathPercent={pathPercent}
                                pathCompletions={pathCompletions}
                                totalPathLevels={totalPathLevels}
                            />
                        </div>

                        {/* THE LEVELS GRID / LIST */}
                        <div className="flex flex-col gap-3 animate-terminal-flicker animation-delay-300">
                            {currentLevels.map((lvl, index) => {
                                const { status, isLocked, realMissionId } = getLevelStatus(lvl)
                                return (
                                    <LevelItem
                                        key={lvl.id}
                                        lvl={lvl}
                                        index={index}
                                        status={status}
                                        isLocked={isLocked}
                                        realMissionId={realMissionId}
                                        onOpenModal={(level) => setInfoModal({ isOpen: true, level })}
                                    />
                                )
                            })}
                        </div>
                    </main>
            </div>

            {/* INFO MODAL */}
            {infoModal.isOpen && infoModal.level && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-md bg-[#0D0E12] border border-[#1F261F] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transform animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                                    <Target className="size-6 text-emerald-400" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setInfoModal({ isOpen: false, level: null })}
                                    className="p-1.5 rounded-sm bg-[#181C18] text-[#8F9F8F] hover:text-emerald-400 transition-colors cursor-pointer border-none"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                                    Mission Node #{infoModal.level.order}
                                </span>
                                <h3 className="text-lg font-black text-[#E2E8F0] tracking-tight">
                                    {infoModal.level.title}
                                </h3>
                                <p className="text-[13px] text-[#8F9F8F] leading-relaxed">
                                    {infoModal.level.description}
                                </p>
                            </div>

                            <div className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-[#8F9F8F]">Sector</span>
                                    <span className="text-emerald-400 font-bold uppercase">{infoModal.level.track}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-[#8F9F8F]">Difficulty</span>
                                    <span className="text-emerald-400 font-bold uppercase">{infoModal.level.difficulty}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-[#8F9F8F]">Aura Reward Payload</span>
                                    <span className="text-emerald-400 font-bold font-mono">+{infoModal.level.auraReward} AP</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#07080A] px-6 py-4 flex justify-end gap-3 border-t border-[#1F261F]">
                            <button
                                type="button"
                                onClick={() => setInfoModal({ isOpen: false, level: null })}
                                className="w-full px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold font-mono transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer border-none"
                            >
                                Understood, Agent
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </HudPage>
    )
}
