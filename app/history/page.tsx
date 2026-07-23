import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { db, safeDbQuery } from "@/lib/db"
import { 
    History, 
    Zap, 
    Shield, 
    Terminal, 
    Award, 
    BookOpen, 
    LayoutDashboard, 
    ChevronRight, 
    Code2,
    CheckCircle
} from "lucide-react"
import { HistoryCard } from "./HistoryCard"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"

export const metadata = {
    title: "Mission History | Code Undercover",
    description: "Review declassified code records for completed undercover missions.",
}

interface CompletedMission {
    id: string
    missionId: string
    missionOrder: number
    missionTitle: string
    difficulty: string
    language: string
    auraReward: number
    submittedCode: string | null
    attemptCount: number
    hintsUsed: number
    innovationUnlocked: boolean
    completedAt: Date | null
}

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

export default async function HistoryPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [completedMissions, user] = await Promise.all([
        safeDbQuery(
            async () => {
                const records = await db.userMission.findMany({
                    where: {
                        userId: session.user.id,
                        status: "COMPLETED",
                    },
                    include: {
                        mission: {
                            select: {
                                id: true,
                                order: true,
                                title: true,
                                difficulty: true,
                                language: true,
                                auraReward: true,
                            },
                        },
                    },
                    orderBy: {
                        mission: {
                            order: "asc",
                        },
                    },
                })

                return records.map((um): CompletedMission => ({
                    id: um.id,
                    missionId: um.missionId,
                    missionOrder: um.mission.order,
                    missionTitle: um.mission.title,
                    difficulty: um.mission.difficulty,
                    language: um.mission.language,
                    auraReward: um.mission.auraReward,
                    submittedCode: um.submittedCode,
                    attemptCount: um.attemptCount,
                    hintsUsed: um.hintsUsed,
                    innovationUnlocked: um.innovationUnlocked,
                    completedAt: um.completedAt,
                }))
            },
            [],
            "HistoryPage.completedMissions"
        ),
        safeDbQuery(
            () =>
                db.user.findUnique({
                    where: { id: session.user.id },
                    select: { name: true, email: true, auraPoints: true, auraLevel: true, missionsCompleted: true },
                }),
            null,
            "HistoryPage.user"
        ),
    ])

    const totalAttempts = completedMissions.reduce((sum, m) => sum + m.attemptCount, 0)
    const totalAura = completedMissions.reduce((sum, m) => sum + m.auraReward, 0)
    const innovations = completedMissions.filter((m) => m.innovationUnlocked).length

    const currentRank = calculateAgentRank(user?.auraPoints ?? 0)
    const { nextThreshold } = getNextRankThreshold(user?.auraPoints ?? 0)
    const rankStyles = getRankBadgeStyles(currentRank)
    const displayId = session.user.id.substring(0, 8).toUpperCase()

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
                        <span className="text-[10px] font-mono tracking-widest text-[#4A5D4A] uppercase select-none">CHRONO_DECK // RESOLVED_MISSIONS</span>
                        <h1 className="text-2xl font-bold font-sans text-emerald-400 tracking-tight mt-0.5 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">Mission Chrono History</h1>
                        <p className="text-xs text-[#8F9F8F] font-sans mt-0.5">
                            Review declassified solutions and intel archives submitted across your completed operations.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* Left Sidebar Dossier & Navigation */}
                    <aside className="w-full lg:w-[240px] shrink-0 flex flex-col gap-6 animate-terminal-flicker animation-delay-75">
                        {/* Agent Dossier block */}
                        <div className="bg-[#0D0E12] border border-[#1F261F] rounded-lg p-5 flex flex-col items-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#00ff4108,transparent_70%)] pointer-events-none"></div>
                            
                            <div className="w-full flex justify-between items-center mb-4 border-b border-[#1F261F] pb-2 font-mono text-[9px] text-[#4A5D4A]">
                                <span>SYS.OP // CODE</span>
                                <span>ID: {displayId}</span>
                            </div>

                            <div className="relative mb-4 group/avatar">
                                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>
                                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-500 rounded-br-sm transition-all duration-300 group-hover/avatar:border-emerald-400"></span>

                                <div className="size-16 bg-[#161820]/80 rounded-sm border border-[#1F261F] flex items-center justify-center text-2xl font-mono font-bold text-emerald-400 shadow-inner select-none drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">
                                    {(user?.name || session.user.name || "A")[0].toUpperCase()}
                                </div>
                            </div>

                            <div className="text-center w-full">
                                <span className="text-[9px] font-mono tracking-widest text-[#4A5D4A] uppercase block">AGENT CODENAME</span>
                                <h2 className="text-base font-mono font-bold text-[#E2E8F0] truncate max-w-full tracking-wide">
                                    {user?.name || session.user.name || "Anonymous Agent"}
                                </h2>
                                
                                <div className="inline-flex items-center gap-1.5 mt-2 bg-[#161820]/50 border border-[#1F261F] px-2.5 py-1 rounded-sm">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-xs font-mono font-medium text-[#8F9F8F]">
                                        Clearance: <span className={`${rankStyles.colorText} ${rankStyles.shadow}`}>{currentRank}</span>
                                    </span>
                                </div>
                            </div>

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

                        {/* Navigation Console Channels */}
                        <nav className="flex flex-col gap-1 bg-[#0D0E12] border border-[#1F261F] rounded-lg p-2.5 relative">
                            <div className="text-[10px] font-mono tracking-widest text-[#4A5D4A] uppercase px-2 mb-1.5 select-none">Console Channels</div>
                            
                            <Link href="/dashboard" className="flex items-center justify-between px-2.5 py-2 text-[#8F9F8F] hover:bg-[#181C18]/40 hover:text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 group border border-transparent hover:border-[#1F261F]">
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="size-3.5 text-[#8F9F8F] group-hover:text-emerald-400 transition-colors" />
                                    <span className="font-mono text-[10px]">HUD_01_CONTROL</span>
                                </div>
                                <span className="text-[8px] font-mono text-[#4A5D4A]">OPEN</span>
                            </Link>
                            
                            <Link href="/levels" className="flex items-center justify-between px-2.5 py-2 text-[#8F9F8F] hover:bg-[#181C18]/40 hover:text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 group border border-transparent hover:border-[#1F261F]">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="size-3.5 text-[#8F9F8F] group-hover:text-emerald-400 transition-colors" />
                                    <span className="font-mono text-[10px]">HUD_02_SECTORS</span>
                                </div>
                                <span className="text-[8px] font-mono text-[#4A5D4A]">OPEN</span>
                            </Link>
                            
                            <Link href="/history" className="flex items-center justify-between px-2.5 py-2 bg-[#181C18] text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 border border-[#1F261F]">
                                <div className="flex items-center gap-2">
                                    <History className="size-3.5 text-emerald-400" />
                                    <span className="font-mono text-[10px]">HUD_03_CHRONO</span>
                                </div>
                                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.25 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">LIVE</span>
                            </Link>

                            <Link href="/daily-tasks" className="flex items-center justify-between px-2.5 py-2 text-[#8F9F8F] hover:bg-[#181C18]/40 hover:text-emerald-400 rounded-sm font-medium text-xs transition-all duration-200 group border border-transparent hover:border-[#1F261F]">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-3.5 text-[#8F9F8F] group-hover:text-emerald-400 transition-colors" />
                                    <span className="font-mono text-[10px]">HUD_04_DAILY</span>
                                </div>
                                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.25 rounded border border-emerald-500/20">NEW</span>
                            </Link>
                        </nav>
                    </aside>

                    {/* Main Chrono History View */}
                    <main className="flex-grow min-w-0 flex flex-col gap-6">
                        
                        {/* Stats HUD Row */}
                        {completedMissions.length > 0 && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-terminal-flicker animation-delay-150">
                                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all text-left">
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#8F9F8F] uppercase">
                                        <Shield className="size-3.5 text-emerald-400" />
                                        <span>RESOLVED</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-xl font-bold font-mono text-[#E2E8F0]">{completedMissions.length}</span>
                                        <span className="text-[9px] text-[#4A5D4A] block mt-0.5">Missions Completed</span>
                                    </div>
                                </div>

                                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all text-left">
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#8F9F8F] uppercase">
                                        <Zap className="size-3.5 text-emerald-400" />
                                        <span>AURA PAYLOAD</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-xl font-bold font-mono text-emerald-400">{totalAura} AP</span>
                                        <span className="text-[9px] text-[#4A5D4A] block mt-0.5">Total Points Earned</span>
                                    </div>
                                </div>

                                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all text-left">
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#8F9F8F] uppercase">
                                        <Terminal className="size-3.5 text-emerald-400" />
                                        <span>EXECUTION LOGS</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-xl font-bold font-mono text-[#E2E8F0]">{totalAttempts}</span>
                                        <span className="text-[9px] text-[#4A5D4A] block mt-0.5">Total Code Attempts</span>
                                    </div>
                                </div>

                                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all text-left">
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#8F9F8F] uppercase">
                                        <Award className="size-3.5 text-amber-400" />
                                        <span>INNOVATION</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-xl font-bold font-mono text-amber-400">{innovations}</span>
                                        <span className="text-[9px] text-[#4A5D4A] block mt-0.5">Fox Insignia Badges</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chrono Timeline List */}
                        {completedMissions.length > 0 ? (
                            <div className="relative animate-terminal-flicker animation-delay-225">
                                {/* Vertical Scanline Connector */}
                                <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/40 via-[#1F261F] to-transparent" />

                                <div className="space-y-6">
                                    {completedMissions.map((mission, index) => (
                                        <div key={mission.id} className="relative flex gap-5">
                                            {/* Timeline node */}
                                            <div className="flex-shrink-0 relative z-10">
                                                <div className="size-[47px] rounded-full bg-[#0D0E12] border-2 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center justify-center">
                                                    <span className="text-emerald-400 font-mono text-xs font-bold">
                                                        #{String(mission.missionOrder).padStart(2, "0")}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* History Card */}
                                            <div className="flex-1 min-w-0">
                                                <HistoryCard mission={mission} index={index} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* End cap */}
                                <div className="relative flex gap-5 mt-6">
                                    <div className="flex-shrink-0 relative z-10">
                                        <div className="size-[47px] rounded-full bg-[#0D0E12] border border-[#1F261F] flex items-center justify-center">
                                            <CheckCircle className="size-4 text-emerald-400/60" />
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-[#4A5D4A] font-mono text-xs">ALL COMPLETED MISSIONS LOGGED IN ARCHIVE</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-12 text-center animate-terminal-flicker">
                                <div className="size-16 mx-auto mb-4 rounded-xl bg-[#161820] border border-[#1F261F] flex items-center justify-center">
                                    <Code2 className="size-8 text-[#4A5D4A]" />
                                </div>
                                <h2 className="text-base font-bold font-mono text-[#E2E8F0] mb-1">NO DECLASSIFIED RECORDS FOUND</h2>
                                <p className="text-[#8F9F8F] text-xs font-sans max-w-sm mx-auto leading-relaxed mb-6">
                                    Complete your first operational mission to unlock and archive your code execution history here.
                                </p>
                                <Link
                                    href="/levels"
                                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-5 py-2.5 rounded-md text-xs font-mono font-bold transition-all shadow-md shadow-emerald-600/20"
                                >
                                    <span>LAUNCH SECTOR CURRICULUM</span>
                                    <ChevronRight className="size-4" />
                                </Link>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}
