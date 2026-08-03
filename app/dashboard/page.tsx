import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { db, safeDbQuery } from "@/lib/db"
import {
    AlertTriangle,
    Shield,
    Zap,
    Bolt,
    Play,
    BookOpen,
    ArrowRight
} from "lucide-react"
import { type DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"
import { DailyChallengeModal } from "@/components/dashboard/DailyChallengeModalLazy"
import { MissionIntelStory } from "./MissionIntelStory"
import { MissionRecord, UserMissionRecord } from "@/types"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"
import { HudPage } from "@/components/hud/HudPage"
import { HudPanel } from "@/components/hud/HudPanel"
import { HudMetric } from "@/components/hud/HudMetric"
import { HudNav } from "@/components/hud/HudNav"

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

function NetworkStatus({ dbOffline }: { dbOffline: boolean }) {
    return (
        <div className="flex items-center gap-2 bg-[#07080A] border border-[#1F261F] px-3 py-2 rounded-lg text-xs select-none min-h-11">
            <span className="relative flex size-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dbOffline ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full size-2.5 ${dbOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className={`text-[10px] tracking-wider ${dbOffline ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                {dbOffline ? 'DB_DISCONNECTED' : 'NETWORK_SECURE'}
            </span>
        </div>
    )
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
    const { nextThreshold } = getNextRankThreshold(user?.auraPoints ?? 0)

    const rankStyles = getRankBadgeStyles(currentRank)

    return (
        <HudPage
            eyebrow="MISSION_DECK // OPERATIVE_HUD"
            title="Mission Control"
            subtitle="Select active module and decrypt sectors to progress through the curriculum."
            status={<NetworkStatus dbOffline={dbOffline} />}
        >
            <MissionIntelStory />
            <DailyChallengeModal initialQuestion={dailyChallengeQuestion} />

            {dbOffline && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-3 flex items-start gap-3 shrink-0 z-10">
                    <AlertTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                        <p className="text-amber-500 font-mono text-xs font-bold">DATABASE CONNECTION OFFLINE</p>
                        <p className="text-amber-500/70 font-mono text-[11px] mt-0.5 leading-tight">
                            Systems are running in sandboxed demo state. Unable to reach active database. Verify network environment settings and DATABASE_URL connection status.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content Grid Filling 100dvh */}
            <main className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-3 min-h-0">

                {/* CARD 1: Operative Dossier */}
                <HudPanel radius="lg" className="lg:col-span-5 md:col-span-6 p-4 flex flex-col justify-between min-h-0">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* 96px Avatar Square with 4 Corner Brackets */}
                        <div className="relative group/avatar shrink-0">
                            <span className="absolute -top-1 -left-1 size-3 border-t border-l border-emerald-500/60 pointer-events-none"></span>
                            <span className="absolute -top-1 -right-1 size-3 border-t border-r border-emerald-500/60 pointer-events-none"></span>
                            <span className="absolute -bottom-1 -left-1 size-3 border-b border-l border-emerald-500/60 pointer-events-none"></span>
                            <span className="absolute -bottom-1 -right-1 size-3 border-b border-r border-emerald-500/60 pointer-events-none"></span>

                            <div className="size-24 bg-emerald-950/40 rounded-md border border-emerald-500/40 flex items-center justify-center text-4xl font-mono font-bold text-emerald-400 select-none shadow-inner">
                                {(user?.name || session.user.name || "U")[0].toUpperCase()}
                            </div>
                        </div>

                        <div className="flex-grow w-full text-left flex flex-col justify-between min-w-0">
                            <div>
                                <div className="flex justify-between items-center border-b border-[#1F261F] pb-1 font-mono text-[9px] text-[#4A5D4A] mb-1.5">
                                    <span>SYS.OP // CODE</span>
                                    <span>ID: {session.user.id.substring(0, 8).toUpperCase()}</span>
                                </div>
                                <span className="text-[9px] font-mono tracking-widest text-[#4A5D4A] uppercase block">AGENT CODENAME</span>
                                <h2 className="text-base font-mono font-bold text-[#E2E8F0] truncate tracking-wide">
                                    {user?.name || session.user.name || "Anonymous"}
                                </h2>

                                <div className="inline-flex items-center gap-1.5 mt-1 bg-[#161820]/50 border border-[#1F261F] px-2 py-0.5 rounded-sm">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-mono text-[#8F9F8F]">
                                        Clearance: <span className={`${rankStyles.colorText} ${rankStyles.shadow}`}>{currentRank}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Segmented Rank Progress Bar (20 blocks) */}
                    <div className="mt-3 w-full">
                        <div className="flex justify-between text-[9px] font-mono text-[#8F9F8F] mb-1">
                            <span>RANK PROGRESS</span>
                            <span className="text-emerald-400">{Math.round(Math.min(100, ((user?.auraPoints ?? 0) / nextThreshold) * 100))}%</span>
                        </div>

                        <div className="flex gap-1 h-1.5 w-full">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const isFilled = i < Math.min(20, Math.floor(((user?.auraPoints ?? 0) / nextThreshold) * 20));
                                return (
                                    <div
                                        key={i}
                                        className={`h-full flex-1 rounded-none transition-all duration-300 ${
                                            isFilled ? 'bg-emerald-400' : 'bg-emerald-950'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </HudPanel>

                {/* CARD 2: Console Navigation channels */}
                <HudNav active="dashboard" className="lg:col-span-4 md:col-span-3" />

                {/* CARD 3: Intelligence Readout */}
                <HudPanel radius="lg" className="lg:col-span-3 md:col-span-3 p-4 flex flex-col justify-between gap-2 text-left min-h-0">
                    <h3 className="text-[10px] font-mono font-bold text-[#4A5D4A] uppercase tracking-wider border-b border-[#1F261F] pb-1 select-none">INTELLIGENCE READOUT</h3>
                    <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#8F9F8F]">RESOLVED</span>
                        <span className="font-bold text-[#E2E8F0]">{completedCount}/{totalCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#8F9F8F]">COMBO</span>
                        <span className="font-bold text-amber-500">x{user?.comboStreak ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#8F9F8F]">INSIGNIAS</span>
                        <span className="font-bold text-emerald-400">{user?.foxBadges ?? 0}</span>
                    </div>
                </HudPanel>

                {/* CARD 4: Campaign Decryption Rate Gauge */}
                <HudPanel radius="lg" className="lg:col-span-5 md:col-span-6 p-4 flex flex-col justify-between min-h-0">
                    <div className="flex justify-between items-end mb-2 text-left">
                        <div>
                            <span className="text-[9px] font-mono tracking-widest text-[#4A5D4A] uppercase block select-none">Campaign Rate</span>
                            <h3 className="text-xs font-bold font-mono text-[#E2E8F0] mt-0.5">SYSTEM DECRYPTION STATUS</h3>
                        </div>
                        <span className="text-sm font-mono font-bold text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">{progressPercent}%</span>
                    </div>

                    {/* Segmented Ticks (24 blocks) */}
                    <div className="flex gap-1 h-1.5 w-full my-1">
                        {Array.from({ length: 24 }).map((_, i) => {
                            const isFilled = i < Math.round((progressPercent / 100) * 24);
                            return (
                                <div
                                    key={i}
                                    className={`h-full flex-1 rounded-none transition-all duration-300 ${
                                        isFilled ? 'bg-emerald-400' : 'bg-neutral-800'
                                    }`}
                                />
                            );
                        })}
                    </div>

                    <div className="flex justify-between font-mono text-[8px] text-[#4A5D4A] select-none">
                        <span>SECTOR: GENERAL</span>
                        <span>{completedCount} OF {totalCount} DECRYPTED</span>
                    </div>
                </HudPanel>

                {/* CARDS 5-6: Operational AP & Field Classif */}
                <HudMetric
                    icon={Bolt}
                    label="OPERATIONAL AP"
                    value={`${user?.auraPoints ?? 0} AP`}
                    hint="Total Aura Points"
                    tag="HUD_AURA"
                    className="lg:col-span-4 md:col-span-3 hover:border-emerald-500/30"
                />

                <HudMetric
                    icon={Shield}
                    label="FIELD CLASSIF"
                    value={currentRank}
                    hint="Operative Rating"
                    tag="HUD_RANK"
                    iconClass={rankStyles.colorText}
                    className="lg:col-span-3 md:col-span-3 hover:border-emerald-500/30"
                />

                {/* Operational Sectors / Curriculum Cards */}
                <div className="lg:col-span-12 md:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
                    {[
                        {
                            path: "Beginner",
                            name: "Sector Alpha",
                            title: "Beginner Curriculum",
                            desc: "Sequential C fundamentals and logic structures. Master basic syntax, variable declarations, and fundamental operators.",
                            clearance: "LEVEL 1 (UNRESTRICTED)",
                            color: "text-emerald-400",
                            bg: "bg-emerald-950/10 border-emerald-500/20",
                            icon: BookOpen
                        },
                        {
                            path: "Intermediate",
                            name: "Sector Beta",
                            title: "Intermediate Curriculum",
                            desc: "Solve complex C challenges with loops, control flow, pointers, memory addresses, and data structures.",
                            clearance: "LEVEL 2 (RESTRICTED)",
                            color: "text-emerald-400",
                            bg: "bg-emerald-950/10 border-emerald-500/20",
                            icon: Play
                        },
                        {
                            path: "Expert",
                            name: "Sector Gamma",
                            title: "Expert Curriculum",
                            desc: "Conquer advanced algorithm design, memory security audits, recursive compiler optimizations, and low-level performance.",
                            clearance: "LEVEL 3 (CLASSIFIED)",
                            color: "text-amber-500",
                            bg: "bg-amber-950/10 border-amber-500/20",
                            icon: Zap
                        }
                    ].map((sector) => {
                        const IconComp = sector.icon;
                        return (
                            <Link
                                key={sector.path}
                                href={`/levels?path=${sector.path}`}
                                className="group relative overflow-hidden bg-[#0D0E12] border border-[#1F261F] rounded-lg p-4 hover:border-emerald-500/30 transition-all duration-200 flex flex-col cursor-pointer justify-between min-h-0"
                            >
                                <div className="absolute top-0 right-0 size-32 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-2">
                                    <div className="size-9 bg-[#161820] rounded-sm flex items-center justify-center border border-[#1F261F] group-hover:border-emerald-500/30 shadow-inner">
                                        <IconComp className="size-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                                    </div>
                                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${sector.bg} ${sector.color} tracking-wider`}>
                                        {sector.clearance}
                                    </span>
                                </div>

                                <div className="text-left">
                                    <span className="text-[9px] font-mono text-[#4A5D4A] uppercase block select-none">{sector.name}</span>
                                    <h3 className="text-sm font-bold font-mono text-[#E2E8F0] mt-0.5 mb-1 group-hover:text-emerald-400 transition-colors tracking-tight">
                                        {sector.title}
                                    </h3>
                                    <p className="text-[11px] text-[#8F9F8F] leading-snug font-sans line-clamp-2">
                                        {sector.desc}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#4A5D4A] group-hover:text-emerald-400 transition-colors border-t border-[#1F261F] pt-2.5 mt-3">
                                    <span>LAUNCH OPERATIVE DECK</span>
                                    <ArrowRight className="size-3.5 transform translate-x-0 group-hover:translate-x-1 transition-transform duration-200" />
                                </div>
                            </Link>
                        );
                    })}
                </div>

            </main>
        </HudPage>
    )
}
