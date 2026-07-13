import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { db, safeDbQuery } from "@/lib/db"
import { AlertTriangle, Shield, Zap, LayoutDashboard, History, Target, CheckCircle, Flame, Medal, Bolt, Play, BookOpen } from "lucide-react"
import { DailyChallenge, type DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"
import { MissionIntelStory } from "./MissionIntelStory"
import Link from "next/link"
import { calculateAgentRank } from "@/lib/aura"

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

const globalForDailyChallenge = globalThis as unknown as {
    dailyChallenge: { question: DailyChallengeQuestion | null; expiresAt: number } | undefined
}

async function getDailyChallengeQuestion(): Promise<DailyChallengeQuestion | null> {
    const now = Date.now()
    if (globalForDailyChallenge.dailyChallenge && globalForDailyChallenge.dailyChallenge.expiresAt > now) {
        return globalForDailyChallenge.dailyChallenge.question
    }

    const count = await db.dailyQuestion.count()
    if (count === 0) return null

    const index = Math.floor(now / 86400000) % count
    const dailyQuestion = await db.dailyQuestion.findFirst({
        skip: index,
        orderBy: { id: "asc" },
        select: { id: true, question: true, options: true },
    })

    if (!dailyQuestion) return null

    let options: unknown = []
    try {
        options = JSON.parse(dailyQuestion.options)
    } catch (error) {
        console.error("Failed to parse daily challenge options", error)
    }

    if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) {
        return null
    }

    const question: DailyChallengeQuestion = {
        id: dailyQuestion.id,
        question: dailyQuestion.question,
        options,
    }

    // Cache until end of day (midnight)
    const midnight = new Date()
    midnight.setHours(23, 59, 59, 999)
    globalForDailyChallenge.dailyChallenge = {
        question,
        expiresAt: midnight.getTime()
    }

    return question
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [missions, user, dailyChallengeQuestion] = await Promise.all([
        safeDbQuery(
            () => getDashboardMissions(session.user.id),
            [],
            "DashboardPage.missions"
        ),
        safeDbQuery(
            () => db.user.findUnique({
                where: { id: session.user.id },
                select: { auraPoints: true, auraLevel: true, name: true, email: true, comboStreak: true, foxBadges: true },
            }),
            null,
            "DashboardPage.user"
        ),
        safeDbQuery(
            () => getDailyChallengeQuestion(),
            null,
            "DashboardPage.dailyChallenge"
        ),
    ])

    const dbOffline = user === null && missions.length === 0

    const completedCount = missions.filter((m) => m.status === "COMPLETED").length
    const totalCount = missions.length
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    const currentRank = calculateAgentRank(user?.auraPoints ?? 0)
    const { nextRank, nextThreshold } = getNextRankThreshold(user?.auraPoints ?? 0)
    const nextThresholdText = nextRank === "Max Rank" 
        ? "Max Rank Achieved" 
        : `${user?.auraPoints ?? 0} / ${nextThreshold} AP to ${nextRank}`
    const apToNextRank = nextRank === "Max Rank" ? 0 : nextThreshold - (user?.auraPoints ?? 0)

    return (
        <div className="flex-grow bg-[#14141A] min-h-[calc(100vh-3.5rem)] relative">
            <MissionIntelStory />
            
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
                            <div className="text-[10px] text-center text-[#5C5C7A] mt-1.5">
                                {nextRank === "Max Rank" ? "Max Rank Achieved" : `${apToNextRank} AP to next rank`}
                            </div>
                        </div>
                    </div>

                    {/* Navigation List */}
                    <nav className="flex flex-col gap-1 bg-[#1C1C24] border border-[#323242] rounded-xl p-3">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-[#2A2A35] text-[#F1F1F5] rounded-lg font-medium text-sm transition-colors">
                            <LayoutDashboard className="size-4 text-indigo-400" />
                            Dashboard
                        </Link>
                        <Link href="/levels" className="flex items-center gap-3 px-3 py-2.5 text-[#908fa0] hover:bg-[#2A2A35]/50 hover:text-[#e4e1e9] rounded-lg font-medium text-sm transition-colors">
                            <BookOpen className="size-4 text-indigo-400" />
                            Curriculum
                        </Link>
                        <Link href="/history" className="flex items-center gap-3 px-3 py-2.5 text-[#908fa0] hover:bg-[#2A2A35]/50 hover:text-[#e4e1e9] rounded-lg font-medium text-sm transition-colors">
                            <History className="size-4 text-[#8B8BA7]" />
                            History
                        </Link>
                        <a href="#challenge-section" className="flex items-center gap-3 px-3 py-2.5 text-[#908fa0] hover:bg-[#2A2A35]/50 hover:text-[#e4e1e9] rounded-lg font-medium text-sm transition-colors">
                            <Target className="size-4 text-[#8B8BA7]" />
                            Daily Challenge
                        </a>
                    </nav>

                    {/* Stats Summary */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-5 flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-[#5C5C7A] uppercase tracking-wider">Agent Stats</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="size-4 text-[#4ae176]" />
                                <span className="text-sm text-[#c7c4d7]">Missions</span>
                            </div>
                            <span className="text-sm font-mono font-bold text-[#e4e1e9]">{completedCount} / {totalCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Flame className="size-4 text-[#ffb95f]" />
                                <span className="text-sm text-[#c7c4d7]">Combo Streak</span>
                            </div>
                            <span className="text-sm font-mono font-bold text-[#e4e1e9]">x{user?.comboStreak ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Medal className="size-4 text-indigo-400" />
                                <span className="text-sm text-[#c7c4d7]">Fox Badges</span>
                            </div>
                            <span className="text-sm font-mono font-bold text-[#e4e1e9]">{user?.foxBadges ?? 0}</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-grow min-w-0 flex flex-col gap-6">
                    {/* DB Offline Warning */}
                    {dbOffline && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-center gap-3">
                            <AlertTriangle className="size-6 text-amber-400 flex-shrink-0" />
                            <div>
                                <p className="text-amber-400 font-mono text-sm font-bold">DATABASE CONNECTION FAILED</p>
                                <p className="text-amber-400/70 font-mono text-xs mt-1">
                                    Unable to reach the database. Check your DATABASE_URL and DIRECT_URL in .env and ensure your PostgreSQL/Supabase database is accessible from your network.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-[#F1F1F5] tracking-tight">Mission Control</h1>
                            <p className="mt-1 text-xs text-[#8B8BA7]">
                                Welcome back. Select your active module to proceed.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex size-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dbOffline ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full size-2.5 ${dbOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            <span className={`text-xs font-mono tracking-wider ${dbOffline ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {dbOffline ? 'DB OFFLINE' : 'SYSTEM ONLINE'}
                            </span>
                        </div>
                    </div>

                    {/* Top Metric Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl px-5 py-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                            <span className="text-[#908fa0] text-sm font-medium mb-2 flex items-center gap-2">
                                <Bolt className="size-4 text-indigo-400" />
                                Total Aura
                            </span>
                            <span className="text-2xl font-bold font-mono text-[#e4e1e9]">{user?.auraPoints ?? 0} <span className="text-xs text-[#5C5C7A] font-sans">AP</span></span>
                        </div>
                        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl px-5 py-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                            <span className="text-[#908fa0] text-sm font-medium mb-2 flex items-center gap-2">
                                <CheckCircle className="size-4 text-[#4ae176]" />
                                Missions Done
                            </span>
                            <span className="text-2xl font-bold font-mono text-[#e4e1e9]">{completedCount}/{totalCount}</span>
                        </div>
                        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl px-5 py-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                            <span className="text-[#908fa0] text-sm font-medium mb-2 flex items-center gap-2">
                                <Flame className="size-4 text-[#ffb95f]" />
                                Combo Streak
                            </span>
                            <span className="text-2xl font-bold font-mono text-[#e4e1e9]">x{user?.comboStreak ?? 0}</span>
                        </div>
                        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl px-5 py-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                            <span className="text-[#908fa0] text-sm font-medium mb-2 flex items-center gap-2">
                                <Shield className="size-4 text-[#c0c1ff]" />
                                Current Rank
                            </span>
                            <span className="text-2xl font-bold text-[#e4e1e9]">{currentRank}</span>
                        </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-5">
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="text-lg font-bold text-[#e4e1e9]">Campaign Progress</h3>
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

                    {/* Levels Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Beginner Level Card */}
                        <Link href="/levels?path=Beginner" className="bg-[#1C1C24] border border-[#323242] rounded-xl p-6 hover:border-indigo-500/30 transition-all duration-300 group block cursor-pointer">
                            <div className="size-10 bg-indigo-950/20 border border-indigo-500/30 rounded-lg flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                <BookOpen className="size-5" />
                            </div>
                            <h3 className="text-base font-bold text-[#e4e1e9] mb-2 font-headline group-hover:text-indigo-400 transition-colors">Beginner</h3>
                            <p className="text-xs text-[#908fa0] leading-relaxed">
                                Sequential C fundamentals and logic structures. Master basic syntax, variable declarations, and fundamental operators.
                            </p>
                        </Link>

                        {/* Intermediate Level Card */}
                        <Link href="/levels?path=Intermediate" className="bg-[#1C1C24] border border-[#323242] rounded-xl p-6 hover:border-indigo-500/30 transition-all duration-300 group block cursor-pointer">
                            <div className="size-10 bg-indigo-950/20 border border-indigo-500/30 rounded-lg flex items-center justify-center mb-4 text-[#4ae176] group-hover:scale-110 transition-transform duration-300">
                                <Play className="size-5 fill-current" />
                            </div>
                            <h3 className="text-base font-bold text-[#e4e1e9] mb-2 font-headline group-hover:text-indigo-400 transition-colors">Intermediate</h3>
                            <p className="text-xs text-[#908fa0] leading-relaxed">
                                Solve complex C challenges with loops, control flow, pointers, memory addresses, and data structures.
                            </p>
                        </Link>

                        {/* Expert Level Card */}
                        <Link href="/levels?path=Expert" className="bg-[#1C1C24] border border-[#323242] rounded-xl p-6 hover:border-indigo-500/30 transition-all duration-300 group block cursor-pointer">
                            <div className="size-10 bg-indigo-950/20 border border-indigo-500/30 rounded-lg flex items-center justify-center mb-4 text-[#ffb95f] group-hover:scale-110 transition-transform duration-300">
                                <Zap className="size-5 fill-current" />
                            </div>
                            <h3 className="text-base font-bold text-[#e4e1e9] mb-2 font-headline group-hover:text-indigo-400 transition-colors">Expert</h3>
                            <p className="text-xs text-[#908fa0] leading-relaxed">
                                Conquer advanced algorithm design, memory security audits, recursive compiler optimizations, and low-level performance.
                            </p>
                        </Link>
                    </div>

                    {/* Daily Challenge Widget */}
                    <div id="challenge-section" className="scroll-mt-20">
                        <DailyChallenge initialQuestion={dailyChallengeQuestion} />
                    </div>
                </main>
            </div>
        </div>
    )
}
