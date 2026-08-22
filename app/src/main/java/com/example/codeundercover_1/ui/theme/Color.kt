package com.example.codeundercover_1.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Palette ported from the web app.
 *
 * Two families live here, and they behave differently on purpose:
 *
 *  - [DarkTokens] / [LightTokens] mirror the `--bg`/`--surface`/`--accent`
 *    custom properties in `app/globals.css`. These flip with the theme.
 *  - [Noir] mirrors the fixed hexes in `tailwind.config.ts`. Those surfaces are
 *    a painted set piece — chalkboard, cork, walnut, brass — and the web app
 *    deliberately keeps them constant in both themes. We do the same, so a
 *    corkboard reads as cork rather than inverting into something pale.
 */

/** `:root` in globals.css — the default (dark) theme. */
object DarkTokens {
    val bg = Color(0xFF2C3237)
    val surface = Color(0xFF37443E)
    val border = Color(0xFF5B3D2A)
    val text = Color(0xFFF4E7D3)
    val muted = Color(0xFF7E97A8)
    val accent = Color(0xFFB78742)
    val accentFg = Color(0xFFF4E7D3)
}

/** `.light` in globals.css. */
object LightTokens {
    val bg = Color(0xFFF4E7D3)
    val surface = Color(0xFFFFF8EC)
    val border = Color(0xFFD8B17A)
    val text = Color(0xFF1C2025)
    val muted = Color(0xFF5B3D2A)
    val accent = Color(0xFFC97626)
    val accentFg = Color(0xFFF4E7D3)
}

/** Fixed set-piece colours — identical in light and dark. */
object Noir {
    // Chalkboard
    val chalkboard = Color(0xFF17342A)
    val chalkboardMid = Color(0xFF204A3A)
    val chalkboardDeep = Color(0xFF0D2118)
    val bgMat = Color(0xFF0E2A1F)

    // Walnut / framing
    val walnut = Color(0xFF3B2A1C)
    val walnutLight = Color(0xFF5A4029)
    val walnutDeep = Color(0xFF1C1209)
    val frameWood = Color(0xFF4D2E17)

    // Brass
    val brass = Color(0xFFC9A24B)
    val brassBright = Color(0xFFF0CF8A)
    val brassDeep = Color(0xFF8A6B28)

    // Paper & ink
    val chalk = Color(0xFFF7F2E7)
    val note = Color(0xFFF6EFDC)
    val paper = Color(0xFFECDFC0)
    val paperLocked = Color(0xFFD5C7A9)
    val paperClear = Color(0xFFF4F1E4)
    val paperActive = Color(0xFFE8B54A)
    val paperEdge = Color(0x593C2814)
    val ink = Color(0xFF2F2A22)
    val inkMuted = Color(0xFF6A5C48)

    // Cork
    val corkBase = Color(0xFFB07D4F)
    val corkDark = Color(0xFF8C5F35)
    val corkDeep = Color(0xFF8B5C30)

    // Navigation chrome
    val navWoodHi = Color(0xFF4A3626)
    val navWoodLo = Color(0xFF3B2B1D)
    val navRule = Color(0xFFD9A441)
    val navText = Color(0xFFF0E4CE)

    // Signals
    val amber = Color(0xFFE8A545)
    val inkRed = Color(0xFF7A2E28)
    val inkRedBright = Color(0xFFA5453A)
    val moss = Color(0xFF46664A)
    val mossBright = Color(0xFF6D8F6F)
    val slate = Color(0xFF3D4A6B)
    val slateBright = Color(0xFF6B7A9E)
    val cleared = Color(0xFF2F7A3D)
    val pinRed = Color(0xFFC0392B)
    val threadLive = Color(0xFFC0392B)
    val threadDead = Color(0x8C782819)
    val ribbonGreen = Color(0xFF2F7D3A)
    val ribbonRed = Color(0xFFA8221E)
    val tapeGreen = Color(0xFFB9CDB6)
}

/**
 * Rank colours for the leaderboard, matching `getRankBadgeStyles` in
 * `lib/aura.ts`. The web returns Tailwind classes; these are the same swatches
 * resolved to hex so the ladder reads identically on both platforms.
 */
object RankColors {
    val platypus = Color(0xFFFCD34D)  // amber-300
    val fox = Color(0xFFFB923C)       // orange-400
    val wolf = Color(0xFFD1D5DB)      // gray-300
    val chameleon = Color(0xFFC084FC) // purple-400
    val eagle = Color(0xFF60A5FA)     // blue-400
    val octopus = Color(0xFF2DD4BF)   // teal-400
    val raccoon = Color(0xFF9CA3AF)   // gray-400
    val owl = Color(0xFF64748B)       // slate-500
    val panda = Color(0xFF6B7280)     // gray-500

    fun forRank(rank: String): Color = when (rank) {
        "Platypus" -> platypus
        "Fox" -> fox
        "Wolf" -> wolf
        "Chameleon" -> chameleon
        "Eagle" -> eagle
        "Octopus" -> octopus
        "Raccoon" -> raccoon
        "Owl" -> owl
        else -> panda
    }
}

/** Difficulty pill colours used on mission cards. */
object DifficultyColors {
    val easy = Noir.mossBright
    val medium = Noir.amber
    val hard = Noir.inkRedBright

    fun forDifficulty(difficulty: String): Color = when (difficulty.uppercase()) {
        "EASY" -> easy
        "MEDIUM" -> medium
        "HARD" -> hard
        else -> easy
    }
}
