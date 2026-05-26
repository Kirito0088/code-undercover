import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { calculateAgentRank } from "@/lib/aura"
import { LevelsClient } from "./LevelsClient"

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

export default async function LevelsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [missions, user, userMissions] = await Promise.all([
        safeDbQuery(
            () => db.mission.findMany({
                orderBy: { order: "asc" }
            }),
            [],
            "LevelsPage.missions"
        ),
        safeDbQuery(
            () => db.user.findUnique({
                where: { id: session.user.id },
                select: { auraPoints: true, auraLevel: true, name: true, email: true, comboStreak: true, foxBadges: true },
            }),
            null,
            "LevelsPage.user"
        ),
        safeDbQuery(
            () => db.userMission.findMany({
                where: { userId: session.user.id }
            }),
            [],
            "LevelsPage.userMissions"
        )
    ])

    const currentRank = calculateAgentRank(user?.auraPoints ?? 0)
    const { nextThreshold } = getNextRankThreshold(user?.auraPoints ?? 0)

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
        <LevelsClient
            user={user}
            dbMissions={dbMissions}
            userMissions={mappedUserMissions}
            currentRank={currentRank}
            nextThreshold={nextThreshold}
        />
    )
}
