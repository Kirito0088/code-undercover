import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db, safeDbQuery } from "@/lib/db"
import { Terminal, Clock, Zap, Award, ChevronRight, Shield, Code2 } from "lucide-react"
import { HistoryCard } from "./HistoryCard"

export const metadata = {
    title: "Mission History | Code Undercover",
    description: "Review the code you wrote to complete each mission.",
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
                    select: { name: true, auraPoints: true, auraLevel: true, missionsCompleted: true },
                }),
            null,
            "HistoryPage.user"
        ),
    ])

    const totalAttempts = completedMissions.reduce((sum, m) => sum + m.attemptCount, 0)
    const totalAura = completedMissions.reduce((sum, m) => sum + m.auraReward, 0)
    const innovations = completedMissions.filter((m) => m.innovationUnlocked).length

    return (
        <div className="flex-1 bg-[#14141A] min-h-screen py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Clock className="size-5 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-[#F1F1F5] tracking-tight">
                                Mission History
                            </h1>
                            <p className="text-xs text-[#8B8BA7] mt-0.5">
                                User: {user?.name || session.user.name || "Unknown"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                {completedMissions.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-4 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="size-4 text-indigo-400" />
                                <span className="text-xs text-[#5C5C7A] font-medium">Missions Completed</span>
                            </div>
                            <span className="text-2xl font-semibold text-[#F1F1F5] font-mono">{completedMissions.length}</span>
                        </div>
                        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-4 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="size-4 text-indigo-400" />
                                <span className="text-xs text-[#5C5C7A] font-medium">Aura Earned</span>
                            </div>
                            <span className="text-2xl font-semibold text-[#F1F1F5] font-mono">{totalAura} AP</span>
                        </div>
                        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-4 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <Terminal className="size-4 text-indigo-400" />
                                <span className="text-xs text-[#5C5C7A] font-medium">Total Attempts</span>
                            </div>
                            <span className="text-2xl font-semibold text-[#F1F1F5] font-mono">{totalAttempts}</span>
                        </div>
                        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-4 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <Award className="size-4 text-indigo-400" />
                                <span className="text-xs text-[#5C5C7A] font-medium">Innovations</span>
                            </div>
                            <span className="text-2xl font-semibold text-[#F1F1F5] font-mono">{innovations}</span>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                {completedMissions.length > 0 ? (
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/30 via-[#323242] to-transparent" />

                        <div className="space-y-6">
                            {completedMissions.map((mission, index) => (
                                <div key={mission.id} className="relative flex gap-5">
                                    {/* Timeline node */}
                                    <div className="flex-shrink-0 relative z-10">
                                        <div className="size-[47px] rounded-full bg-[#14141A] border-2 border-indigo-500/30 flex items-center justify-center">
                                            <span className="text-[#39D375] font-mono text-xs font-semibold">
                                                {String(mission.missionOrder).padStart(2, "0")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div className="flex-1 min-w-0">
                                        <HistoryCard mission={mission} index={index} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* End cap */}
                        <div className="relative flex gap-5 mt-6">
                            <div className="flex-shrink-0 relative z-10">
                                <div className="size-[47px] rounded-full bg-[#14141A] border border-[#323242] flex items-center justify-center">
                                    <ChevronRight className="size-4 text-[#5C5C7A]" />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="text-[#5C5C7A] font-mono text-sm">More missions await…</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-24">
                        <div className="size-20 mx-auto mb-6 rounded-2xl bg-[#1C1C24] border border-[#323242] flex items-center justify-center">
                            <Code2 className="size-10 text-[#5C5C7A]" />
                        </div>
                        <h2 className="text-lg font-semibold text-[#F1F1F5] mb-2">No Missions Completed Yet</h2>
                        <p className="text-[#8B8BA7] text-xs max-w-sm mx-auto leading-relaxed">
                            Complete your first mission to see your code history here. Every solution you write will be preserved in your records.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            Go to Dashboard
                            <ChevronRight className="size-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
