import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { db, safeDbQuery } from "@/lib/db"
import {
    AlertTriangle,
    Zap,
    Play,
    BookOpen,
    Lock,
    Bug,
} from "lucide-react"
import { type DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"
import { DailyChallengeModal } from "@/components/dashboard/DailyChallengeModalLazy"
import { MissionIntelStory } from "./MissionIntelStory"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"
import { AppSidebar, default as MobileSidebarDrawer } from "./Sidebar"
import MissionTable from "./MissionTable"
import DailyResetCountdown from "./DailyResetCountdown"

import { dailyQuestions } from "@/src/data/missionsData"

// ─── StatCell: small label/value/underline-bar block used in the curriculum grid ───
function StatCell({ label, value, barColor }: { label: string, value: string, barColor: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5E6B65]">
                {label}
            </span>
            <span className="font-mono font-bold text-sm text-[#E2E8F0]">
                {value}
            </span>
            <div className={`h-1 w-full rounded-full ${barColor}`} />
        </div>
    )
}

// ─── RANK PROGRESSION HELPER ───
// Maps current aura points to the next rank + point threshold (sidebar progress bar).
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

// ─── DAILY CHALLENGE QUESTION (cached until midnight) ───
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

// ═══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════
export default async function DashboardPage() {
    // ─── Auth guard ───
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    // ─── Data fetching (missions, user profile, daily challenge) ───
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

    // ─── Rank / agent identity (feeds AppSidebar) ───
    const currentRank = calculateAgentRank(user?.auraPoints ?? 0)
    const { nextThreshold } = getNextRankThreshold(user?.auraPoints ?? 0)

    const rankStyles = getRankBadgeStyles(currentRank)
    const agentName = user?.name || session.user.name || "Anonymous"
    const agentIdShort = session.user.id.substring(0, 8).toUpperCase()

    // ─── Sidebar "Active Sectors" status list ───
    const sectors = [
        { name: "Sector Alpha", status: "active" as const },
        { name: "Sector Beta", status: "locked" as const },
        { name: "Sector Gamma", status: "locked" as const },
    ]

    // ─── Curriculum grid card data (Beginner/Intermediate/Expert) ───
    const curriculumSectors = [
        {
            path: "Beginner",
            name: "Sector Alpha",
            title: "Beginner Curriculum",
            tier: "LEVEL 1 (UNRESTRICTED)",
            icon: BookOpen,
            locked: false,
        },
        {
            path: "Intermediate",
            name: "Sector Beta",
            title: "Intermediate Curriculum",
            tier: "LEVEL 2 (RESTRICTED)",
            icon: Play,
            locked: true,
        },
        {
            path: "Expert",
            name: "Sector Gamma",
            title: "Expert Curriculum",
            tier: "LEVEL 3 (CLASSIFIED)",
            icon: Zap,
            locked: true,
        },
    ]

    // ─── Shared props passed to both the desktop sidebar and the mobile drawer ───
    const sidebarProps = {
        agentName,
        agentIdShort,
        rank: currentRank,
        rankColorClass: rankStyles.colorText,
        rankShadowClass: rankStyles.shadow,
        auraPoints: user?.auraPoints ?? 0,
        nextThreshold,
        sectors,
    }

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════
    return (
        <div className="flex min-h-[calc(100dvh-64px)] bg-[#0A0C0B] text-[#E2E8F0] font-mono selection:bg-emerald-500/20 overflow-x-hidden">
            {/* First-run intro modal + daily challenge popup (render nothing until triggered) */}
            <MissionIntelStory />
            <DailyChallengeModal initialQuestion={dailyChallengeQuestion} />

            {/* ─── Desktop sidebar (hidden below `lg`, see components/AppSidebar.tsx) ─── */}
            <AppSidebar {...sidebarProps} />

            <div className="flex-1 min-w-0 flex flex-col gap-4 p-3 sm:p-4 lg:p-6">
                {/* ─── Mobile top bar: hamburger drawer + network status pill (hidden at `lg`+) ─── */}
                <div className="flex lg:hidden items-center justify-between">
                    <MobileSidebarDrawer {...sidebarProps} />
                    <div className="flex items-center gap-2 bg-[#111413] border border-white/[.06] px-3 py-1.5 rounded-lg text-xs select-none">
                        <span className="relative flex size-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dbOffline ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full size-2 ${dbOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        </span>
                        <span className={`text-[10px] tracking-wider ${dbOffline ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                            {dbOffline ? 'DB_DISCONNECTED' : 'NETWORK_SECURE'}
                        </span>
                    </div>
                </div>

                {/* ─── DB offline banner: only shown when both queries came back empty ─── */}
                {dbOffline && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3 shrink-0">
                        <AlertTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                            <p className="text-amber-500 font-mono text-xs font-bold">DATABASE CONNECTION OFFLINE</p>
                            <p className="text-amber-500/70 font-mono text-[11px] mt-0.5 leading-tight">
                                Systems are running in sandboxed demo state. Unable to reach active database. Verify network environment settings and DATABASE_URL connection status.
                            </p>
                        </div>
                    </div>
                )}

                {/* ─── Hero Band: title, CTA buttons (Resume/Daily Task/Debug Lab), daily-reset countdown ─── */}
                <section className="bg-[#111413] border border-white/[.06] rounded-xl p-6 shrink-0">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="hidden sm:flex size-14 rounded-xl bg-emerald-950/40 border border-emerald-500/40 items-center justify-center shadow-[0_0_24px_rgba(52,211,153,.25)] shrink-0">
                                <Zap className="size-6 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold font-sans text-emerald-400 tracking-tight leading-none drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]">
                                    Mission Control
                                </h1>
                                <p className="text-xs text-[#8F9F8F] font-sans mt-2 max-w-md">
                                    Select active module and decrypt sectors to progress through the curriculum.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                    <Link
                                        href="/levels"
                                        className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-lg text-xs font-bold shadow-[0_0_24px_rgba(52,211,153,.25)] transition-colors"
                                    >
                                        <Play className="size-3.5" /> Resume Mission
                                    </Link>
                                    <Link
                                        href="/daily-tasks"
                                        className="inline-flex items-center justify-center gap-1.5 bg-[#181C18] hover:bg-[#20241F] border border-white/[.06] text-[#E2E8F0] px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Zap className="size-3.5 text-emerald-400" /> Daily Task
                                    </Link>
                                    <Link
                                        href="/debug-lab"
                                        className="inline-flex items-center justify-center gap-1.5 bg-[#181C18] hover:bg-[#20241F] border border-white/[.06] text-[#E2E8F0] px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Bug className="size-3.5 text-emerald-400" /> Debug Lab
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <DailyResetCountdown />
                    </div>
                </section>

                {/* ─── Control Row: view-mode pills (Overview/Progress/Stats) + time-range filter (decorative, not wired to data) ─── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 bg-[#111413] p-1 rounded-lg border border-white/[.06]">
                        <button type="button" className="bg-[#181C18] text-emerald-400 px-4 py-1.5 rounded-md text-xs font-semibold transition-all">
                            Overview
                        </button>
                        <button type="button" className="text-[#8F9F8F] hover:text-[#E2E8F0] px-4 py-1.5 rounded-md text-xs font-medium transition-all">
                            Progress
                        </button>
                        <button type="button" className="text-[#8F9F8F] hover:text-[#E2E8F0] px-4 py-1.5 rounded-md text-xs font-medium transition-all">
                            Stats
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-[#111413] p-1 rounded-lg border border-white/[.06]">
                        <button type="button" className="bg-[#181C18] text-emerald-400 px-3 py-1 rounded text-[11px] font-semibold transition-all">
                            24h
                        </button>
                        <button type="button" className="text-[#8F9F8F] hover:text-[#E2E8F0] px-3 py-1 rounded text-[11px] font-medium transition-all">
                            7D
                        </button>
                        <button type="button" className="text-[#8F9F8F] hover:text-[#E2E8F0] px-3 py-1 rounded text-[11px] font-medium transition-all">
                            30D
                        </button>
                        <button type="button" className="text-[#8F9F8F] hover:text-[#E2E8F0] px-3 py-1 rounded text-[11px] font-medium transition-all">
                            All
                        </button>
                    </div>
                </div>

                {/* ─── Curriculum Grid: Beginner/Intermediate/Expert sector cards, links to /levels?path=... ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                    {curriculumSectors.map((sector) => {
                        const IconComp = sector.icon
                        return (
                            <Link
                                key={sector.path}
                                href={`/levels?path=${sector.path}`}
                                className="bg-[#111413] border border-white/[.06] rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-200 group flex flex-col gap-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="size-10 bg-[#181C18] rounded-lg flex items-center justify-center border border-white/[.06] group-hover:border-emerald-500/30 shadow-inner">
                                        <IconComp className="size-4.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                                    </div>
                                    <div className="size-8 flex items-center justify-center rounded-lg border border-white/[.06] bg-[#181C18]">
                                        <Lock className={`size-3.5 ${sector.locked ? "text-[#5E6B65]" : "text-emerald-400"}`} />
                                    </div>
                                </div>

                                <div className="text-left">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-mono text-[#5E6B65] uppercase">{sector.name}</span>
                                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-emerald-950/10 border-emerald-500/20 text-emerald-400 tracking-wider">
                                            {sector.tier}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold font-mono text-[#E2E8F0] mt-1 group-hover:text-emerald-400 transition-colors tracking-tight">
                                        {sector.title}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-3 gap-3 border-t border-white/[.06] pt-4 mt-auto">
                                    <StatCell label="Sectors" value="0/5" barColor="bg-emerald-500" />
                                    <StatCell label="Decrypted" value="0%" barColor="bg-emerald-500" />
                                    <StatCell label="AP" value="0" barColor="bg-amber-500" />
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* ─── Mission Table: full mission list, accept/review actions (see ./MissionTable.tsx) ─── */}
                <MissionTable missions={missions} />
            </div>
        </div>
    )
}


