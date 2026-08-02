// Real states only — mapped 1:1 from the DB's LOCKED/ACTIVE/COMPLETED.
// The reference design's fourth state ("running", with a client-only Continue/complete
// flow) doesn't have a backend behind it: accepting a mission redirects to /mission/[id]
// for the actual gameplay, so there's no same-page "in progress" state to represent.
export type MissionState = "locked" | "active" | "done"
export type Difficulty = "Easy" | "Medium" | "Hard"

export interface Mission {
    id: string
    index: number // 1-based; render zero-padded, "01"
    name: string
    hint: string
    ap: number
    difficulty: Difficulty
    state: MissionState
}

export interface Sector {
    id: string
    codename: string // "Sector Alpha"
    title: string // "Beginner Curriculum"
    subtitle: string // "Level 1 · Output, variables, control flow"
    level: 1 | 2 | 3
    locked: boolean
    unlockHint?: string // "Complete all 5 Alpha missions to unlock"
    missionsTotal: number
    missionsDone: number
    apEarned: number
}

export interface AgentSummary {
    displayName: string
    agentId: string // "CU-2XU9084"
    rank: number
    xpToNextRank: number
    xpProgress: number // 0–1
    auraPoints: number
    streakDays: number
}
