package com.example.codeundercover_1.ui.responsive

import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.WindowHeightSizeClass
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.material3.windowsizeclass.WindowWidthSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * One source of truth for "how much room do we have, and what shape should the
 * UI take?".
 *
 * Every screen reads [LocalAppLayout] instead of measuring for itself, so a
 * phone, a folded/unfolded foldable, a tablet and a free-form desktop window
 * all get a deliberate layout rather than a stretched phone layout.
 */

enum class WidthClass { Compact, Medium, Expanded }

enum class NavStyle {
    /** Phones in portrait — bottom bar, thumb-reachable. */
    BottomBar,

    /** Large phones in landscape, small tablets, unfolded foldables. */
    Rail,

    /** Tablets and desktop windows — nav is always visible. */
    PermanentDrawer,
}

@Immutable
data class AppLayout(
    val width: WidthClass,
    val isShortViewport: Boolean,
    val navStyle: NavStyle,

    /** Padding from the screen edge to content. */
    val screenPadding: Dp,

    /** Gap between sibling cards / list rows. */
    val gutter: Dp,

    /**
     * Reading measure cap. Long briefings become unreadable when a line runs
     * the full width of a tablet, so text columns stop here and centre.
     */
    val maxContentWidth: Dp,

    /** Columns for the mission/levels board. */
    val boardColumns: Int,

    /** Whether a detail pane can sit beside the list (list-detail). */
    val supportsTwoPane: Boolean,
) {
    val isCompact: Boolean get() = width == WidthClass.Compact
    val isExpanded: Boolean get() = width == WidthClass.Expanded

    companion object
}

/**
 * Fallback used before a real [WindowSizeClass] is available (e.g. inside
 * `@Preview`). Assumes a normal phone.
 */
private val PhoneDefault = AppLayout(
    width = WidthClass.Compact,
    isShortViewport = false,
    navStyle = NavStyle.BottomBar,
    screenPadding = 16.dp,
    gutter = 12.dp,
    maxContentWidth = Dp.Infinity,
    boardColumns = 1,
    supportsTwoPane = false,
)

val LocalAppLayout: ProvidableCompositionLocal<AppLayout> =
    compositionLocalOf { PhoneDefault }

@OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
fun AppLayout.Companion.from(windowSizeClass: WindowSizeClass): AppLayout {
    val short = windowSizeClass.heightSizeClass == WindowHeightSizeClass.Compact

    return when (windowSizeClass.widthSizeClass) {
        WindowWidthSizeClass.Expanded -> AppLayout(
            width = WidthClass.Expanded,
            isShortViewport = short,
            navStyle = NavStyle.PermanentDrawer,
            screenPadding = 32.dp,
            gutter = 20.dp,
            maxContentWidth = 720.dp,
            boardColumns = 3,
            supportsTwoPane = true,
        )

        WindowWidthSizeClass.Medium -> AppLayout(
            width = WidthClass.Medium,
            isShortViewport = short,
            navStyle = NavStyle.Rail,
            screenPadding = 24.dp,
            gutter = 16.dp,
            maxContentWidth = 640.dp,
            boardColumns = 2,
            supportsTwoPane = !short,
        )

        else -> AppLayout(
            width = WidthClass.Compact,
            isShortViewport = short,
            // A phone on its side has almost no vertical room; a bottom bar
            // would eat what little is left, so it becomes a rail.
            navStyle = if (short) NavStyle.Rail else NavStyle.BottomBar,
            screenPadding = 16.dp,
            gutter = 12.dp,
            maxContentWidth = Dp.Infinity,
            boardColumns = 1,
            supportsTwoPane = false,
        )
    }
}

/** Needed so the extension above can hang off `AppLayout.Companion`. */
val AppLayout.Companion.Phone: AppLayout get() = PhoneDefault

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
