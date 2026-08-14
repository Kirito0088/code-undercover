// ─── Compiler Types ───
export interface CompilerDiagnostic {
    line: number
    column: number
    type: "error" | "warning" | "note"
    message: string
    rawContext: string
    endLine?: number      // from locations[0].finish — for Monaco range markers
    endColumn?: number
    children?: CompilerDiagnostic[]  // nested GCC diagnostics (notes attached to a parent error)
}

/**
 * Canonical mission status vocabulary.
 * This matches the values written and read from the UserMission DB table.
 * Do NOT introduce new values here without updating mission.service.ts and LevelsClient.tsx.
 * UI-only states (e.g. "SIMULATION") live only in LevelsClient and are not persisted.
 */
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
    type: string
    goal: string | null
    startingCode: string | null
    auraReward: number
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
    submittedCode: string | null
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
    type: string
    goal: string | null
    auraReward: number
    status: MissionStatus
}

// ─── User profile for dashboard ───
export interface UserProfile {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    auraPoints: number
    auraLevel: number
}
