import { db } from "@/lib/db"
import type { DashboardMission, MissionStatus } from "@/types"

/**
 * Get all missions with computed status for a specific user.
 * Logic:
 *  - Find all missions ordered by `order`.
 *  - Find all UserMission records for this user.
 *  - The first mission with no COMPLETED UserMission is ACTIVE.
 *  - Everything before it is COMPLETED.
 *  - Everything after it is LOCKED.
 */
export async function getDashboardMissions(
    userId: string
): Promise<DashboardMission[]> {
    const missions = await db.mission.findMany({
        orderBy: { order: "asc" },
    })

    const userMissions = await db.userMission.findMany({
        where: { userId },
    })

    // Build a lookup: missionId → status
    const statusMap = new Map<string, string>()
    for (const um of userMissions) {
        statusMap.set(um.missionId, um.status)
    }

    // Determine the index of the first non-completed mission
    let currentIndex = -1
    for (let i = 0; i < missions.length; i++) {
        const recorded = statusMap.get(missions[i].id)
        if (recorded !== "COMPLETED") {
            currentIndex = i
            break
        }
    }

    // If all are completed, currentIndex stays -1 (no active mission)
    return missions.map((mission, index): DashboardMission => {
        let status: MissionStatus

        if (currentIndex === -1) {
            // All missions completed
            status = "COMPLETED"
        } else if (index < currentIndex) {
            status = "COMPLETED"
        } else if (index === currentIndex) {
            status = "ACTIVE"
        } else {
            status = "LOCKED"
        }

        return {
            id: mission.id,
            order: mission.order,
            title: mission.title,
            description: mission.description,
            difficulty: mission.difficulty,
            language: mission.language,
            xpReward: mission.xpReward,
            status,
        }
    })
}

/**
 * Accept a mission: validates the mission is the user's current active one.
 * Creates or updates the UserMission record to ACTIVE.
 */
export async function acceptMission(
    userId: string,
    missionId: string
): Promise<{ success: boolean; error?: string }> {
    // Fetch the target mission
    const mission = await db.mission.findUnique({ where: { id: missionId } })
    if (!mission) {
        return { success: false, error: "Mission not found" }
    }

    // Get the user's dashboard to determine what's accessible
    const dashboardMissions = await getDashboardMissions(userId)
    const target = dashboardMissions.find((m) => m.id === missionId)

    if (!target) {
        return { success: false, error: "Mission not found" }
    }

    if (target.status === "LOCKED") {
        return { success: false, error: "Mission is locked. Complete previous missions first." }
    }

    if (target.status === "COMPLETED") {
        // Already completed — allow access but don't change status
        return { success: true }
    }

    // Status is ACTIVE — create/update the UserMission record
    await db.userMission.upsert({
        where: {
            userId_missionId: { userId, missionId },
        },
        update: {
            status: "ACTIVE",
            startedAt: new Date(),
        },
        create: {
            userId,
            missionId,
            status: "ACTIVE",
            startedAt: new Date(),
        },
    })

    console.log(`[MISSION] User ${userId} accepted mission ${missionId}`)
    return { success: true }
}

/**
 * Check if a user can access a specific mission (ACTIVE or COMPLETED only).
 */
export async function canAccessMission(
    userId: string,
    missionId: string
): Promise<boolean> {
    const dashboardMissions = await getDashboardMissions(userId)
    const target = dashboardMissions.find((m) => m.id === missionId)

    if (!target) return false
    return target.status === "ACTIVE" || target.status === "COMPLETED"
}

/**
 * Get a single mission by ID with full details.
 */
export async function getMissionById(missionId: string) {
    return db.mission.findUnique({ where: { id: missionId } })
}
