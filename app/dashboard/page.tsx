import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { db } from "@/lib/db"
import { Terminal } from "lucide-react"
import { MissionCard } from "./MissionCard"
import { DailyChallenge } from "@/components/dashboard/DailyChallenge"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const missions = await getDashboardMissions(session.user.id)

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { auraPoints: true, auraLevel: true, name: true, email: true },
    })

    const completedCount = missions.filter((m) => m.status === "COMPLETED").length
    const totalCount = missions.length
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <div className="flex-1 bg-black/40 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Mission Control</h1>
                        <p className="mt-1 text-sm text-gray-400 font-mono">
                            Agent: {user?.name || user?.email} | Aura Lvl {user?.auraLevel ?? 1} | {user?.auraPoints ?? 0} AURA
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-mono tracking-wider text-green-500">SYSTEM ONLINE</span>
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

                {missions.length === 0 && (
                    <div className="text-center py-20">
                        <Terminal className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-mono">No missions available. Check back soon, Agent.</p>
                    </div>
                )}

            </div>
        </div>
    )
}
