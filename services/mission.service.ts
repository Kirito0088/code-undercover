import { db } from "@/lib/db"
import { missions as missionData, missionDetails } from "@/src/data/missionsData"
import type { DashboardMission, MissionStatus } from "@/types"

// ─── Auto-seed guard ───
// Tracks whether we've already verified/seeded the Mission collection
// this server lifecycle. Prevents redundant checks on every request.
let missionsSeeded = false

/**
 * Ensures the Mission collection in the database is populated.
 * If the collection is empty, it auto-seeds from the static missionsData.ts.
 * This runs once per server lifecycle (cached via `missionsSeeded` flag).
 */
async function ensureMissionsSeeded(): Promise<void> {
    if (missionsSeeded) return

    try {
        const count = await db.mission.count()

        if (count === 0) {
            console.log("[MISSION] Mission collection is empty — auto-seeding from missionsData.ts...")

            for (const m of missionData) {
                const details = missionDetails[m.id]
                await db.mission.upsert({
                    where: { order: m.id },
                    update: {
                        title: m.title,
                        description: details?.description ?? "",
                        briefing: details?.briefing ?? "",
                        difficulty: m.difficulty,
                        language: m.language,
                        auraReward: m.aura,
                        teachingContent: m.teachingContent,
                    },
                    create: {
                        order: m.id,
                        title: m.title,
                        description: details?.description ?? "",
                        briefing: details?.briefing ?? "",
                        difficulty: m.difficulty,
                        language: m.language,
                        auraReward: m.aura,
                        teachingContent: m.teachingContent,
                    },
                })
                console.log(`[MISSION] Auto-seeded Mission #${m.id}: "${m.title}"`)
            }

            console.log(`[MISSION] Auto-seed complete. ${missionData.length} missions ready.`)
        } else {
            console.log(`[MISSION] Mission collection already has ${count} entries — skipping auto-seed.`)
        }

        missionsSeeded = true
    } catch (error) {
        // Don't set missionsSeeded = true on error, so it retries next request
        console.error("[MISSION] Auto-seed failed:", error)
    }
}

/**
 * Get all missions with computed status for a specific user.
 * Logic:
 *  - Ensure missions exist in DB (auto-seed if empty).
 *  - Find all missions ordered by `order`.
 *  - Find all UserMission records for this user.
 *  - The first mission with no COMPLETED UserMission is ACTIVE.
 *  - Everything before it is COMPLETED.
 *  - Everything after it is LOCKED.
 */
export async function getDashboardMissions(
    userId: string,
    missionType: string = "standard"
): Promise<DashboardMission[]> {
    // Ensure missions are seeded before querying
    await ensureMissionsSeeded()

    const missions = await db.mission.findMany({
        where: { type: missionType },
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
            type: mission.type,
            goal: mission.goal,
            auraReward: mission.auraReward,
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
    const dashboardMissions = await getDashboardMissions(userId, mission.type)
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
    const mission = await db.mission.findUnique({ where: { id: missionId } })
    if (!mission) return false

    const dashboardMissions = await getDashboardMissions(userId, mission.type)
    const target = dashboardMissions.find((m) => m.id === missionId)

    if (!target) return false
    return target.status === "ACTIVE" || target.status === "COMPLETED"
}

/**
 * Get a single mission by ID with full details.
 */
export async function getMissionById(missionId: string) {
    // Ensure missions exist before looking one up
    await ensureMissionsSeeded()
    return db.mission.findUnique({ where: { id: missionId } })
}
