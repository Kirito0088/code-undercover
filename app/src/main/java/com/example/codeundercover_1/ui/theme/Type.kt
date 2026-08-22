package com.example.codeundercover_1.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.example.codeundercover_1.R

/**
 * The web app leans on three faces (`lib/detective-fonts.ts`): Special Elite
 * for typewritten headings, Kalam for chalk annotations, and a monospace for
 * code.
 *
 * We ship the same two display faces, but body copy deliberately uses the
 * platform sans rather than a typewriter face. On a phone held at arm's length
 * Special Elite's distressed strokes cost real legibility at 14–16sp, and the
 * mission briefings are long-form reading. Headings keep the character; the
 * paragraphs stay readable.
 */

val SpecialElite = FontFamily(Font(R.font.special_elite, FontWeight.Normal))

val Kalam = FontFamily(
    Font(R.font.kalam_regular, FontWeight.Normal),
    Font(R.font.kalam_bold, FontWeight.Bold),
)

/** Code, terminal output and compiler logs. */
val CodeFont = FontFamily.Monospace

private val Sans = FontFamily.Default

val AppTypography = Typography(
    // ─── Display: dossier covers, mission numbers ───
    displayLarge = TextStyle(
        fontFamily = SpecialElite,
        fontWeight = FontWeight.Normal,
        fontSize = 44.sp,
        lineHeight = 52.sp,
        letterSpacing = 0.sp,
    ),
    displayMedium = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 34.sp,
        lineHeight = 42.sp,
    ),
    displaySmall = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 28.sp,
        lineHeight = 36.sp,
    ),

    // ─── Headline: screen titles ───
    headlineLarge = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 26.sp,
        lineHeight = 34.sp,
        letterSpacing = 0.4.sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 22.sp,
        lineHeight = 30.sp,
        letterSpacing = 0.4.sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 19.sp,
        lineHeight = 26.sp,
        letterSpacing = 0.3.sp,
    ),

    // ─── Title: card headers ───
    titleLarge = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 18.sp,
        lineHeight = 25.sp,
        letterSpacing = 0.2.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = Sans,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 23.sp,
        letterSpacing = 0.1.sp,
    ),
    titleSmall = TextStyle(
        fontFamily = Sans,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),

    // ─── Body: briefings, descriptions ───
    bodyLarge = TextStyle(
        fontFamily = Sans,
        fontSize = 16.sp,
        lineHeight = 25.sp,
        letterSpacing = 0.15.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = Sans,
        fontSize = 14.sp,
        lineHeight = 21.sp,
        letterSpacing = 0.2.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = Sans,
        fontSize = 12.sp,
        lineHeight = 17.sp,
        letterSpacing = 0.3.sp,
    ),

    // ─── Label: buttons, chips, stamps ───
    labelLarge = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 15.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.8.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 13.sp,
        lineHeight = 17.sp,
        letterSpacing = 0.7.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = SpecialElite,
        fontSize = 11.sp,
        lineHeight = 15.sp,
        letterSpacing = 0.6.sp,
    ),
)

/** Chalk-scrawl style for annotations and hint callouts. */
val ChalkStyle = TextStyle(
    fontFamily = Kalam,
    fontSize = 17.sp,
    lineHeight = 25.sp,
)

/** Editor / terminal style. */
val CodeStyle = TextStyle(
    fontFamily = CodeFont,
    fontSize = 13.sp,
    lineHeight = 20.sp,
    letterSpacing = 0.sp,
)
