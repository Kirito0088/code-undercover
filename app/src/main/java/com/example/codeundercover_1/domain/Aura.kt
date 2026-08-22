package com.example.codeundercover_1.domain

/**
 * Direct port of `lib/aura.ts`.
 *
 * These numbers are duplicated rather than fetched because the server already
 * sends `auraPoints` and `auraLevel` on every payload — recomputing locally is
 * only used to draw progress toward the *next* bracket, which the API does not
 * expose. Keeping the brackets identical means the phone never disagrees with
 * the web about what level someone is.
 */
object Aura {

    // Point sources, matching the server constants.
    const val MISSION_COMPLETE = 100
    const val FIRST_ATTEMPT = 50
    const val FOX_INNOVATION = 150
    const val CORRECT_EXECUTION = 50
    const val HINT_PENALTY = 10

    /** Aura at which each level begins. */
    fun levelStart(level: Int): Int = when {
        level <= 1 -> 0
        level == 2 -> 200
        level == 3 -> 500
        level == 4 -> 1000
        level == 5 -> 2000
        else -> {
            // Level 6 opens at 3500, and each subsequent bracket is 500 wider
            // than the last: +2000, +2500, +3000 ...
            var threshold = 3500
            var increment = 2000
            var current = 6
            while (current < level) {
                threshold += increment
                increment += 500
                current++
            }
            threshold
        }
    }

    /** Port of `calculateAuraLevel`. */
    fun level(auraPoints: Int): Int {
        if (auraPoints < 200) return 1
        if (auraPoints < 500) return 2
        if (auraPoints < 1000) return 3
        if (auraPoints < 2000) return 4
        if (auraPoints < 3500) return 5

        var currentLevel = 5
        var currentThreshold = 3500
        var nextIncrement = 2000
        while (auraPoints >= currentThreshold) {
            currentLevel++
            currentThreshold += nextIncrement
            nextIncrement += 500
        }
        return currentLevel
    }

    /** Port of `calculateAgentRank`. */
    fun rank(auraPoints: Int): String = when {
        auraPoints >= 2500 -> "Platypus"
        auraPoints >= 1700 -> "Fox"
        auraPoints >= 1200 -> "Wolf"
        auraPoints >= 800 -> "Chameleon"
        auraPoints >= 500 -> "Eagle"
        auraPoints >= 300 -> "Octopus"
        auraPoints >= 150 -> "Raccoon"
        auraPoints >= 50 -> "Owl"
        else -> "Panda"
    }

    /** 0f..1f progress through the current level bracket. */
    fun levelProgress(auraPoints: Int): Float {
        val points = auraPoints.coerceAtLeast(0)
        val current = level(points)
        val start = levelStart(current)
        val next = levelStart(current + 1)
        val span = (next - start).coerceAtLeast(1)
        return ((points - start).toFloat() / span).coerceIn(0f, 1f)
    }

    /** Aura still needed to reach the next level. */
    fun pointsToNextLevel(auraPoints: Int): Int {
        val points = auraPoints.coerceAtLeast(0)
        return (levelStart(level(points) + 1) - points).coerceAtLeast(0)
    }
}
