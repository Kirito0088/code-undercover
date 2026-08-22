package com.example.codeundercover_1

import com.example.codeundercover_1.domain.Aura
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Parity checks against `lib/aura.test.ts`. If the Kotlin port and the
 * TypeScript original ever disagree, a phone and a browser would show the same
 * agent at different levels — these cases are what stop that drifting silently.
 */
class AuraTest {

    @Test
    fun `floors negative points to level 1`() {
        assertEquals(1, Aura.level(-100))
        assertEquals(1, Aura.level(0))
    }

    @Test
    fun `maps documented bracket boundaries to the right level`() {
        // Each pair is (points, expected level), taken from the brackets
        // documented in lib/aura.ts.
        val cases = listOf(
            0 to 1, 199 to 1,
            200 to 2, 499 to 2,
            500 to 3, 999 to 3,
            1000 to 4, 1999 to 4,
            2000 to 5, 3499 to 5,
            3500 to 6, 5499 to 6,
            5500 to 7, 7999 to 7,
            8000 to 8,
        )
        cases.forEach { (points, expected) ->
            assertEquals("points=$points", expected, Aura.level(points))
        }
    }

    @Test
    fun `keeps extrapolating for very high totals without hanging`() {
        val level = Aura.level(10_000_000)
        assertTrue(level > 5)
    }

    @Test
    fun `is monotonically non-decreasing as points increase`() {
        var previous = 1
        var points = 0
        while (points <= 12_000) {
            val level = Aura.level(points)
            assertTrue("regressed at $points", level >= previous)
            previous = level
            points += 50
        }
    }

    @Test
    fun `maps rank thresholds exactly`() {
        val cases = listOf(
            0 to "Panda", 49 to "Panda",
            50 to "Owl", 149 to "Owl",
            150 to "Raccoon", 299 to "Raccoon",
            300 to "Octopus", 499 to "Octopus",
            500 to "Eagle", 799 to "Eagle",
            800 to "Chameleon", 1199 to "Chameleon",
            1200 to "Wolf", 1699 to "Wolf",
            1700 to "Fox", 2499 to "Fox",
            2500 to "Platypus", 99_999 to "Platypus",
        )
        cases.forEach { (points, expected) ->
            assertEquals("points=$points", expected, Aura.rank(points))
        }
    }

    @Test
    fun `level progress stays within bounds and tracks the bracket`() {
        assertEquals(0f, Aura.levelProgress(0), 0.001f)
        // Level 2 spans 200..499, so 350 is halfway.
        assertEquals(0.5f, Aura.levelProgress(350), 0.01f)
        assertTrue(Aura.levelProgress(-5) in 0f..1f)
        assertTrue(Aura.levelProgress(1_000_000) in 0f..1f)
    }

    @Test
    fun `points to next level reaches zero exactly at the boundary`() {
        assertEquals(200, Aura.pointsToNextLevel(0))
        assertEquals(1, Aura.pointsToNextLevel(199))
        assertEquals(300, Aura.pointsToNextLevel(200))
    }
}
