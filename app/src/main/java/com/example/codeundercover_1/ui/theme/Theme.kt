package com.example.codeundercover_1.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Dark only, matching the web app's authenticated surface. The site ships a
 * theme toggle, but every HUD and auth screen is authored against the dark
 * `:root` values — the console palette (#0D0E12 / #1F261F) has no light
 * counterpart at all, so a light scheme here would be invented, not ported.
 *
 * Dynamic colour stays off for the same reason it did before: Material You
 * would repaint the brass accent the whole product is built around.
 */
private val Scheme = darkColorScheme(
    primary = Hud.accent,
    onPrimary = Hud.accentFg,
    primaryContainer = Hud.accent,
    onPrimaryContainer = Hud.accentFg,

    secondary = Semantic.emerald400,
    onSecondary = Console.deep,
    secondaryContainer = Semantic.emeraldFill,
    onSecondaryContainer = Semantic.emerald400,

    tertiary = Console.link,
    onTertiary = Console.deep,

    background = Hud.bg,
    onBackground = Hud.text,
    surface = Hud.surface,
    onSurface = Hud.text,
    surfaceVariant = Console.panel,
    onSurfaceVariant = Hud.muted,
    surfaceContainerHighest = Console.hover,

    outline = Hud.border,
    outlineVariant = Console.border,

    error = Semantic.red400,
    onError = Console.text,
    errorContainer = Semantic.errorFill,
    onErrorContainer = Semantic.red400,

    scrim = Console.deep,
)

@Composable
fun CodeUndercoverTheme(content: @Composable () -> Unit) {
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val controller = WindowCompat.getInsetsController(window, view)
            // Always a dark surface, so bar icons are always light.
            controller.isAppearanceLightStatusBars = false
            controller.isAppearanceLightNavigationBars = false
        }
    }

    MaterialTheme(
        colorScheme = Scheme,
        typography = AppTypography,
        content = content,
    )
}
