"use client"

import React, { useState, useEffect } from "react"
import { BookOpen, Play, Zap, CheckCircle, Lock, Shield, Medal, Flame, Sparkles, X, ChevronRight, History } from "lucide-react"
import type { MissionStatus } from "@/types"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"

interface LevelNode {
    id: string
    order: number
    title: string
    description: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    auraReward: number
    isReal: boolean
    realId?: string
}

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

// Complete 20-level curriculum structure for Beginner — ALL real missions + simulation nodes
const BEGINNER_CURRICULUM: LevelNode[] = [
    {
        id: "beg-1",
        order: 1,
        title: "The System Access",
        description: "Infiltrate target servers by mastering C printf syntax and standard formatted system outputs.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: true
    },
    {
        id: "beg-2",
        order: 2,
        title: "Variable Infiltration",
        description: "Capture and declare local variables (int, float, char) and read terminal inputs using scanf.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: true
    },
    {
        id: "beg-3",
        order: 3,
        title: "Control Flow Lockdown",
        description: "Override complex decision pathways using composite nested conditional controls and relational branches.",
        difficulty: "EASY",
        auraReward: 214,
        isReal: true
    },
    {
        id: "beg-4",
        order: 4,
        title: "Loop Protocol",
        description: "Decrypt transmission packages continuously using iterative for, while, and do-while loop constructs.",
        difficulty: "EASY",
        auraReward: 258,
        isReal: true
    },
    {
        id: "beg-5",
        order: 5,
        title: "Function Assembly",
        description: "Verify modular sub-systems and inject operational code parameters using reusable C functions.",
        difficulty: "EASY",
        auraReward: 300,
        isReal: true
    },
    {
        id: "beg-6",
        order: 6,
        title: "Data Cryptography",
        description: "Perform terminal computations by executing operations using standard arithmetic precedence rules.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-7",
        order: 7,
        title: "Operative Decisions",
        description: "Construct structural pathways using standard conditional decision blocks (if, else if, else).",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-8",
        order: 8,
        title: "Secure Logic Gates",
        description: "Evaluate complex conditions by chaining binary logical parameters using &&, ||, and ! operators.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-9",
        order: 9,
        title: "Switching Frequencies",
        description: "Optimize conditional flow structures with multiple routing paths using switch-case statements.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-10",
        order: 10,
        title: "Iterative Extraction",
        description: "Infiltrate and extract data logs continuously using basic pre-test while loops.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-11",
        order: 11,
        title: "Loop Encryption",
        description: "Develop counter-controlled iteration routines using optimized C for-loop parameters.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-12",
        order: 12,
        title: "Breakout Protocols",
        description: "Exert absolute authority over looping execution using structured break and continue signals.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-13",
        order: 13,
        title: "Nested Surveillance",
        description: "Process complex multi-dimensional data grids by executing loop operations inside loop frames.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-14",
        order: 14,
        title: "Agent Signature",
        description: "Encapsulate executable actions into isolated, modular parameters using void functions.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-15",
        order: 15,
        title: "Data Return Payload",
        description: "Develop standalone functional subroutines that process inputs and yield exact return parameters.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-16",
        order: 16,
        title: "Scope & Lifetime",
        description: "Manage system memory scope and stack boundaries by regulating local vs global variable definitions.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-17",
        order: 17,
        title: "Array Grid Infiltration",
        description: "Store, access, and parse linear data streams sequentially using C single-dimensional arrays.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-18",
        order: 18,
        title: "Operative Strings",
        description: "Store and process null-terminated character buffers (\\0) using fundamental string properties.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-19",
        order: 19,
        title: "Pointer Intel Retrieval",
        description: "Read exact heap addresses directly using pointers, reference (&), and dereference (*) operators.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-20",
        order: 20,
        title: "Secure Memory Allocator",
        description: "Provision dynamic memory structures on the database heap securely using malloc and free calls.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    }
]

// Complete 10-level structure for Intermediate (MEDIUM)
const INTERMEDIATE_CURRICULUM: LevelNode[] = [
    {
        id: "int-1",
        order: 1,
        title: "Advanced Control Logic",
        description: "Analyze complex firewalls using composite nested decision controls and relational branches.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-2",
        order: 2,
        title: "Loop Optimization Protocol",
        description: "Process transmission packages continuously using optimized iterative loop constructs.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-3",
        order: 3,
        title: "Pointer Arithmetic",
        description: "Shift through byte indices directly by applying arithmetic parameters to active memory pointers.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-4",
        order: 4,
        title: "Struct Blueprinting",
        description: "Model composite operative files and complex system entities using C structures (struct).",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-5",
        order: 5,
        title: "File Pointer Extraction",
        description: "Open, stream, append, and lock external system database logs using standard C FILE operators.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-6",
        order: 6,
        title: "Dynamic Grid Buffer",
        description: "Create elastic, expandable run-time arrays dynamically using dynamic realloc parameters.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-7",
        order: 7,
        title: "Recursive Signal Decryptor",
        description: "Decrypt deeply nested transmissions by invoking functions recursively with strict base cases.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-8",
        order: 8,
        title: "Memory Infiltration",
        description: "Audit buffer bounds and intercept corrupted heap variables before memory leakage triggers.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-9",
        order: 9,
        title: "Binary Tree Map",
        description: "Design sorted database structures in the heap using custom linked pointer binary trees.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-10",
        order: 10,
        title: "Bitwise Masking Protocol",
        description: "Secure terminal switches and toggles by executing bitwise AND, OR, and XOR masks.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    }
]

// Complete 10-level structure for Expert (HARD)
const EXPERT_CURRICULUM: LevelNode[] = [
    {
        id: "exp-1",
        order: 1,
        title: "Deep Function Injection",
        description: "Verify modular sub-systems and inject operational compiler instructions directly.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-2",
        order: 2,
        title: "Buffer Overflow Audit",
        description: "Exploit, audit, and patch classic memory vulnerabilities inside unsecured system inputs.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-3",
        order: 3,
        title: "Custom Compiler Optimization",
        description: "Write assembly-compliant inline codes and optimize CPU register targeting configurations.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-4",
        order: 4,
        title: "Multithreaded Race Infiltration",
        description: "Synthesize parallel system threads using POSIX pthread locks and semaphores cleanly.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-5",
        order: 5,
        title: "Custom Garbage Collector",
        description: "Construct a custom reference-counting garbage collector to track heap block lifetimes.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-6",
        order: 6,
        title: "Socket Shell Hijack",
        description: "Establish encrypted low-level TCP/IP streams and execute secure network commands.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-7",
        order: 7,
        title: "Encrypted File Vault",
        description: "Implement custom AES-like block-cipher algorithms on binary data streams directly.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-8",
        order: 8,
        title: "Kernel Hooking Module",
        description: "Simulate low-level system call interception using custom function pointer vectors.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-9",
        order: 9,
        title: "Bare-Metal Operative Bootloader",
        description: "Configure system bios configurations, interrupts, and entry sequences in assembly.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-10",
        order: 10,
        title: "Quantum Key Decryption",
        description: "Execute mathematical simulations to cryptanalytically crack randomized master keys.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    }
]

export function LevelsClient({ 
    user, 
    dbMissions, 
    userMissions, 
    currentRank, 
    nextThreshold 
}: LevelsClientProps) {
    const searchParams = useSearchParams()
    const pathParam = searchParams ? searchParams.get('path') : null

    const [activePath, setActivePath] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Beginner')

    useEffect(() => {
        if (pathParam === 'Beginner' || pathParam === 'Intermediate' || pathParam === 'Expert') {
            setActivePath(pathParam)
        }
    }, [pathParam])

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

    // Calculate total campaign stats
    const totalRealMissions = dbMissions.length
    const totalCompletedReal = userMissions.filter(um => um.status === "COMPLETED").length
    const overallPercent = totalRealMissions > 0 ? Math.round((totalCompletedReal / totalRealMissions) * 100) : 0

    // Solve the status for a level node
    // Uses canonical DB vocabulary: LOCKED | ACTIVE | COMPLETED
    // Plus UI-only state: SIMULATION (for non-real levels)
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
        // In Beginner path: require Function Assembly (beg-5) to be complete
        const funcAssMission = dbMissions.find(m => m.order === 5)
        const funcAssUm = funcAssMission ? userMissionsMap.get(funcAssMission.id) : undefined
        const isFuncComplete = funcAssUm?.status === "COMPLETED"

        if (lvl.difficulty === "EASY") {
            if (isFuncComplete) {
                return { status: "SIMULATION", isLocked: false }
            }
            return { status: "LOCKED", isLocked: true }
        }

        // For Intermediate path mock levels: require all Beginner real levels to be complete (Function Assembly)
        if (lvl.difficulty === "MEDIUM") {
            if (isFuncComplete) {
                return { status: "SIMULATION", isLocked: false }
            }
            return { status: "LOCKED", isLocked: true }
        }

        // For Expert path mock levels: require all Beginner real levels to be complete (Function Assembly)
        if (isFuncComplete) {
            return { status: "SIMULATION", isLocked: false }
        }
        return { status: "LOCKED", isLocked: true }
    }

    const rankStyles = getRankBadgeStyles(currentRank)

    return (
        <div className="flex-grow bg-[#14141A] min-h-[calc(100vh-3.5rem)] relative">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
                
                {/* Left Sidebar */}
                <aside className="w-full md:w-[250px] shrink-0 flex flex-col gap-6">
                    {/* User Profile Block */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-5 flex flex-col items-center">
                        <div className="size-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white">
                            {(user?.name || "U")[0].toUpperCase()}
                        </div>
                        <h2 className="text-lg font-bold text-[#F1F1F5] truncate max-w-full">
                            {user?.name || "Anonymous Agent"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Medal className="size-4 text-[#ffb95f]" />
                            <span className={`text-xs font-semibold uppercase tracking-wider ${rankStyles.colorText}`}>
                                {currentRank}
                            </span>
                        </div>
                        <div className="w-full mt-5">
                            <div className="flex justify-between text-[11px] text-[#8B8BA7] mb-1.5 font-medium">
                                <span>Aura Progress</span>
                                <span>{user?.auraPoints ?? 0} / {nextThreshold} AP</span>
                            </div>
                            <div className="h-2 w-full bg-[#2A2A35] rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 rounded-full relative transition-all duration-500"
                                    style={{ width: `${Math.min(100, ((user?.auraPoints ?? 0) / nextThreshold) * 100)}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 blur-[2px]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation List */}
                    <nav className="flex flex-col gap-1 bg-[#1C1C24] border border-[#323242] rounded-xl p-3">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-[#908fa0] hover:bg-[#2A2A35]/50 hover:text-[#e4e1e9] rounded-lg font-medium text-sm transition-colors">
                            <Play className="size-4 rotate-90 text-[#8B8BA7]" />
                            Dashboard
                        </Link>
                        <Link href="/levels" className="flex items-center gap-3 px-3 py-2.5 bg-[#2A2A35] text-[#F1F1F5] rounded-lg font-medium text-sm transition-colors">
                            <BookOpen className="size-4 text-indigo-400" />
                            Curriculum
                        </Link>
                        <Link href="/history" className="flex items-center gap-3 px-3 py-2.5 text-[#908fa0] hover:bg-[#2A2A35]/50 hover:text-[#e4e1e9] rounded-lg font-medium text-sm transition-colors">
                            <History className="size-4 text-[#8B8BA7]" />
                            History
                        </Link>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-grow min-w-0 flex flex-col gap-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-semibold text-[#F1F1F5] tracking-tight">Curriculum & Paths</h1>
                        <p className="mt-1 text-xs text-[#8B8BA7]">
                            Select a training path below. Begin with fundamental C concepts and compile progressively to access simulation frameworks.
                        </p>
                    </div>

                    {/* Track Progress Bar (Dynamic) */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-5">
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="text-sm font-bold text-[#e4e1e9] uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="size-4 text-indigo-400" />
                                {activePath} Campaign Progress
                            </h3>
                            <span className="text-xs text-[#908fa0] font-mono">{pathCompletions} of {totalPathLevels} levels completed · {pathPercent}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#2A2A35] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 rounded-full relative transition-all duration-500 ease-out"
                                style={{ width: `${pathPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>

                    {/* PATH SELECTION TABS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Beginner Card Tab */}
                        <div 
                            onClick={() => setActivePath('Beginner')}
                            className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden ${
                                activePath === 'Beginner' 
                                    ? "bg-indigo-950/15 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                    : "bg-[#1C1C24] border-[#323242] hover:bg-[#20202a] hover:border-[#424258]"
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className={`size-10 rounded-lg flex items-center justify-center ${activePath === 'Beginner' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[#14141A] text-[#8B8BA7]'}`}>
                                    <BookOpen className="size-5" />
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    activePath === 'Beginner' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#2A2A35] text-[#8B8BA7]'
                                }`}>
                                    20 Levels
                                </span>
                            </div>
                            <div>
                                <h3 className="text-md font-bold text-[#e4e1e9]">Beginner</h3>
                                <p className="text-[11px] text-[#8B8BA7] mt-1 line-clamp-2">
                                    Sequential C fundamentals, variables, switch controls, and loop protocols.
                                </p>
                            </div>
                        </div>

                        {/* 2. Intermediate Card Tab */}
                        <div 
                            onClick={() => setActivePath('Intermediate')}
                            className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden ${
                                activePath === 'Intermediate' 
                                    ? "bg-emerald-950/15 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                    : "bg-[#1C1C24] border-[#323242] hover:bg-[#20202a] hover:border-[#424258]"
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className={`size-10 rounded-lg flex items-center justify-center ${activePath === 'Intermediate' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#14141A] text-[#8B8BA7]'}`}>
                                    <Play className="size-5 fill-current text-emerald-400" />
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    activePath === 'Intermediate' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#2A2A35] text-[#8B8BA7]'
                                }`}>
                                    10 Levels
                                </span>
                            </div>
                            <div>
                                <h3 className="text-md font-bold text-[#e4e1e9]">Intermediate</h3>
                                <p className="text-[11px] text-[#8B8BA7] mt-1 line-clamp-2">
                                    Pointers, dynamic structs, file streams, and recursive memory operations.
                                </p>
                            </div>
                        </div>

                        {/* 3. Expert Card Tab */}
                        <div 
                            onClick={() => setActivePath('Expert')}
                            className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden ${
                                activePath === 'Expert' 
                                    ? "bg-amber-950/15 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                    : "bg-[#1C1C24] border-[#323242] hover:bg-[#20202a] hover:border-[#424258]"
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className={`size-10 rounded-lg flex items-center justify-center ${activePath === 'Expert' ? 'bg-amber-500/20 text-amber-400' : 'bg-[#14141A] text-[#8B8BA7]'}`}>
                                    <Zap className="size-5 fill-current text-amber-400" />
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    activePath === 'Expert' ? 'bg-amber-500/20 text-amber-300' : 'bg-[#2A2A35] text-[#8B8BA7]'
                                }`}>
                                    10 Levels
                                </span>
                            </div>
                            <div>
                                <h3 className="text-md font-bold text-[#e4e1e9]">Expert</h3>
                                <p className="text-[11px] text-[#8B8BA7] mt-1 line-clamp-2">
                                    Assembly compilation, bare-metal bootloaders, multithread locks, and overflows.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* PATH LEVEL DESCRIPTION HEADER */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Active Operative Track</span>
                            <h3 className="text-lg font-black text-[#e4e1e9] tracking-tight mt-1">{activePath} Path Curriculum</h3>
                            <p className="text-xs text-[#8B8BA7] mt-1">
                                {activePath === 'Beginner' 
                                    ? "Sequential C fundamentals and logic structures. Complete real levels to unlock advanced simulation nodes." 
                                    : activePath === 'Intermediate' 
                                    ? "Solve complex memory allocations, structural files, recursion structures, and custom matrices."
                                    : "Conquer advanced bare-metal compilation, security audits, thread management, and blocks."}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-[#908fa0] font-mono font-bold">{pathPercent}% Done</span>
                            <div className="size-12 rounded-full border-2 border-[#323242] flex items-center justify-center font-mono font-black text-xs text-[#F1F1F5] relative bg-[#14141A]">
                                {pathCompletions} / {totalPathLevels}
                            </div>
                        </div>
                    </div>

                    {/* THE LEVELS GRID / LIST */}
                    <div className="flex flex-col gap-3">
                        {currentLevels.map((lvl, index) => {
                            const { status, isLocked, realMissionId } = getLevelStatus(lvl)

                            const isCompleted = status === "COMPLETED"
                            const isCurrentlyUnlocked = status === "ACTIVE" || status === "SIMULATION"

                            return (
                                <div 
                                    key={lvl.id}
                                    className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
                                        isCompleted 
                                            ? "bg-[#1C1C24]/30 border-[#323242]/50 opacity-80"
                                            : isCurrentlyUnlocked
                                            ? "bg-[#1C1C24] border-indigo-500/30 hover:border-indigo-500/50 hover:bg-[#20202a] cursor-pointer group"
                                            : "bg-[#14141A]/50 border-[#323242]/20 opacity-40 cursor-not-allowed"
                                    }`}
                                    onClick={() => {
                                        if (isLocked) return
                                        if (!lvl.isReal) {
                                            setInfoModal({ isOpen: true, level: lvl })
                                        }
                                    }}
                                >
                                    <div className="flex items-start sm:items-center gap-4">
                                        {/* Status Icon */}
                                        <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                                            isCompleted 
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : isCurrentlyUnlocked
                                                ? "bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform"
                                                : "bg-[#2A2A35] text-[#5C5C7A]"
                                        }`}>
                                            {isCompleted ? (
                                                <CheckCircle className="size-5" />
                                            ) : isLocked ? (
                                                <Lock className="size-5" />
                                            ) : lvl.isReal ? (
                                                <Play className="size-5 fill-current text-indigo-400" />
                                            ) : (
                                                <Sparkles className="size-5 text-indigo-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold text-[#8B8BA7]">
                                                    #{String(index + 1).padStart(2, '0')}
                                                </span>
                                                <h4 className={`font-bold text-sm ${isCompleted ? "text-[#908fa0] line-through decoration-[#323242]" : "text-[#e4e1e9] group-hover:text-indigo-400 transition-colors"}`}>
                                                    {lvl.title}
                                                </h4>
                                                {!lvl.isReal && (
                                                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.25 rounded-md font-bold">
                                                        Simulation
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-[#8B8BA7] mt-1 max-w-[580px] leading-normal line-clamp-2 sm:line-clamp-1">
                                                {lvl.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button / Payload */}
                                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-[#323242]/30 sm:border-0 pt-3 sm:pt-0">
                                        <span className="text-[10px] font-mono text-[#5C5C7A]">Reward: <strong className="text-[#8B8BA7]">{lvl.auraReward} AP</strong></span>
                                        
                                        {isCompleted ? (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-[#4ae176] font-bold">+{lvl.auraReward} AP</span>
                                                {lvl.isReal && realMissionId && (
                                                    <Link 
                                                        href={`/mission/${realMissionId}`}
                                                        className="bg-[#2A2A35] hover:bg-[#323242] text-[#F1F1F5] text-xs font-semibold px-4 py-2 rounded-lg transition-all text-center whitespace-nowrap border border-[#323242]"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Replay Mission
                                                    </Link>
                                                )}
                                            </div>
                                        ) : isCurrentlyUnlocked ? (
                                            lvl.isReal && realMissionId ? (
                                                <Link 
                                                    href={`/mission/${realMissionId}`}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-500/15 text-center whitespace-nowrap"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Compile Mission
                                                </Link>
                                            ) : (
                                                <button 
                                                    type="button"
                                                    className="bg-indigo-950/40 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-lg transition-all text-center whitespace-nowrap"
                                                >
                                                    Decrypt Intel
                                                </button>
                                            )
                                        ) : (
                                            <span className="text-xs text-[#5C5C7A] font-mono flex items-center gap-1">
                                                <Lock className="size-3" /> Locked
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </main>
            </div>

            {/* SIMULATION PREVIEW INFO MODAL */}
            {infoModal.isOpen && infoModal.level && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="w-full max-w-md bg-[#1C1C24] border border-[#323242] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transform animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="size-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                                    <Sparkles className="size-6 text-indigo-400" />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setInfoModal({ isOpen: false, level: null })}
                                    className="p-1.5 rounded-lg bg-[#2A2A35] text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
                                    Simulation Node #{infoModal.level.order}
                                </span>
                                <h3 className="text-lg font-black text-[#F1F1F5] tracking-tight">
                                    {infoModal.level.title}
                                </h3>
                                <p className="text-xs text-[#8B8BA7] leading-relaxed">
                                    {infoModal.level.description}
                                </p>
                            </div>

                            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#8B8BA7]">Simulated Scope</span>
                                    <span className="text-indigo-400 font-bold uppercase font-mono">{infoModal.level.difficulty} Difficulty</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#8B8BA7]">Aura Reward Payload</span>
                                    <span className="text-emerald-400 font-bold font-mono">+{infoModal.level.auraReward} AP</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#14141A] px-6 py-4 flex justify-end gap-3 border-t border-[#323242]">
                            <button
                                type="button"
                                onClick={() => setInfoModal({ isOpen: false, level: null })}
                                className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                            >
                                Understood, Agent
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
