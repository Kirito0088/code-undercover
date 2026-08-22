// Clearance gating — which of the three agent boards a player may open.
//
// The tiers are a ladder, not a menu: Agent Fox stays padlocked until every
// one of Agent Panda's cases is cleared, and Agent Platypus until Fox's are.
// The mission board enforces the same order level-by-level (LevelsClient
// unlocks the lowest uncleared global order); this module states the rule at
// the level of a whole board so the clearance cards can show it.

import { db, safeDbQuery } from "@/lib/db"
import { cached, cacheKeys } from "@/lib/cache"
import {
    BEGINNER_CURRICULUM,
    INTERMEDIATE_CURRICULUM,
    EXPERT_CURRICULUM,
    type LevelNode,
} from "@/app/levels/curriculum"

export type ClearanceTier = "Beginner" | "Intermediate" | "Pro"

export interface TierProgress {
    /** cases in this tier the player has cleared */
    completed: number
    /** cases in this tier in total */
    total: number
    unlocked: boolean
    /** the tier that has to be finished first — absent on the opening tier */
    requires?: ClearanceTier
}

export type ClearanceProgress = Record<ClearanceTier, TierProgress>

const MISSIONS_TTL_SECONDS = 300

const CURRICULUM: Record<ClearanceTier, LevelNode[]> = {
    Beginner: BEGINNER_CURRICULUM,
    Intermediate: INTERMEDIATE_CURRICULUM,
    Pro: EXPERT_CURRICULUM,
}

/** Read in order: each tier's key is opened by the tier named here. */
const PREREQUISITE: Record<ClearanceTier, ClearanceTier | undefined> = {
    Beginner: undefined,
    Intermediate: "Beginner",
    Pro: "Intermediate",
}

export const TIER_ORDER: ClearanceTier[] = ["Beginner", "Intermediate", "Pro"]

/**
 * What a signed-out visitor sees: nothing cleared, so only the opening board
 * is available. Also the shape every caller falls back to if the DB is down.
 */
export function emptyClearanceProgress(): ClearanceProgress {
    return buildProgress(() => 0)
}

/**
 * The gating rule on its own, given how many cases are cleared per tier.
 * Exported so the ladder can be tested without a database behind it.
 */
export function clearanceFromCounts(cleared: Record<ClearanceTier, number>): ClearanceProgress {
    return buildProgress((tier) => cleared[tier])
}

function buildProgress(completedIn: (tier: ClearanceTier) => number): ClearanceProgress {
    const progress = {} as ClearanceProgress

    for (const tier of TIER_ORDER) {
        const total = CURRICULUM[tier].length
        const completed = completedIn(tier)
        const requires = PREREQUISITE[tier]
        const gate = requires ? progress[requires] : undefined

        progress[tier] = {
            completed,
            total,
            // `gate.total > 0` matters: an unseeded curriculum would otherwise
            // read as "0 of 0 cleared" and swing every board open.
            unlocked: !gate || (gate.total > 0 && gate.completed >= gate.total),
            requires,
        }
    }

    return progress
}

/**
 * Per-tier progress for one player, or the signed-out view when `userId` is
 * omitted. Never throws: a DB failure degrades to "nothing cleared yet",
 * which locks boards rather than handing out clearance nobody earned.
 */
export async function getClearanceProgress(userId?: string): Promise<ClearanceProgress> {
    const [missions, completedMissions] = await Promise.all([
        // Same query and key as LevelsPage on purpose — one cached catalogue
        // shared by both, so the shapes must not diverge.
        cached(
            cacheKeys.missions(),
            MISSIONS_TTL_SECONDS,
            () => safeDbQuery(
                () => db.mission.findMany({ orderBy: { order: "asc" } }),
                [],
                "clearance.missions"
            )
        ),
        userId
            ? safeDbQuery(
                () => db.userMission.findMany({
                    where: { userId, status: "COMPLETED" },
                    select: { missionId: true },
                }),
                [],
                "clearance.userMissions"
            )
            : Promise.resolve([] as { missionId: string }[]),
    ])

    const missionIdByOrder = new Map(missions.map((m) => [m.order, m.id]))
    const clearedIds = new Set(completedMissions.map((um) => um.missionId))

    // Counted through the curriculum, not the UserMission rows: a level with no
    // seeded mission behind it can never be cleared, so it correctly holds the
    // next tier shut instead of being silently skipped.
    return buildProgress((tier) =>
        CURRICULUM[tier].reduce((n, lvl) => {
            const missionId = missionIdByOrder.get(lvl.order)
            return missionId && clearedIds.has(missionId) ? n + 1 : n
        }, 0)
    )
}
