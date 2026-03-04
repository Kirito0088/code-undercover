import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { BugOff } from "lucide-react"
import { MissionCard } from "../dashboard/MissionCard"

export default async function DebugLabPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const missions = await getDashboardMissions(session.user.id, "debug")

    // Removed unused user query

    const completedCount = missions.filter((m) => m.status === "COMPLETED").length
    const totalCount = missions.length
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <div className="flex-1 bg-black/40 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-red-500 tracking-tight flex items-center gap-3">
                            <BugOff className="h-8 w-8" />
                            Debug Lab
                        </h1>
                        <p className="mt-1 text-sm text-gray-400 font-mono">
                            Fix broken modules. Earn Aura. Restore the system.
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 bg-gray-900/60 rounded-xl p-5 border border-red-900/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-400">DEBUG PROGRESS</span>
                        <span className="text-sm font-mono text-red-400">{completedCount}/{totalCount} RESTORED</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                        <div
                            className="bg-gradient-to-r from-red-600 to-orange-400 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                {/* Mission Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {missions.map((mission) => (
                        <MissionCard key={mission.id} mission={mission} />
                    ))}
                </div>

                {missions.length === 0 && (
                    <div className="text-center py-20">
                        <BugOff className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-mono">No corrupted modules detected. The system is secure.</p>
                    </div>
                )}

            </div>
        </div>
    )
}
