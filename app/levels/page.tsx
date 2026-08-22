import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { LevelsClient } from "./LevelsClient"
import { cached, cacheKeys } from "@/lib/cache"

const MISSIONS_TTL_SECONDS = 300

export default async function LevelsPage() {
    const session = await getServerSession(authOptions)

    // Backstop for the middleware gate. Signing in returns here because the
    // login link that sent you away carries this board as its callbackUrl.
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=%2Flevels")
    }

    const [missions, userMissions] = await Promise.all([
        // The mission catalogue is identical for every user and changes only
        // when content ships, so it caches globally with a long TTL. Per-user
        // progress below is deliberately NOT cached — it must reflect the
        // mission you just completed.
        cached(
            cacheKeys.missions(),
            MISSIONS_TTL_SECONDS,
            () => safeDbQuery(
                () => db.mission.findMany({
                    orderBy: { order: "asc" }
                }),
                [],
                "LevelsPage.missions"
            )
        ),
        safeDbQuery(
            () => db.userMission.findMany({
                where: { userId: session.user.id }
            }),
            [],
            "LevelsPage.userMissions"
        )
    ])

    // Map database missions to simpler structures
    const dbMissions = missions.map(m => ({
        id: m.id,
        order: m.order,
        title: m.title,
        description: m.description,
        difficulty: m.difficulty,
        auraReward: m.auraReward
    }))

    const mappedUserMissions = userMissions.map(um => ({
        id: um.id,
        missionId: um.missionId,
        status: um.status
    }))

    return (
        <Suspense fallback={<div className="min-h-screen bg-[#07080A] text-[#E2E8F0] flex items-center justify-center font-mono">Loading Curriculum...</div>}>
            <LevelsClient
                dbMissions={dbMissions}
                userMissions={mappedUserMissions}
            />
        </Suspense>
    )
}
