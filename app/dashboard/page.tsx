import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { db, safeDbQuery } from "@/lib/db"
import { Terminal, AlertTriangle } from "lucide-react"
import { MissionCard } from "./MissionCard"
import { DailyChallenge } from "@/components/dashboard/DailyChallenge"
import { MissionIntelStory } from "./MissionIntelStory"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [missions, user] = await Promise.all([
        safeDbQuery(
            () => getDashboardMissions(session.user.id),
            [],
            "DashboardPage.missions"
        ),
        safeDbQuery(
            () => db.user.findUnique({
                where: { id: session.user.id },
                select: { auraPoints: true, auraLevel: true, name: true, email: true },
            }),
            null,
            "DashboardPage.user"
        ),
    ])

    const dbOffline = user === null && missions.length === 0

    const completedCount = missions.filter((m) => m.status === "COMPLETED").length
    const totalCount = missions.length
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <div className="flex-1 bg-black/40 py-10 relative">
            <MissionIntelStory />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* DB Offline Warning */}
                {dbOffline && (
                    <div className="mb-6 bg-yellow-900/30 border border-yellow-700 rounded-xl p-5 flex items-center gap-3">
                        <AlertTriangle className="size-6 text-yellow-400 flex-shrink-0" />
                        <div>
                            <p className="text-yellow-300 font-mono text-sm font-bold">DATABASE CONNECTION FAILED</p>
                            <p className="text-yellow-400/70 font-mono text-xs mt-1">
                                Unable to reach the database. Check your DATABASE_URL in .env and ensure MongoDB Atlas is accessible from your network.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-white tracking-tight">Mission Control</h1>
                        <p className="mt-1 text-sm text-gray-400 font-mono">
                            Agent: {user?.name || user?.email || session.user.name || "Unknown"} | Aura Lvl {user?.auraLevel ?? 1} | {user?.auraPoints ?? 0} AURA
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex size-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dbOffline ? 'bg-yellow-400' : 'bg-green-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full size-3 ${dbOffline ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        </span>
                        <span className={`text-sm font-mono tracking-wider ${dbOffline ? 'text-yellow-500' : 'text-green-500'}`}>
                            {dbOffline ? 'DB OFFLINE' : 'SYSTEM ONLINE'}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 bg-gray-900/60 rounded-xl p-5 border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-400">MISSION PROGRESS</span>
                        <span className="text-sm font-mono text-green-400">{completedCount}/{totalCount} COMPLETED</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                        <div
                            className="bg-gradient-to-r from-green-600 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                <DailyChallenge />

                {/* Mission Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {missions.map((mission) => (
                        <MissionCard key={mission.id} mission={mission} />
                    ))}
                </div>

                {missions.length === 0 && !dbOffline && (
                    <div className="text-center py-20">
                        <Terminal className="size-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-mono">No missions available. Check back soon, Agent.</p>
                    </div>
                )}

            </div>
        </div>
    )
}
