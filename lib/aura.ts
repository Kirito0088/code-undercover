/**
 * Core constants for the Code Undercover Aura Progression System.
 */

// ─── AURA POINT SOURCES ───
export const AURA_MISSION_COMPLETE = 100
export const AURA_FIRST_ATTEMPT = 50
export const AURA_FOX_INNOVATION = 150
export const AURA_CORRECT_EXECUTION = 50
export const AURA_HINT_PENALTY = 10

/**
 * Calculates a user's Aura Level based on their total cumulative Aura Points.
 * The level brackets are progressively steeper.
 * 
 * Level 1: 0 - 199
 * Level 2: 200 - 499
 * Level 3: 500 - 999
 * Level 4: 1000 - 1999
 * Level 5: 2000 - 3499
 * Level N: ... 
 */
export function calculateAuraLevel(auraPoints: number): number {
    if (auraPoints < 0) return 1
    if (auraPoints < 200) return 1
    if (auraPoints < 500) return 2
    if (auraPoints < 1000) return 3
    if (auraPoints < 2000) return 4
    if (auraPoints < 3500) return 5

    // Extrapolate beyond Level 5 (adds 500 * level per bracket)
    // Level 6 -> 3500 - 5499 (+2000)
    // Level 7 -> 5500 - 7999 (+2500)
    let currentLevel = 5
    let currentThreshold = 3500
    let nextThresholdIncrement = 2000

    while (auraPoints >= currentThreshold) {
        currentLevel++
        currentThreshold += nextThresholdIncrement
        nextThresholdIncrement += 500
    }

    return currentLevel
}

/**
 * Returns the operative's designated rank based on their Aura Points.
 * Ranks progress from Panda (entry-level) to Platypus (highest).
 */
export function calculateAgentRank(auraPoints: number): string {
    if (auraPoints >= 2500) return "Platypus"
    if (auraPoints >= 1700) return "Fox"
    if (auraPoints >= 1200) return "Wolf"
    if (auraPoints >= 800) return "Chameleon"
    if (auraPoints >= 500) return "Eagle"
    if (auraPoints >= 300) return "Octopus"
    if (auraPoints >= 150) return "Raccoon"
    if (auraPoints >= 50) return "Owl"
    return "Panda"
}

/**
 * Returns visual styles (colors, glowing drop-shadows) associated with each rank.
 */
export function getRankBadgeStyles(rank: string): { colorText: string, shadow: string } {
    switch (rank) {
        case "Platypus": return { colorText: "text-amber-300", shadow: "drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]" }
        case "Fox": return { colorText: "text-orange-400", shadow: "drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" }
        case "Wolf": return { colorText: "text-gray-300", shadow: "drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]" }
        case "Chameleon": return { colorText: "text-purple-400", shadow: "drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" }
        case "Eagle": return { colorText: "text-blue-400", shadow: "drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" }
        case "Octopus": return { colorText: "text-teal-400", shadow: "drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]" }
        case "Raccoon": return { colorText: "text-gray-400", shadow: "drop-shadow-[0_0_8px_rgba(156,163,175,0.8)]" }
        case "Owl": return { colorText: "text-slate-500", shadow: "drop-shadow-[0_0_8px_rgba(100,116,139,0.8)]" }
        case "Panda": default: return { colorText: "text-gray-500", shadow: "" }
    }
}
