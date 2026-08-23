package com.example.codeundercover_1.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Colours taken from the web app as it actually renders.
 *
 * There are deliberately two families here, because the web app has two:
 *
 *  - [Hud] mirrors the CSS custom properties (`--bg`, `--surface`, `--accent`
 *    …) that `HudPage`/`HudPanel` consume on every authenticated screen.
 *  - [Console] mirrors the literal hexes hard-coded in the auth pages and the
 *    older console surfaces (`#0D0E12`, `#1F261F`, `#8F9F8F` …).
 *
 * They are not unified here on purpose. Collapsing them into one scheme would
 * make the Android app disagree with the web on which screens are brass-on-
 * slate and which are green-on-near-black.
 */

/** `:root` in globals.css — what HudPage and HudPanel render against. */
object Hud {
    val bg = Color(0xFF2C3237)
    val surface = Color(0xFF37443E)
    val border = Color(0xFF5B3D2A)
    val text = Color(0xFFF4E7D3)
    val muted = Color(0xFF7E97A8)
    val accent = Color(0xFFB78742)
    val accentFg = Color(0xFFF4E7D3)

    /** rgba(183,135,66,α) — the accent used for glows, grid lines, brackets. */
    fun accentAlpha(alpha: Float) = accent.copy(alpha = alpha)

    /** Corner brackets and scanline grid tints, at the web's exact opacities. */
    val bracket = accentAlpha(0.40f)
    val gridLine = accentAlpha(0.04f)
    val panelGlow = accentAlpha(0.06f)
    val sweep = accentAlpha(0.05f)
}

/** Hard-coded hexes from the auth pages and console surfaces. */
object Console {
    val deep = Color(0xFF07080A)
    val panel = Color(0xFF0D0E12)
    val border = Color(0xFF1F261F)
    val borderHover = Color(0xFF2A3A2A)
    val hover = Color(0xFF181C18)
    val hoverAlt = Color(0xFF161820)
    val text = Color(0xFFE2E8F0)
    val muted = Color(0xFF8F9F8F)
    val placeholder = Color(0xFF4A5D4A)

    /** #39D375 — the green used for links on the auth screens. */
    val link = Color(0xFF39D375)

    // ─── Register intake terminal ───
    /** #6B6B6B — the mono uppercase field labels on the intake form. */
    val labelGray = Color(0xFF6B6B6B)

    /** #C9A84C — the gold CTA and link colour on the register flow. */
    val gold = Color(0xFFC9A84C)
    val goldHover = Color(0xFFB5953F)

    /** #161820 — disabled CTA fill. */
    val disabledFill = Color(0xFF161820)
}

/** Tailwind swatches referenced directly in the markup. */
object Semantic {
    val emerald500 = Color(0xFF10B981)
    val emerald400 = Color(0xFF34D399)
    val red400 = Color(0xFFF87171)
    val red500 = Color(0xFFEF4444)
    val amber400 = Color(0xFFFBBF24)
    val amber500 = Color(0xFFF59E0B)

    /** bg-red-500/10 + border-red-500/20 — the error banner treatment. */
    val errorFill = red500.copy(alpha = 0.10f)
    val errorBorder = red500.copy(alpha = 0.20f)

    val emeraldFill = emerald500.copy(alpha = 0.10f)
    val emeraldBorder = emerald500.copy(alpha = 0.20f)

    val amberFill = amber500.copy(alpha = 0.10f)
    val amberBorder = amber500.copy(alpha = 0.20f)
}

/**
 * Rank colours from `getRankBadgeStyles` in `lib/aura.ts`, resolved from the
 * Tailwind class names the web returns.
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

object DifficultyColors {
    fun forDifficulty(difficulty: String): Color = when (difficulty.uppercase()) {
        "EASY" -> Semantic.emerald400
        "MEDIUM" -> Semantic.amber400
        "HARD" -> Semantic.red400
        else -> Semantic.emerald400
    }
}
