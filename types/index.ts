// ─── Mission Status ───
export type MissionStatus = "LOCKED" | "ACTIVE" | "COMPLETED"

// ─── Mission (from DB) ───
export interface MissionRecord {
    id: string
    order: number
    title: string
    description: string
    briefing: string
    difficulty: string
    language: string
    xpReward: number
    teachingContent: string | null
    mcqContent: string | null
    validationRules: string | null
    createdAt: Date
    updatedAt: Date
}

// ─── UserMission (from DB) ───
export interface UserMissionRecord {
    id: string
    userId: string
    missionId: string
    status: string
    phase: string
    hintsUsed: number
    attemptCount: number
    innovationUnlocked: boolean
    startedAt: Date | null
    completedAt: Date | null
}

// ─── Dashboard mission (mission + computed user status) ───
export interface DashboardMission {
    id: string
    order: number
    title: string
    description: string
    difficulty: string
    language: string
    xpReward: number
    status: MissionStatus
}

// ─── User profile for dashboard ───
export interface UserProfile {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    xp: number
    level: number
}
