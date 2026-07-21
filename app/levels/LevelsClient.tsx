"use client"

import React, { useState } from "react"
import { BookOpen, Play, Zap, CheckCircle, Lock, Shield, Medal, Flame, Sparkles, X, History, LayoutDashboard } from "lucide-react"
import type { MissionStatus } from "@/types"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { getRankBadgeStyles } from "@/lib/aura"
import { LevelNode, BEGINNER_CURRICULUM, INTERMEDIATE_CURRICULUM, EXPERT_CURRICULUM } from "./curriculum"

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
            <div className="bg-[#0D0E12] border border-[#1F261F] rounded-lg p-5 flex flex-col items-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#00ff4108,transparent_70%)] pointer-events-none"></div>
                
                {/* Barcode/Serial Details */}
                <div className="w-full flex justify-between items-center mb-4 border-b border-[#1F261F] pb-2 font-mono text-[9px] text-[#4A5D4A]">
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
                    <span className="text-[9px] font-mono tracking-widest text-[#4A5D4A] uppercase block">AGENT CODENAME</span>
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
                    <div className="flex justify-between text-[10px] font-mono text-[#8F9F8F] mb-1.5">
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
                    
                    <div className="flex justify-between text-[8px] font-mono text-[#4A5D4A] mt-1.5">
                        <span>{user?.auraPoints ?? 0} AP</span>
                        <span>{nextThreshold} AP</span>
                    </div>
                </div>
            </div>

            {/* Navigation List */}
            <nav className="flex flex-col gap-1 bg-[#0D0E12] border border-[#1F261F] rounded-lg p-2.5 relative">
                <div className="text-[10px] font-mono tracking-widest text-[#4A5D4A] uppercase px-2 mb-1.5 select-none">Console Channels</div>
                
                <Link href="/dashboard" className="flex items-center justify-between px-2.5 py-2 text-[#8F9F8F] hover:bg-[#181C18]/40 hover:text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 group border border-transparent hover:border-[#1F261F]">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="size-3.5 text-[#8F9F8F] group-hover:text-emerald-400 transition-colors" />
                        <span className="font-mono text-[10px]">HUD_01_CONTROL</span>
                    </div>
                    <span className="text-[8px] font-mono text-[#4A5D4A]">LOGS</span>
                </Link>
                
                <Link href="/levels" className="flex items-center justify-between px-2.5 py-2 bg-[#181C18] text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 border border-[#1F261F] hover:border-emerald-500/30">
                    <div className="flex items-center gap-2">
                        <BookOpen className="size-3.5 text-emerald-400" />
                        <span className="font-mono text-[10px]">HUD_02_SECTORS</span>
                    </div>
                    <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.25 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">LIVE</span>
                </Link>
                
                <Link href="/history" className="flex items-center justify-between px-2.5 py-2 text-[#8F9F8F] hover:bg-[#181C18]/40 hover:text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 group border border-transparent hover:border-[#1F261F]">
                    <div className="flex items-center gap-2">
                        <History className="size-3.5 text-[#8F9F8F] group-hover:text-emerald-400 transition-colors" />
                        <span className="font-mono text-[10px]">HUD_03_CHRONO</span>
                    </div>
                    <span className="text-[8px] font-mono text-[#4A5D4A]">LOGS</span>
                </Link>
            </nav>
        </aside>
    )
}

// 2. Path Selection Tabs Component
interface PathSelectionTabsProps {
    activePath: 'Beginner' | 'Intermediate' | 'Expert';
    onSelect: (path: 'Beginner' | 'Intermediate' | 'Expert') => void;
}

const PathSelectionTabs = ({ activePath, onSelect }: PathSelectionTabsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Beginner Card Tab */}
            <button 
                type="button"
                onClick={() => onSelect('Beginner')}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden text-left ${
                    activePath === 'Beginner' 
                        ? "bg-[#181C18]/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        : "bg-[#0D0E12] border-[#1F261F] hover:bg-[#181C18]/40 hover:border-emerald-500/30"
                }`}
            >
                <div className="flex justify-between items-start w-full">
                    <div className={`size-10 rounded-sm flex items-center justify-center border border-[#1F261F] ${activePath === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-inner' : 'bg-[#07080A] text-[#8F9F8F]'}`}>
                        <BookOpen className="size-5" />
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                        activePath === 'Beginner' ? 'bg-[#181C18] border-emerald-500/30 text-emerald-300' : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400'
                     }`}>
                        LEVEL 1 // UNRESTRICTED
                    </span>
                </div>
                <div className="mt-2 text-left">
                    <span className="text-[9px] font-mono text-[#4A5D4A] uppercase block">Sector Alpha</span>
                    <h3 className="text-sm font-bold text-[#E2E8F0] tracking-tight">Beginner Curriculum</h3>
                    <p className="text-[11px] text-[#8F9F8F] mt-1 line-clamp-2">
                        Sequential C fundamentals, variables, switch controls, and loop protocols.
                    </p>
                </div>
            </button>

            {/* 2. Intermediate Card Tab */}
            <button 
                type="button"
                onClick={() => onSelect('Intermediate')}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden text-left ${
                    activePath === 'Intermediate' 
                        ? "bg-[#181C18]/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        : "bg-[#0D0E12] border-[#1F261F] hover:bg-[#181C18]/40 hover:border-emerald-500/30"
                }`}
            >
                <div className="flex justify-between items-start w-full">
                    <div className={`size-10 rounded-sm flex items-center justify-center border border-[#1F261F] ${activePath === 'Intermediate' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-inner' : 'bg-[#07080A] text-[#8F9F8F]'}`}>
                        <Play className="size-5 fill-current text-emerald-400" />
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                        activePath === 'Intermediate' ? 'bg-[#181C18] border-emerald-500/30 text-emerald-300' : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                        LEVEL 2 // RESTRICTED
                    </span>
                </div>
                <div className="mt-2 text-left">
                    <span className="text-[9px] font-mono text-[#4A5D4A] uppercase block">Sector Beta</span>
                    <h3 className="text-sm font-bold text-[#E2E8F0] tracking-tight">Intermediate Curriculum</h3>
                    <p className="text-[11px] text-[#8F9F8F] mt-1 line-clamp-2">
                        Pointers, dynamic structs, file streams, and recursive memory operations.
                    </p>
                </div>
            </button>

            {/* 3. Expert Card Tab */}
            <button 
                type="button"
                onClick={() => onSelect('Expert')}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden text-left ${
                    activePath === 'Expert' 
                        ? "bg-[#181C18]/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        : "bg-[#0D0E12] border-[#1F261F] hover:bg-[#181C18]/40 hover:border-emerald-500/30"
                }`}
            >
                <div className="flex justify-between items-start w-full">
                    <div className={`size-10 rounded-sm flex items-center justify-center border border-[#1F261F] ${activePath === 'Expert' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-inner' : 'bg-[#07080A] text-[#8F9F8F]'}`}>
                        <Zap className="size-5 fill-current text-emerald-400" />
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                        activePath === 'Expert' ? 'bg-[#181C18] border-emerald-500/30 text-emerald-300' : 'bg-amber-950/10 border-amber-500/20 text-amber-500'
                    }`}>
                        LEVEL 3 // CLASSIFIED
                    </span>
                </div>
                <div className="mt-2 text-left">
                    <span className="text-[9px] font-mono text-[#4A5D4A] uppercase block">Sector Gamma</span>
                    <h3 className="text-sm font-bold text-[#E2E8F0] tracking-tight">Expert Curriculum</h3>
                    <p className="text-[11px] text-[#8F9F8F] mt-1 line-clamp-2">
                        Assembly compilation, bare-metal bootloaders, multithread locks, and overflows.
                    </p>
                </div>
            </button>
        </div>
    )
}

// 3. Info Modal Component
interface InfoModalProps {
    isOpen: boolean;
    level: LevelNode | null;
    onClose: () => void;
}

const InfoModal = ({ isOpen, level, onClose }: InfoModalProps) => {
    if (!isOpen || !level) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-md bg-[#0D0E12] border border-[#1F261F] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transform animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                            <Sparkles className="size-6 text-emerald-400" />
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="p-1.5 rounded-sm bg-[#181C18] text-[#8F9F8F] hover:text-emerald-400 transition-colors cursor-pointer border-none"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                            Simulation Node #{level.order}
                        </span>
                        <h3 className="text-lg font-black text-[#E2E8F0] tracking-tight">
                            {level.title}
                        </h3>
                        <p className="text-xs text-[#8F9F8F] leading-relaxed">
                            {level.description}
                        </p>
                    </div>

                    <div className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#8F9F8F]">Simulated Scope</span>
                            <span className="text-emerald-400 font-bold uppercase">{level.difficulty} Difficulty</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#8F9F8F]">Aura Reward Payload</span>
                            <span className="text-emerald-400 font-bold font-mono">+{level.auraReward} AP</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#07080A] px-6 py-4 flex justify-end gap-3 border-t border-[#1F261F]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold font-mono transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer border-none"
                    >
                        Understood, Agent
                    </button>
                </div>
            </div>
        </div>
    )
}

// 4. Campaign Progress Bar Component
interface CampaignProgressBarProps {
    activePath: string
    pathCompletions: number
    totalPathLevels: number
    pathPercent: number
}

const CampaignProgressBar = ({ activePath, pathCompletions, totalPathLevels, pathPercent }: CampaignProgressBarProps) => {
    return (
        <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#00ff4104,transparent_70%)] pointer-events-none"></div>
            <div className="flex justify-between items-end mb-4 relative z-10 font-mono">
                <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#4A5D4A] uppercase block select-none">Operative Track Status</span>
                    <h3 className="text-base font-bold text-[#E2E8F0] mt-0.5">{activePath.toUpperCase()} TRACK DECRYPTION RATE</h3>
                </div>
                <span className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">{pathPercent}%</span>
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
                                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' 
                                    : 'bg-[#181C18]'
                            }`}
                        />
                    );
                })}
            </div>

            <div className="flex justify-between font-mono text-[9px] text-[#4A5D4A] mt-2 relative z-10 px-1 select-none">
                <span>PATH: {activePath.toUpperCase()}_SECTOR</span>
                <span>STATUS: {pathCompletions} OF {totalPathLevels} NODE CHANNELS RESTORED</span>
            </div>
        </div>
    )
}

// 5. Active Track Header Component
interface ActiveTrackHeaderProps {
    activePath: string
    pathPercent: number
    pathCompletions: number
    totalPathLevels: number
}

const ActiveTrackHeader = ({ activePath, pathPercent, pathCompletions, totalPathLevels }: ActiveTrackHeaderProps) => {
    return (
        <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
            <div className="text-left font-mono">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest drop-shadow-[0_0_4px_rgba(16,185,129,0.2)]">Active Operative Track</span>
                <h3 className="text-lg font-black text-[#E2E8F0] tracking-tight mt-1">{activePath} Path Curriculum</h3>
                <p className="text-xs text-[#8F9F8F] mt-1 leading-relaxed max-w-2xl font-sans">
                    {activePath === 'Beginner' 
                        ? "Sequential C fundamentals and logic structures. Complete real levels to unlock advanced simulation nodes." 
                        : activePath === 'Intermediate' 
                        ? "Solve complex memory allocations, structural files, recursion structures, and custom matrices."
                        : "Conquer advanced bare-metal compilation, security audits, thread management, and blocks."}
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto bg-[#181C18]/30 border border-[#1F261F] px-4 py-2 rounded-sm font-mono">
                <div className="text-left">
                    <span className="text-[8px] text-[#4A5D4A] block select-none">HUD_METRIC</span>
                    <span className="text-xs font-bold text-[#E2E8F0]">{pathCompletions} / {totalPathLevels} NODES</span>
                </div>
                <div className="size-8 rounded-sm border border-[#1F261F] flex items-center justify-center font-mono font-bold text-xs text-emerald-400 bg-[#07080A] shadow-inner select-none drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">
                    {pathPercent}%
                </div>
            </div>
        </div>
    )
}

// 6. Level Item Component
interface LevelItemProps {
    lvl: LevelNode
    index: number
    status: MissionStatus | "SIMULATION"
    isLocked: boolean
    realMissionId?: string
    onOpenModal: (lvl: LevelNode) => void
}

const LevelItem = ({ lvl, index, status, isLocked, realMissionId, onOpenModal }: LevelItemProps) => {
    const isCompleted = status === "COMPLETED"
    const isCurrentlyUnlocked = status === "ACTIVE" || status === "SIMULATION"

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
                    ) : lvl.isReal ? (
                        <Play className="size-4 fill-current text-emerald-400" />
                    ) : (
                        <Sparkles className="size-4 text-emerald-400" />
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
                        {!lvl.isReal && (
                            <span className="text-[8px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-1.5 py-0.25 rounded font-bold">
                                Simulation
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-[#8F9F8F] mt-1 max-w-[580px] leading-normal line-clamp-1">
                        {lvl.description}
                    </p>
                </div>
            </div>

            {/* Action Button / Payload */}
            <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-[#1F261F]/30 sm:border-0 pt-3 sm:pt-0 shrink-0 font-mono">
                <span className="text-[10px] font-mono text-[#4A5D4A] select-none">
                    PAYLOAD: <strong className="text-emerald-400">+{lvl.auraReward} AP</strong>
                </span>
                
                {isCompleted ? (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-emerald-400 font-bold select-none">RESOLVED</span>
                        {lvl.isReal && realMissionId && (
                            <Link 
                                href={`/mission/${realMissionId}`}
                                className="bg-[#181C18] hover:bg-[#202520] text-[#E2E8F0] text-xs font-semibold px-4.5 py-2 rounded-sm transition-all text-center whitespace-nowrap border border-[#1F261F] font-mono"
                                onClick={(e) => e.stopPropagation()}
                            >
                                &gt; REPLAY
                            </Link>
                        )}
                    </div>
                ) : isCurrentlyUnlocked ? (
                    lvl.isReal && realMissionId ? (
                        <Link 
                            href={`/mission/${realMissionId}`}
                            className="bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold px-4.5 py-2 rounded-sm transition-all shadow-md shadow-emerald-500/15 text-center whitespace-nowrap font-mono"
                            onClick={(e) => e.stopPropagation()}
                        >
                            &gt; INFILTRATE
                        </Link>
                    ) : (
                        <span 
                            className="bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 text-emerald-400 text-xs font-bold px-4.5 py-2 rounded-sm transition-all text-center whitespace-nowrap font-mono"
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

    if (lvl.isReal) {
        return (
            <div className={cardClassName}>
                {cardContent}
            </div>
        )
    }

    return (
        <button
            type="button"
            disabled={isLocked}
            onClick={() => {
                if (!isLocked) {
                    onOpenModal(lvl)
                }
            }}
            className={`${cardClassName} text-left w-full cursor-pointer disabled:cursor-not-allowed`}
        >
            {cardContent}
        </button>
    )
}

// 7. Main LevelsClient Component
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
            if (lvl.isReal) {
                const dbMatch = dbMissions.find(m => m.order === lvl.order)
                if (dbMatch) {
                    return { ...lvl, realId: dbMatch.id }
                }
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
            if (lvl.isReal) {
                const dbMatch = dbMissions.find(m => m.order === lvl.order)
                if (dbMatch) {
                    const um = userMissionsMap.get(dbMatch.id)
                    if (um?.status === "COMPLETED") {
                        completed++
                    }
                }
            }
        })
        return completed
    }

    const pathCompletions = getPathCompletions(activePath)
    const totalPathLevels = currentLevels.length
    const pathPercent = Math.round((pathCompletions / totalPathLevels) * 100)

    // Solve the status for a level node
    const getLevelStatus = (lvl: LevelNode): {
        status: MissionStatus | "SIMULATION"
        isLocked: boolean
        realMissionId?: string
    } => {
        if (lvl.isReal && lvl.realId) {
            const um = userMissionsMap.get(lvl.realId)
            const status = (um?.status || "LOCKED") as MissionStatus
            
            // Sequential unlocking for real Beginner missions (1 to 5):
            if (lvl.difficulty === "EASY") {
                if (lvl.order === 1) {
                    if (status === "LOCKED") {
                        return { status: "ACTIVE", isLocked: false, realMissionId: lvl.realId }
                    }
                } else {
                    const precedingLvl = BEGINNER_CURRICULUM.find(b => b.order === lvl.order - 1)
                    if (precedingLvl) {
                        const dbMatch = dbMissions.find(m => m.order === precedingLvl.order)
                        if (dbMatch) {
                            const precedingUm = userMissionsMap.get(dbMatch.id)
                            if (precedingUm?.status === "COMPLETED" && status === "LOCKED") {
                                    return { status: "ACTIVE", isLocked: false, realMissionId: lvl.realId }
                            }
                        }
                    }
                }
            }

            return { 
                status, 
                isLocked: status === "LOCKED", 
                realMissionId: lvl.realId 
            }
        }

        // For mock simulation levels, we lock them if the preceding real levels in the campaign aren't complete
        const funcAssMission = dbMissions.find(m => m.order === 5)
        const funcAssUm = funcAssMission ? userMissionsMap.get(funcAssMission.id) : undefined
        const isFuncComplete = funcAssUm?.status === "COMPLETED"

        if (lvl.difficulty === "EASY") {
            if (isFuncComplete) {
                return { status: "SIMULATION", isLocked: false }
            }
            return { status: "LOCKED", isLocked: true }
        }

        if (lvl.difficulty === "MEDIUM") {
            if (isFuncComplete) {
                return { status: "SIMULATION", isLocked: false }
            }
            return { status: "LOCKED", isLocked: true }
        }

        if (isFuncComplete) {
            return { status: "SIMULATION", isLocked: false }
        }
        return { status: "LOCKED", isLocked: true }
    }

    const rankStyles = getRankBadgeStyles(currentRank)

    return (
        <div className="flex-grow bg-[#07080A] min-h-[calc(100vh-3.5rem)] relative text-[#E2E8F0] font-mono selection:bg-emerald-500/20 overflow-hidden">
            {/* Scanline Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff4104_1px,transparent_1px),linear-gradient(to_bottom,#00ff4104_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-[1]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none z-[1] opacity-40"></div>
            
            {/* CRT Scanline Sweep Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
                <div className="w-full h-24 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent absolute top-0 left-0 right-0 animate-scanline-sweep"></div>
            </div>

            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 relative z-10">
                
                {/* Header Tile */}
                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden group animate-terminal-flicker">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#00ff4104,transparent_70%)] pointer-events-none"></div>
                    <div className="text-left relative z-10">
                        <span className="text-[10px] font-mono tracking-widest text-[#4A5D4A] uppercase select-none">CURRICULUM_DECK // OPERATIVE_MODULES</span>
                        <h1 className="text-2xl font-bold font-sans text-emerald-400 tracking-tight mt-0.5 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">Curriculum & Sectors</h1>
                        <p className="text-xs text-[#8F9F8F] font-sans mt-0.5">
                            Select a training path below. Begin with fundamental C concepts and compile progressively to access simulation frameworks.
                        </p>
                    </div>
                </div>

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
            </div>

            {/* SIMULATION PREVIEW INFO MODAL */}
            <InfoModal
                isOpen={infoModal.isOpen}
                level={infoModal.level}
                onClose={() => setInfoModal({ isOpen: false, level: null })}
            />
        </div>
    )
}


