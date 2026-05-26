import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { calculateAgentRank } from "@/lib/aura"
import { BookOpen, Play, Zap, CheckCircle, Lock, Shield, Bolt, Rocket, History, Target, Flame, Medal } from "lucide-react"
import Link from "next/link"

function getNextRankThreshold(auraPoints: number): { nextRank: string, nextThreshold: number } {
    if (auraPoints < 50) return { nextRank: "Owl", nextThreshold: 50 }
    if (auraPoints < 150) return { nextRank: "Raccoon", nextThreshold: 150 }
    if (auraPoints < 300) return { nextRank: "Octopus", nextThreshold: 300 }
    if (auraPoints < 500) return { nextRank: "Eagle", nextThreshold: 500 }
    if (auraPoints < 800) return { nextRank: "Chameleon", nextThreshold: 800 }
    if (auraPoints < 1200) return { nextRank: "Wolf", nextThreshold: 1200 }
    if (auraPoints < 1700) return { nextRank: "Fox", nextThreshold: 1700 }
    if (auraPoints < 2500) return { nextRank: "Platypus", nextThreshold: 2500 }
    return { nextRank: "Max Rank", nextThreshold: 2500 }
}

export default async function LevelsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [missions, user, userMissions] = await Promise.all([
        safeDbQuery(
            () => db.mission.findMany({
                orderBy: { order: "asc" }
            }),
            [],
            "LevelsPage.missions"
        ),
        safeDbQuery(
            () => db.user.findUnique({
                where: { id: session.user.id },
                select: { auraPoints: true, auraLevel: true, name: true, email: true, comboStreak: true, foxBadges: true },
            }),
            null,
            "LevelsPage.user"
        ),
        safeDbQuery(
            () => db.userMission.findMany({
                where: { userId: session.user.id }
            }),
            [],
            "LevelsPage.userMissions"
        )
    ])

    const userMissionsMap = new Map(userMissions.map((um) => [um.missionId, um]))

    // Map difficulty classifications to categories
    const getLevelGroup = (difficulty: string) => {
        const d = difficulty.toUpperCase()
        if (d === "EASY") return "Beginner"
        if (d === "MEDIUM") return "Intermediate"
        return "Expert"
    }

    // Group missions and compute progress
    const levelsData = {
        Beginner: {
            title: "Beginner Path",
            icon: <BookOpen className="size-6 text-indigo-400" />,
            badgeBg: "bg-indigo-950/20 border-indigo-500/30 text-indigo-400",
            description: "Sequential C fundamentals and logic structures. Master basic C syntax, variable declarations, and fundamental math operators.",
            difficultyKey: "EASY",
            missions: [] as typeof missions,
            completed: 0,
        },
        Intermediate: {
            title: "Intermediate Path",
            icon: <Play className="size-6 text-[#4ae176] fill-[#4ae176]/10" />,
            badgeBg: "bg-[#4ae176]/10 border-[#4ae176]/30 text-[#4ae176]",
            description: "Solve complex C challenges with conditional control flows, iterative loops, pointers, memory addresses, and data structures.",
            difficultyKey: "MEDIUM",
            missions: [] as typeof missions,
            completed: 0,
        },
        Expert: {
            title: "Expert Path",
            icon: <Zap className="size-6 text-[#ffb95f] fill-[#ffb95f]/10" />,
            badgeBg: "bg-[#ffb95f]/10 border-[#ffb95f]/30 text-[#ffb95f]",
            description: "Conquer advanced algorithm design, software security audits, custom memory compilation, and low-level performance optimization.",
            difficultyKey: "HARD",
            missions: [] as typeof missions,
            completed: 0,
        }
    }

    // Populate data
    missions.forEach((mission) => {
        const group = getLevelGroup(mission.difficulty) as keyof typeof levelsData
        if (levelsData[group]) {
            levelsData[group].missions.push(mission)
            const um = userMissionsMap.get(mission.id)
            if (um?.status === "COMPLETED") {
                levelsData[group].completed++
            }
        }
    })

    const completedCount = userMissions.filter((um) => um.status === "COMPLETED").length
    const totalCount = missions.length
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    const currentRank = calculateAgentRank(user?.auraPoints ?? 0)
    const { nextRank, nextThreshold } = getNextRankThreshold(user?.auraPoints ?? 0)

    return (
        <div className="flex-grow bg-[#14141A] min-h-[calc(100vh-3.5rem)] relative">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
                
                {/* Left Sidebar */}
                <aside className="w-full md:w-[250px] shrink-0 flex flex-col gap-6">
                    {/* User Profile Block */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-5 flex flex-col items-center">
                        <div className="size-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-[0_0_15px_rgba(14, 185, 77, 0.5)] text-white">
                            {(user?.name || session.user.name || "U")[0].toUpperCase()}
                        </div>
                        <h2 className="text-lg font-bold text-[#F1F1F5] truncate max-w-full">
                            {user?.name || session.user.name || "Anonymous"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Medal className="size-4 text-[#ffb95f]" />
                            <span className="text-sm font-medium text-[#c7c4d7]">Rank: {currentRank}</span>
                        </div>
                        <div className="w-full mt-5">
                            <div className="flex justify-between text-xs text-[#5C5C7A] mb-1.5 font-medium">
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
                            <Rocket className="size-4 text-[#8B8BA7]" />
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
                <main className="flex-grow min-w-0 flex flex-col gap-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-semibold text-[#F1F1F5] tracking-tight">Curriculum & Paths</h1>
                        <p className="mt-1 text-xs text-[#8B8BA7]">
                            View your gamified learning curriculum. Select a mission node to begin compiling.
                        </p>
                    </div>

                    {/* Overall Progress */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-5">
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="text-lg font-bold text-[#e4e1e9]">Campaign Completion</h3>
                            <span className="text-sm text-[#908fa0] font-mono">{completedCount} of {totalCount} missions completed · {progressPercent}%</span>
                        </div>
                        <div className="h-3 w-full bg-[#2A2A35] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 rounded-full relative transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Levels Column Layout */}
                    <div className="flex flex-col gap-8">
                        {Object.entries(levelsData).map(([levelKey, level]) => {
                            const levelPercent = level.missions.length > 0 
                                ? Math.round((level.completed / level.missions.length) * 100)
                                : 0

                            return (
                                <div key={levelKey} className="bg-[#1C1C24] border border-[#323242] rounded-xl p-6 flex flex-col gap-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#323242]/50 pb-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-12 ${level.badgeBg} rounded-xl flex items-center justify-center`}>
                                                {level.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[#e4e1e9]">{level.title}</h3>
                                                <p className="text-xs text-[#8B8BA7] mt-0.5">{level.completed} of {level.missions.length} units finished · {levelPercent}%</p>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-48 bg-[#2A2A35] h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${levelPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <p className="text-xs text-[#908fa0] leading-relaxed">
                                        {level.description}
                                    </p>

                                    {/* Missions List for this Level */}
                                    <div className="grid gap-3 mt-2">
                                        {level.missions.map((mission) => {
                                            const um = userMissionsMap.get(mission.id)
                                            const status = um?.status || "LOCKED"

                                            const isCompleted = status === "COMPLETED"
                                            const isUnlocked = status === "UNLOCKED" || status === "IN_PROGRESS"
                                            const isLocked = status === "LOCKED"

                                            return (
                                                <div 
                                                    key={mission.id}
                                                    className={`border rounded-xl p-4 flex items-center justify-between transition-all duration-200 ${
                                                        isCompleted 
                                                            ? "bg-[#1C1C24]/40 border-[#323242]/50 opacity-80"
                                                            : isUnlocked
                                                            ? "bg-[#2A2A35]/30 border-indigo-500/40 hover:bg-[#2A2A35]/60 hover:border-indigo-500/60 cursor-pointer group"
                                                            : "bg-[#14141A]/50 border-[#323242]/20 opacity-50 cursor-not-allowed"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`size-10 rounded-lg flex items-center justify-center ${
                                                            isCompleted 
                                                                ? "bg-[#4ae176]/10 text-[#4ae176]"
                                                                : isUnlocked
                                                                ? "bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform"
                                                                : "bg-[#2A2A35] text-[#5C5C7A]"
                                                        }`}>
                                                            {isCompleted ? (
                                                                <CheckCircle className="size-5" />
                                                            ) : isLocked ? (
                                                                <Lock className="size-5" />
                                                            ) : (
                                                                <Play className="size-5 fill-current" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-bold text-sm ${isCompleted ? "text-[#908fa0] line-through decoration-[#323242]" : "text-[#e4e1e9] group-hover:text-indigo-400 transition-colors"}`}>
                                                                {mission.title}
                                                            </h4>
                                                            <p className="text-[10px] text-[#8B8BA7] mt-0.5">Order {mission.order} · {mission.auraReward} AP Reward</p>
                                                        </div>
                                                    </div>

                                                    {isCompleted ? (
                                                        <span className="text-xs font-mono text-[#4ae176] font-bold">+{mission.auraReward} AP</span>
                                                    ) : isUnlocked ? (
                                                        <Link href={`/mission/${mission.id}`} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-500/15">
                                                            Compile
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-[#5C5C7A] font-mono flex items-center gap-1">
                                                            <Lock className="size-3" /> Locked
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        })}

                                        {level.missions.length === 0 && (
                                            <div className="text-center py-6 border border-dashed border-[#323242] rounded-xl text-xs text-[#5C5C7A] font-mono">
                                                No missions currently seeded in this category.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </main>
            </div>
        </div>
    )
}
