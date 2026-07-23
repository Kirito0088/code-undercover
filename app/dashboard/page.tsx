import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { db, safeDbQuery } from "@/lib/db"
import { 
    AlertTriangle, 
    Shield, 
    Zap, 
    LayoutDashboard, 
    History, 
    Target, 
    CheckCircle, 
    Flame, 
    Medal, 
    Bolt, 
    Play, 
    BookOpen,
    ArrowRight
} from "lucide-react"
import { type DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"
import { DailyChallengeModal } from "@/components/dashboard/DailyChallengeModal"
import { MissionIntelStory } from "./MissionIntelStory"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"

import { dailyQuestions } from "@/src/data/missionsData"

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

    let question: DailyChallengeQuestion | null = null

    try {
        const count = await db.dailyQuestion.count()
        if (count > 0) {
            const index = Math.floor(now / 86400000) % count
            const dailyQuestion = await db.dailyQuestion.findFirst({
                skip: index,
                orderBy: { id: "asc" },
                select: { id: true, question: true, options: true },
            })

            if (dailyQuestion) {
                let options: unknown = []
                try {
                    options = JSON.parse(dailyQuestion.options)
                } catch (error) {
                    console.error("Failed to parse daily challenge options", error)
                }

                if (Array.isArray(options) && options.every((option) => typeof option === "string")) {
                    question = {
                        id: dailyQuestion.id,
                        question: dailyQuestion.question,
                        options,
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch daily question from DB, using static fallback:", error)
    }

    // Fallback to static daily questions if DB is offline or unseeded
    if (!question && dailyQuestions.length > 0) {
        const index = Math.floor(now / 86400000) % dailyQuestions.length
        const fallbackQ = dailyQuestions[index]
        question = {
            id: fallbackQ.id,
            question: fallbackQ.question,
            options: fallbackQ.options,
        }
    }

    if (question) {
        const midnight = new Date()
        midnight.setHours(23, 59, 59, 999)
        globalForDailyChallenge.dailyChallenge = {
            question,
            expiresAt: midnight.getTime()
        }
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
            
            <MissionIntelStory />
            <DailyChallengeModal initialQuestion={dailyChallengeQuestion} />
            
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 relative z-10">
                {/* Header Tile */}
                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden group animate-terminal-flicker">
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#00ff4104,transparent_70%)] pointer-events-none"></div>
                     <div className="text-left relative z-10">
                         <span className="text-[10px] font-mono tracking-widest text-[#4A5D4A] uppercase select-none">MISSION_DECK // OPERATIVE_HUD</span>
                         <h1 className="text-2xl font-bold font-sans text-emerald-400 tracking-tight mt-0.5 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">Mission Control</h1>
                         <p className="text-xs text-[#8F9F8F] font-sans mt-0.5">
                             Select active module and decrypt sectors to progress through the curriculum.
                         </p>
                     </div>
                     <div className="flex items-center gap-2 bg-[#07080A] border border-[#1F261F] px-3.5 py-2 rounded-lg font-mono relative z-10 self-start sm:self-auto select-none">
                         <span className="relative flex size-2.5">
                             <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dbOffline ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                             <span className={`relative inline-flex rounded-full size-2.5 ${dbOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                         </span>
                         <span className={`text-[10px] tracking-wider ${dbOffline ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                             {dbOffline ? 'DB_DISCONNECTED' : 'NETWORK_SECURE'}
                         </span>
                     </div>
                </div>

                {dbOffline && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-start gap-4 animate-terminal-flicker">
                        <AlertTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                            <p className="text-amber-500 font-mono text-sm font-bold">DATABASE CONNECTION OFFLINE</p>
                            <p className="text-amber-500/70 font-mono text-xs mt-1 leading-relaxed">
                                Systems are running in sandboxed demo state. Unable to reach active database. Verify network environment settings and DATABASE_URL connection status.
                            </p>
                        </div>
                    </div>
                )}

                {/* Grid Structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* CARD 1: Operative Dossier (lg:col-span-2) */}
                    <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group lg:col-span-2 animate-terminal-flicker animation-delay-75">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#00ff4108,transparent_70%)] pointer-events-none"></div>
                        
                        {/* Left part: Avatar scan block */}
                        <div className="relative group/avatar shrink-0">
                            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                            <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-500 rounded-br-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>

                            <div className="size-20 bg-[#161820]/80 rounded-sm border border-[#1F261F] flex items-center justify-center text-3xl font-mono font-bold text-emerald-400 shadow-inner select-none drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">
                                {(user?.name || session.user.name || "U")[0].toUpperCase()}
                            </div>
                        </div>

                        {/* Right part: Dossier details */}
                        <div className="flex-grow w-full text-left flex flex-col justify-between h-full min-w-0">
                            <div>
                                <div className="flex justify-between items-center border-b border-[#1F261F] pb-1.5 font-mono text-[9px] text-[#4A5D4A] mb-2">
                                    <span>SYS.OP // CODE</span>
                                    <span>ID: {session.user.id.substring(0, 8).toUpperCase()}</span>
                                </div>
                                <span className="text-[9px] font-mono tracking-widest text-[#4A5D4A] uppercase block">AGENT CODENAME</span>
                                <h2 className="text-lg font-mono font-bold text-[#E2E8F0] truncate tracking-wide">
                                    {user?.name || session.user.name || "Anonymous"}
                                </h2>
                                
                                <div className="inline-flex items-center gap-1.5 mt-1.5 bg-[#161820]/50 border border-[#1F261F] px-2 py-0.5 rounded-sm">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-mono text-[#8F9F8F]">
                                        Clearance: <span className={`${rankStyles.colorText} ${rankStyles.shadow}`}>{currentRank}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar in same box */}
                            <div className="mt-4 w-full">
                                <div className="flex justify-between text-[9px] font-mono text-[#8F9F8F] mb-1">
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
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: Console Navigation channels (lg:col-span-1) */}
                    <nav className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-5 flex flex-col justify-between gap-2 relative lg:col-span-1 animate-terminal-flicker animation-delay-150">
                        <div className="text-[10px] font-mono tracking-widest text-[#4A5D4A] uppercase mb-1.5 select-none border-b border-[#1F261F] pb-1 text-left">Console Channels</div>
                        
                        <Link href="/dashboard" className="flex items-center justify-between px-2.5 py-1.5 bg-[#181C18] text-emerald-400 rounded-sm font-medium text-xs border border-[#1F261F] hover:border-emerald-500/30">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="size-3.5 text-emerald-400" />
                                <span className="font-mono text-[10px]">HUD_01_CONTROL</span>
                            </div>
                            <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.25 rounded border border-emerald-500/20">LIVE</span>
                        </Link>
                        
                        <Link href="/levels" className="flex items-center justify-between px-2.5 py-1.5 text-[#8F9F8F] hover:bg-[#181C18]/40 hover:text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 group border border-transparent hover:border-[#1F261F]">
                            <div className="flex items-center gap-2">
                                <BookOpen className="size-3.5 text-[#8F9F8F] group-hover:text-emerald-400 transition-colors" />
                                <span className="font-mono text-[10px]">HUD_02_SECTORS</span>
                            </div>
                            <span className="text-[8px] font-mono text-[#4A5D4A]">OPEN</span>
                        </Link>
                        
                        <Link href="/history" className="flex items-center justify-between px-2.5 py-1.5 text-[#8F9F8F] hover:bg-[#181C18]/40 hover:text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 group border border-transparent hover:border-[#1F261F]">
                            <div className="flex items-center gap-2">
                                <History className="size-3.5 text-[#8F9F8F] group-hover:text-emerald-400 transition-colors" />
                                <span className="font-mono text-[10px]">HUD_03_CHRONO</span>
                            </div>
                            <span className="text-[8px] font-mono text-[#4A5D4A]">LOGS</span>
                        </Link>
                        
                        <Link href="/daily-tasks" className="flex items-center justify-between px-2.5 py-1.5 text-[#8F9F8F] hover:bg-[#181C18]/40 hover:text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 group border border-transparent hover:border-[#1F261F]">
                            <div className="flex items-center gap-2">
                                <Zap className="size-3.5 text-[#8F9F8F] group-hover:text-emerald-400 transition-colors" />
                                <span className="font-mono text-[10px]">HUD_04_DAILY</span>
                            </div>
                            <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.25 rounded border border-emerald-500/20">NEW</span>
                        </Link>
                    </nav>

                    {/* CARD 3: Intelligence Readout (lg:col-span-1) */}
                    <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-5 flex flex-col justify-between gap-3 lg:col-span-1 text-left animate-terminal-flicker animation-delay-225">
                        <h3 className="text-[10px] font-mono font-bold text-[#4A5D4A] uppercase tracking-wider border-b border-[#1F261F] pb-1 select-none">INTELLIGENCE READOUT</h3>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#8F9F8F]">RESOLVED</span>
                            <span className="font-bold text-[#E2E8F0]">{completedCount}/{totalCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#8F9F8F]">COMBO</span>
                            <span className="font-bold text-amber-500">x{user?.comboStreak ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#8F9F8F]">INSIGNIAS</span>
                            <span className="font-bold text-emerald-400">{user?.foxBadges ?? 0}</span>
                        </div>
                    </div>

                    {/* CARD 4: Campaign Decryption Rate Gauge (lg:col-span-2) */}
                    <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-5 relative overflow-hidden lg:col-span-2 flex flex-col justify-between animate-terminal-flicker animation-delay-300">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#00ff4104,transparent_70%)] pointer-events-none"></div>
                        <div className="flex justify-between items-end mb-3.5 relative z-10 text-left">
                            <div>
                                <span className="text-[9px] font-mono tracking-widest text-[#4A5D4A] uppercase block select-none">Campaign Rate</span>
                                <h3 className="text-xs font-bold font-mono text-[#E2E8F0] mt-0.5">SYSTEM DECRYPTION STATUS</h3>
                            </div>
                            <span className="text-sm font-mono font-bold text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">{progressPercent}%</span>
                        </div>

                        {/* Segmented Ticks (20 Ticks) */}
                        <div className="flex gap-1 h-3.5 w-full relative z-10 bg-[#07080A]/80 p-0.5 rounded-sm border border-[#1F261F]/50">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const isFilled = i < Math.round((progressPercent / 100) * 20);
                                return (
                                    <div 
                                        key={i} 
                                        className={`h-full flex-grow rounded-xs transition-all duration-500 ease-out ${
                                            isFilled 
                                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                                                : 'bg-[#181C18]'
                                        }`}
                                    />
                                );
                            })}
                        </div>

                        <div className="flex justify-between font-mono text-[8px] text-[#4A5D4A] mt-2 relative z-10 px-0.5 select-none">
                            <span>SECTOR: GENERAL</span>
                            <span>{completedCount} OF {totalCount} DECRYPTED</span>
                        </div>
                    </div>

                    {/* CARDS 5-8: 2 Metrics HUD Tiles */}
                    {[
                        { id: "AURA", label: "OPERATIONAL AP", value: `${user?.auraPoints ?? 0} AP`, sub: "Total Aura Points", icon: Bolt, color: "text-emerald-400", delay: "animation-delay-375" },
                        { id: "RANK", label: "FIELD CLASSIF", value: currentRank, sub: "Operative Rating", icon: Shield, color: rankStyles.colorText, delay: "animation-delay-450" }
                    ].map((card) => {
                        const IconComp = card.icon;
                        return (
                            <div key={card.id} className={`bg-[#0D0E12] border border-[#1F261F] rounded-xl px-5 py-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-200 group relative overflow-hidden lg:col-span-1 text-left animate-terminal-flicker ${card.delay}`}>
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full translate-x-4 -translate-y-4 group-hover:bg-emerald-500/10 transition-all duration-300"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[#8F9F8F] text-[9px] font-mono tracking-wider flex items-center gap-1 uppercase select-none">
                                        <IconComp className={`size-3.5 ${card.color}`} />
                                        {card.label}
                                    </span>
                                    <span className="text-[8px] font-mono text-[#4A5D4A] select-none">HUD_{card.id}</span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-base font-bold font-mono text-[#E2E8F0] tracking-tight block">
                                        {card.value}
                                    </span>
                                    <span className="text-[9px] text-[#4A5D4A] mt-0.5 block">{card.sub}</span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Operational Sectors (spans 4 columns) */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { 
                                path: "Beginner", 
                                name: "Sector Alpha", 
                                title: "Beginner Curriculum",
                                desc: "Sequential C fundamentals and logic structures. Master basic syntax, variable declarations, and fundamental operators.",
                                clearance: "LEVEL 1 (UNRESTRICTED)",
                                color: "text-emerald-400",
                                bg: "bg-emerald-950/10 border-emerald-500/20",
                                icon: BookOpen,
                                delay: "animation-delay-450"
                            },
                            { 
                                path: "Intermediate", 
                                name: "Sector Beta", 
                                title: "Intermediate Curriculum",
                                desc: "Solve complex C challenges with loops, control flow, pointers, memory addresses, and data structures.",
                                clearance: "LEVEL 2 (RESTRICTED)",
                                color: "text-emerald-400",
                                bg: "bg-emerald-950/10 border-emerald-500/20",
                                icon: Play,
                                delay: "animation-delay-525"
                            },
                            { 
                                path: "Expert", 
                                name: "Sector Gamma", 
                                title: "Expert Curriculum",
                                desc: "Conquer advanced algorithm design, memory security audits, recursive compiler optimizations, and low-level performance.",
                                clearance: "LEVEL 3 (CLASSIFIED)",
                                color: "text-amber-500",
                                bg: "bg-amber-950/10 border-amber-500/20",
                                icon: Zap,
                                delay: "animation-delay-600"
                            }
                        ].map((sector) => {
                            const IconComp = sector.icon;
                            return (
                                <Link 
                                    key={sector.path}
                                    href={`/levels?path=${sector.path}`} 
                                    className={`bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300 group flex flex-col cursor-pointer relative overflow-hidden animate-terminal-flicker ${sector.delay}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="size-10 bg-[#161820] rounded-sm flex items-center justify-center border border-[#1F261F] group-hover:border-emerald-500/30 shadow-inner">
                                            <IconComp className="size-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                                        </div>
                                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${sector.bg} ${sector.color} tracking-wider`}>
                                            {sector.clearance}
                                        </span>
                                    </div>
                                    
                                    <span className="text-[10px] font-mono text-[#4A5D4A] uppercase block select-none">{sector.name}</span>
                                    <h3 className="text-base font-bold font-mono text-[#E2E8F0] mt-0.5 mb-2 group-hover:text-emerald-400 transition-colors text-left">
                                        {sector.title}
                                    </h3>
                                    <p className="text-xs text-[#8F9F8F] leading-relaxed mb-6 font-sans text-left line-clamp-3">
                                        {sector.desc}
                                    </p>
                                    
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#4A5D4A] group-hover:text-emerald-400 transition-colors border-t border-[#1F261F] pt-4 mt-auto">
                                        <span>LAUNCH OPERATIVE DECK</span>
                                        <ArrowRight className="size-3.5 transform translate-x-0 group-hover:translate-x-1 transition-transform duration-200" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                </div>
            </div>
        </div>
    )
}


