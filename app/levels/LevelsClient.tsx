"use client"

import type { MissionStatus } from "@/types"
import { useSearchParams } from "next/navigation"
import { LevelNode, BEGINNER_CURRICULUM, INTERMEDIATE_CURRICULUM, EXPERT_CURRICULUM } from "./curriculum"
import { MissionCorkboard } from "@/components/levels/MissionCorkboard"

interface LevelsClientProps {
    dbMissions: {
        id: string
        order: number
        title: string
        description: string
        difficulty: string
        auraReward: number
    }[]
    userMissions: {
        id: string
        missionId: string
        status: string
    }[]
}

export function LevelsClient({
    dbMissions,
    userMissions,
}: LevelsClientProps) {
    const searchParams = useSearchParams()
    const pathParam = searchParams ? searchParams.get('path') : null

    // Compute activePath inline from URL param to avoid Derived value copied into state (no-derived-state)
    const activePath: 'Beginner' | 'Intermediate' | 'Expert' =
        (pathParam === 'Beginner' || pathParam === 'Intermediate' || pathParam === 'Expert')
            ? pathParam
            : 'Beginner'

    const userMissionsMap = new Map(userMissions.map((um) => [um.missionId, um]))

    // Get levels for the active path, injecting the dynamic realId from dbMissions
    const getLevelsList = (): LevelNode[] => {
        const baseCurriculum = activePath === 'Beginner'
            ? BEGINNER_CURRICULUM
            : activePath === 'Intermediate'
            ? INTERMEDIATE_CURRICULUM
            : EXPERT_CURRICULUM

        return baseCurriculum.map(lvl => {
            const dbMatch = dbMissions.find(m => m.order === lvl.order)
            if (dbMatch) {
                return { ...lvl, realId: dbMatch.id }
            }
            return lvl
        })
    }

    const currentLevels = getLevelsList()

    // Solve the status for a level node using global-order sequential unlock,
    // mirroring the dashboard mission service: the lowest-order non-completed
    // mission is ACTIVE, everything before it is COMPLETED, everything after is LOCKED.
    const getLevelStatus = (lvl: LevelNode): {
        status: MissionStatus
        isLocked: boolean
        realMissionId?: string
    } => {
        if (!lvl.realId) {
            return { status: "LOCKED", isLocked: true }
        }

        const um = userMissionsMap.get(lvl.realId)
        const status = (um?.status || "LOCKED") as MissionStatus

        if (status === "COMPLETED") {
            return { status, isLocked: false, realMissionId: lvl.realId }
        }

        // Find the lowest global order across ALL real missions that is not completed.
        const allMissions = [...BEGINNER_CURRICULUM, ...INTERMEDIATE_CURRICULUM, ...EXPERT_CURRICULUM]
        const unresolved = allMissions
            .map(m => {
                const dbMatch = dbMissions.find(x => x.order === m.order)
                if (!dbMatch) return { order: m.order, completed: true }
                return { order: m.order, completed: userMissionsMap.get(dbMatch.id)?.status === "COMPLETED" }
            })
            .filter(x => !x.completed)
            .sort((a, b) => a.order - b.order)

        const nextActiveOrder = unresolved.length > 0 ? unresolved[0].order : Infinity

        if (lvl.order === nextActiveOrder) {
            return { status: "ACTIVE", isLocked: false, realMissionId: lvl.realId }
        }

        return { status: "LOCKED", isLocked: true, realMissionId: lvl.realId }
    }

    // The mission board is a full-bleed set piece (its own chalkboard wall,
    // cork frame, legend and back tab), so it replaces the HUD chrome here
    // rather than sitting inside it.
    return (
        <MissionCorkboard
            levels={currentLevels.map((lvl) => ({ lvl, ...getLevelStatus(lvl) }))}
            activePath={activePath}
        />
    )
}
