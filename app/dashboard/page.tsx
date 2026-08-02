import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { db, safeDbQuery } from "@/lib/db"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { type DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"
import { DailyChallengeModal } from "@/components/dashboard/DailyChallengeModalLazy"
import { MissionIntelStory } from "./MissionIntelStory"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { calculateAuraLevel } from "@/lib/aura"
import { dailyQuestions } from "@/src/data/missionsData"

import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import HeroBriefing from "./HeroBriefing"
import SectorCard from "./SectorCard"
import MissionTable from "./MissionTable"
import CommandPalette from "./CommandPalette"
import { ToastProvider } from "./ToastProvider"
import { LOCKED_SECTOR_PLACEHOLDER } from "./mock"
import type { AgentSummary, Difficulty, Mission, Sector } from "./types"

// ─── Aura-level bracket bounds (mirrors lib/aura.ts calculateAuraLevel exactly,
// just also returning the floor/ceiling so the sidebar's XP bar has real numbers). ───
function getLevelBounds(auraPoints: number): { floor: number; ceiling: number } {
    const brackets = [0, 200, 500, 1000, 2000, 3500]
    for (let i = 0; i < brackets.length - 1; i++) {
        if (auraPoints < brackets[i + 1]) return { floor: brackets[i], ceiling: brackets[i + 1] }
    }
    let floor = 3500
    let increment = 2000
    while (auraPoints >= floor + increment) {
        floor += increment
        increment += 500
    }
    return { floor, ceiling: floor + increment }
}

const DIFFICULTY_LABEL: Record<string, Difficulty> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" }

function truncateHint(text: string, max = 56): string {
    if (!text) return ""
    if (text.length <= max) return text
    return text.slice(0, text.slice(0, max).lastIndexOf(" ")) + "…"
}

const SECTOR_PATHS = ["Beginner", "Intermediate", "Expert"] as const

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

function SectionHead({ title, count, viewHref }: { title: string; count: string; viewHref?: string }) {
    return (
        <div className="flex items-center gap-3">
            <h2 className="font-dash-display text-[14.5px] font-semibold tracking-[-.015em] m-0">{title}</h2>
            <span className="font-dash-mono text-[11px] text-dash-text-faint">{count}</span>
            {viewHref && (
                <Link
                    href={viewHref}
                    className="ml-auto -mr-1.5 inline-flex items-center gap-1 text-[12.5px] text-dash-text-dim hover:text-dash-accent px-1.5 py-1 rounded-[6px] hover:bg-dash-surface-2 transition-colors"
                >
                    View curriculum
                    <ArrowRight className="size-3 stroke-2" />
                </Link>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════
export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [dashboardMissions, user, dailyChallengeQuestion] = await Promise.all([
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

    const dbOffline = user === null && dashboardMissions.length === 0
    const auraPoints = user?.auraPoints ?? 0

    // ─── Agent summary (real) ───
    const { floor, ceiling } = getLevelBounds(auraPoints)
    const agent: AgentSummary = {
        displayName: user?.name || session.user.name || "Anonymous",
        agentId: `CU-${session.user.id.substring(0, 7).toUpperCase()}`,
        rank: calculateAuraLevel(auraPoints),
        xpToNextRank: Math.max(0, ceiling - auraPoints),
        xpProgress: ceiling > floor ? (auraPoints - floor) / (ceiling - floor) : 1,
        auraPoints,
        streakDays: user?.comboStreak ?? 0,
    }

    // ─── Missions → clean Mission[] (real). See types.ts for why there's no
    // "running" state: accepting a mission redirects to /mission/[id] for the
    // actual gameplay, so there's no same-page in-progress state to model. ───
    const missions: Mission[] = dashboardMissions.map((m) => ({
        id: m.id,
        index: m.order,
        name: m.title,
        hint: truncateHint(m.description),
        ap: m.auraReward,
        difficulty: DIFFICULTY_LABEL[m.difficulty] ?? "Easy",
        state: m.status === "COMPLETED" ? "done" : m.status === "ACTIVE" ? "active" : "locked",
    }))

    const completedCount = missions.filter((m) => m.state === "done").length
    const apEarned = missions.filter((m) => m.state === "done").reduce((sum, m) => sum + m.ap, 0)
    const apAvailable = missions.filter((m) => m.state !== "done").reduce((sum, m) => sum + m.ap, 0)
    const nextMission = missions.find((m) => m.state === "active") ?? null

    // ─── Sectors. Only Alpha (the "standard" mission type queried above) has
    // real per-user progress on this page — Intermediate/Expert live under a
    // separate curriculum data source this page doesn't fetch. See mock.ts. ───
    const sectors: Sector[] = [
        {
            id: "alpha",
            codename: "Sector Alpha",
            title: "Beginner Curriculum",
            subtitle: "Level 1 · Output, variables, control flow",
            level: 1,
            locked: false,
            missionsTotal: missions.length,
            missionsDone: completedCount,
            apEarned,
        },
        {
            id: "beta",
            codename: "Sector Beta",
            title: "Intermediate Curriculum",
            subtitle: "Level 2 · Pointers, arrays, structs",
            level: 2,
            locked: true,
            unlockHint: `Complete all ${missions.length || 5} Alpha missions to unlock`,
            ...LOCKED_SECTOR_PLACEHOLDER,
        },
        {
            id: "gamma",
            codename: "Sector Gamma",
            title: "Expert Curriculum",
            subtitle: "Level 3 · Memory, files, recursion",
            level: 3,
            locked: true,
            unlockHint: "Complete all Beta missions to unlock",
            ...LOCKED_SECTOR_PLACEHOLDER,
        },
    ]
    const unlockedCount = sectors.filter((s) => !s.locked).length

    return (
        <div className="dash-theme flex min-h-[calc(100dvh-56px)] bg-dash-bg text-dash-text">
            {/* First-run intro modal + daily challenge popup — untouched, unrelated to this theme */}
            <MissionIntelStory />
            <DailyChallengeModal initialQuestion={dailyChallengeQuestion} />

            <ToastProvider>
                <Sidebar agent={agent} sectors={sectors} />

                <div className="flex-1 min-w-0 flex flex-col">
                    <Topbar agent={agent} />

                    <main className="max-w-[1320px] w-full mx-auto px-4 sm:px-5 py-6 flex flex-col gap-8">
                        {dbOffline && (
                            <div className="flex items-start gap-3 p-3 rounded-[10px] border border-dash-line-strong bg-dash-surface-2 shrink-0">
                                <AlertTriangle className="size-4 text-dash-text-dim shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-dash-text text-xs font-semibold m-0">Database connection offline</p>
                                    <p className="text-dash-text-faint text-[11px] mt-0.5 leading-tight m-0">
                                        Running in sandboxed demo state. Verify DATABASE_URL and network settings.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="dash-rise">
                            <HeroBriefing agent={agent} activeSector={sectors[0]} nextMission={nextMission} />
                        </div>

                        <div className="dash-rise flex flex-col gap-4" style={{ animationDelay: "60ms" }}>
                            <SectionHead title="Sectors" count={`${unlockedCount} of ${sectors.length} unlocked`} viewHref="/levels" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {sectors.map((sector, i) => (
                                    <SectorCard key={sector.id} sector={sector} href={`/levels?path=${SECTOR_PATHS[i]}`} />
                                ))}
                            </div>
                        </div>

                        <div className="dash-rise flex flex-col gap-4" style={{ animationDelay: "120ms" }}>
                            <SectionHead
                                title={`${sectors[0].codename} missions`}
                                count={`${completedCount} of ${missions.length} complete · ${apAvailable} AP available`}
                            />
                            <MissionTable missions={missions} />
                        </div>
                    </main>
                </div>

                <CommandPalette missions={missions} />
            </ToastProvider>
        </div>
    )
}
