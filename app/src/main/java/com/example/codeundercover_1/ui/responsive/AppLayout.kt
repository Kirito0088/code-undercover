package com.example.codeundercover_1.ui.responsive

import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.WindowHeightSizeClass
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.material3.windowsizeclass.WindowWidthSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * One source of truth for "how much room do we have, and how big should things
 * be?".
 *
 * The web app is fixed at Tailwind's breakpoints; on Android the same design
 * has to hold from a 5-inch phone to a tablet, so the sizes below scale rather
 * than the layout being redrawn. Screens read [LocalAppLayout] instead of
 * hard-coding padding or type sizes.
 *
 * The design language does NOT change across sizes — a tablet gets the same
 * corner-bracketed HUD panels a phone does, just with more room to breathe.
 */

enum class WidthClass { Compact, Medium, Expanded }

enum class NavStyle {
    /** Phones in portrait — bottom bar, thumb-reachable. */
    BottomBar,

    /** Large phones in landscape, small tablets, unfolded foldables. */
    Rail,

    /** Tablets and desktop windows — nav always visible. */
    PermanentDrawer,
}

@Immutable
data class AppLayout(
    val width: WidthClass,
    val isShortViewport: Boolean,
    val navStyle: NavStyle,

    /** Page edge padding. Web: `px-4 sm:px-6 lg:px-8`. */
    val screenPadding: Dp,

    /** Gap between stacked panels. Web: `gap-6`. */
    val gutter: Dp,

    /** Panel interior padding. Web: `p-6` on the header tile. */
    val panelPadding: Dp,

    /** Reading-measure cap. Web: `max-w-[1280px]`. */
    val maxContentWidth: Dp,

    /** HudPage title. Web: `text-2xl md:text-3xl`. */
    val titleSize: TextUnit,

    /** HudMetric value size. */
    val metricSize: TextUnit,

    /** Columns for the mission corkboard. */
    val boardColumns: Int,

    /** Whether a detail pane can sit beside the list. */
    val supportsTwoPane: Boolean,
) {
    val isCompact: Boolean get() = width == WidthClass.Compact
    val isExpanded: Boolean get() = width == WidthClass.Expanded

    companion object
}

/** Fallback before a real [WindowSizeClass] exists (e.g. inside `@Preview`). */
private val PhoneDefault = AppLayout(
    width = WidthClass.Compact,
    isShortViewport = false,
    navStyle = NavStyle.BottomBar,
    screenPadding = 16.dp,
    gutter = 16.dp,
    panelPadding = 16.dp,
    maxContentWidth = Dp.Infinity,
    titleSize = 24.sp,
    metricSize = 20.sp,
    boardColumns = 1,
    supportsTwoPane = false,
)

val LocalAppLayout: ProvidableCompositionLocal<AppLayout> =
    compositionLocalOf { PhoneDefault }

val AppLayout.Companion.Phone: AppLayout get() = PhoneDefault

@OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
fun AppLayout.Companion.from(windowSizeClass: WindowSizeClass): AppLayout {
    val short = windowSizeClass.heightSizeClass == WindowHeightSizeClass.Compact

    return when (windowSizeClass.widthSizeClass) {
        WindowWidthSizeClass.Expanded -> AppLayout(
            width = WidthClass.Expanded,
            isShortViewport = short,
            navStyle = NavStyle.PermanentDrawer,
            screenPadding = 32.dp,   // lg:px-8
            gutter = 24.dp,          // gap-6
            panelPadding = 24.dp,    // p-6
            maxContentWidth = 1280.dp,
            titleSize = 30.sp,       // md:text-3xl
            metricSize = 24.sp,
            boardColumns = 3,
            supportsTwoPane = true,
        )

        WindowWidthSizeClass.Medium -> AppLayout(
            width = WidthClass.Medium,
            isShortViewport = short,
            navStyle = NavStyle.Rail,
            screenPadding = 24.dp,   // sm:px-6
            gutter = 20.dp,
            panelPadding = 20.dp,
            maxContentWidth = 900.dp,
            titleSize = 28.sp,
            metricSize = 22.sp,
            boardColumns = 2,
            supportsTwoPane = !short,
        )

        else -> AppLayout(
            width = WidthClass.Compact,
            isShortViewport = short,
            // A phone on its side has almost no vertical room; a bottom bar
            // would eat what little is left, so it becomes a rail.
            navStyle = if (short) NavStyle.Rail else NavStyle.BottomBar,
            screenPadding = 16.dp,   // px-4
            gutter = 16.dp,
            panelPadding = 16.dp,
            maxContentWidth = Dp.Infinity,
            titleSize = 24.sp,       // text-2xl
            metricSize = 20.sp,
            boardColumns = 1,
            supportsTwoPane = false,
        )
    }
}

@OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
@Composable
fun ProvideAppLayout(
    windowSizeClass: WindowSizeClass,
    content: @Composable () -> Unit,
) {
    val layout = remember(
        windowSizeClass.widthSizeClass,
        windowSizeClass.heightSizeClass,
    ) {
        AppLayout.from(windowSizeClass)
    }
    CompositionLocalProvider(LocalAppLayout provides layout, content = content)
}
