package com.example.codeundercover_1.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import com.example.codeundercover_1.R

/**
 * Type ported from the web app's actual classes.
 *
 * `HudPage` puts `font-mono` on the whole authenticated surface, so mono — not
 * a typewriter display face — is the default voice. Only the page title and
 * subtitle opt back out with `font-sans`. The earlier build had this backwards.
 *
 * Sizes are the literal Tailwind values the markup uses: `text-[8px]` on
 * badges, `text-[9px]` on metric labels, `text-[10px]` on eyebrows, then
 * xs/sm/2xl/3xl.
 */

val MonoFont = FontFamily(
    Font(R.font.jetbrains_mono_regular, FontWeight.Normal),
    Font(R.font.jetbrains_mono_medium, FontWeight.Medium),
    Font(R.font.jetbrains_mono_bold, FontWeight.Bold),
)

/**
 * `font-sans` — the page title and auth headings. The web `<body>` loads Geist
 * Sans, so the real face ships here rather than falling back to Roboto.
 */
val SansFont = FontFamily(
    Font(R.font.geist_regular, FontWeight.Normal),
    Font(R.font.geist_medium, FontWeight.Medium),
    Font(R.font.geist_semibold, FontWeight.SemiBold),
    Font(R.font.geist_bold, FontWeight.Bold),
)

// ─── Named styles matching the web's utility combinations ────────────────────

/** `text-[10px] font-mono tracking-widest uppercase text-muted` */
val HudEyebrow = TextStyle(
    fontFamily = MonoFont,
    fontSize = 10.sp,
    lineHeight = 13.sp,
    letterSpacing = 1.0.sp, // tracking-widest = 0.1em
)

/** `text-2xl md:text-3xl font-bold font-sans text-accent tracking-tight` */
val HudTitle = TextStyle(
    fontFamily = SansFont,
    fontWeight = FontWeight.Bold,
    fontSize = 24.sp,
    lineHeight = 30.sp,
    letterSpacing = (-0.6).sp,
)

/** `text-xs text-muted font-sans` */
val HudSubtitle = TextStyle(
    fontFamily = SansFont,
    fontSize = 12.sp,
    lineHeight = 17.sp,
)

/** `text-[8px] font-mono` — HudBadge. */
val BadgeText = TextStyle(
    fontFamily = MonoFont,
    fontSize = 8.sp,
    lineHeight = 11.sp,
)

/** `text-[9px] font-mono tracking-wider uppercase` — HudMetric label. */
val MetricLabel = TextStyle(
    fontFamily = MonoFont,
    fontSize = 9.sp,
    lineHeight = 12.sp,
    letterSpacing = 0.45.sp, // tracking-wider = 0.05em
)

/** `font-mono font-bold tracking-tight` — HudMetric value. */
val MetricValue = TextStyle(
    fontFamily = MonoFont,
    fontWeight = FontWeight.Bold,
    fontSize = 20.sp,
    lineHeight = 25.sp,
    letterSpacing = (-0.5).sp,
)

/** `text-[9px] text-muted` — HudMetric hint. */
val MetricHint = TextStyle(
    fontFamily = MonoFont,
    fontSize = 9.sp,
    lineHeight = 12.sp,
)

/** `text-xs font-medium` — form labels. */
val FieldLabel = TextStyle(
    fontFamily = SansFont,
    fontWeight = FontWeight.Medium,
    fontSize = 12.sp,
    lineHeight = 16.sp,
)

/** `text-sm` — inputs, body copy, button labels. */
val BodyText = TextStyle(
    fontFamily = SansFont,
    fontSize = 14.sp,
    lineHeight = 21.sp,
)

/** `text-sm font-medium` — Button. */
val ButtonText = TextStyle(
    fontFamily = SansFont,
    fontWeight = FontWeight.Medium,
    fontSize = 14.sp,
    lineHeight = 17.sp,
)

/** `text-3xl font-semibold tracking-tight` — "Welcome back". */
val AuthHeading = TextStyle(
    fontFamily = SansFont,
    fontWeight = FontWeight.SemiBold,
    fontSize = 30.sp,
    lineHeight = 36.sp,
    letterSpacing = (-0.75).sp,
    textAlign = TextAlign.Center,
)

/** Editor and terminal output. */
val CodeStyle = TextStyle(
    fontFamily = MonoFont,
    fontSize = 13.sp,
    lineHeight = 20.sp,
)

/**
 * Material roles, so stock components (TextField, NavigationBar…) inherit the
 * right voice instead of Material's Roboto defaults.
 */
val AppTypography = Typography(
    displayLarge = HudTitle.copy(fontSize = 34.sp, lineHeight = 41.sp),
    displayMedium = HudTitle.copy(fontSize = 30.sp, lineHeight = 36.sp),
    displaySmall = HudTitle.copy(fontSize = 24.sp, lineHeight = 30.sp),

    headlineLarge = HudTitle,
    headlineMedium = HudTitle.copy(fontSize = 20.sp, lineHeight = 26.sp),
    headlineSmall = HudTitle.copy(fontSize = 18.sp, lineHeight = 24.sp),

    titleLarge = TextStyle(
        fontFamily = MonoFont,
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = MonoFont,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    titleSmall = FieldLabel,

    bodyLarge = BodyText.copy(fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = BodyText,
    bodySmall = TextStyle(
        fontFamily = SansFont,
        fontSize = 12.sp,
        lineHeight = 17.sp,
    ),

    labelLarge = ButtonText,
    labelMedium = MetricLabel.copy(fontSize = 10.sp, lineHeight = 13.sp),
    labelSmall = BadgeText,
)
