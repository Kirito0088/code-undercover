import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { safeDbQuery } from "@/lib/db"
import { BugOff } from "lucide-react"
import { MissionCard } from "../dashboard/MissionCard"

export default async function DebugLabPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const missions = await safeDbQuery(
        () => getDashboardMissions(session.user.id, "debug"),
        [],
        "DebugLabPage"
    )

    // Removed unused user query

    const completedCount = missions.filter((m) => m.status === "COMPLETED").length
    const totalCount = missions.length
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <div className="flex-1 bg-[#14141A] py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-red-500 tracking-tight flex items-center gap-3">
                            <BugOff className="h-8 w-8" />
                            Debug Lab
                        </h1>
                        <p className="mt-1 text-xs text-[#8B8BA7]">
                            Fix broken modules. Earn Aura. Restore the system.
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 bg-[#1C1C24] rounded-xl p-5 border border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[#8B8BA7]">Debug Progress</span>
                        <span className="text-xs font-mono text-red-400">{completedCount}/{totalCount} Restored</span>
                    </div>
                    <div className="w-full bg-[#2A2A35] rounded-full h-1.5">
                        <div
                            className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
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
                        <BugOff className="h-12 w-12 text-[#3A3A52] mx-auto mb-4" />
                        <p className="text-[#8B8BA7] text-sm">No corrupted modules detected. The system is secure.</p>
                    </div>
                )}

            </div>
        </div>
    )
}
