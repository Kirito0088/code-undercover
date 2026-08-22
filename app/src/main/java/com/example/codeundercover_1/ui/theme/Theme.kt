package com.example.codeundercover_1.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Dynamic colour is intentionally NOT used. Code Undercover's identity is the
 * brass-on-chalkboard detective palette; letting Material You repaint it from
 * the user's wallpaper would erase the brand the web app is built around.
 */

private val DarkScheme = darkColorScheme(
    primary = DarkTokens.accent,
    onPrimary = DarkTokens.accentFg,
    primaryContainer = Noir.brassDeep,
    onPrimaryContainer = Noir.brassBright,

    secondary = Noir.mossBright,
    onSecondary = Noir.chalkboardDeep,
    secondaryContainer = Noir.moss,
    onSecondaryContainer = Noir.chalk,

    tertiary = Noir.corkBase,
    onTertiary = Noir.walnutDeep,
    tertiaryContainer = Noir.corkDark,
    onTertiaryContainer = Noir.note,

    background = DarkTokens.bg,
    onBackground = DarkTokens.text,
    surface = DarkTokens.surface,
    onSurface = DarkTokens.text,
    surfaceVariant = Noir.walnut,
    onSurfaceVariant = DarkTokens.muted,
    surfaceContainerHighest = Noir.walnutLight,

    outline = DarkTokens.border,
    outlineVariant = Noir.walnutDeep,

    error = Noir.inkRedBright,
    onError = Noir.chalk,
    errorContainer = Noir.inkRed,
    onErrorContainer = Noir.note,

    scrim = Noir.walnutDeep,
)

private val LightScheme = lightColorScheme(
    primary = LightTokens.accent,
    onPrimary = LightTokens.accentFg,
    primaryContainer = Noir.brassBright,
    onPrimaryContainer = Noir.walnutDeep,

    secondary = Noir.moss,
    onSecondary = Noir.chalk,
    secondaryContainer = Noir.tapeGreen,
    onSecondaryContainer = Noir.chalkboardDeep,

    tertiary = Noir.corkDark,
    onTertiary = Noir.note,
    tertiaryContainer = Noir.corkBase,
    onTertiaryContainer = Noir.walnutDeep,

    background = LightTokens.bg,
    onBackground = LightTokens.text,
    surface = LightTokens.surface,
    onSurface = LightTokens.text,
    surfaceVariant = Noir.paper,
    onSurfaceVariant = LightTokens.muted,
    surfaceContainerHighest = Noir.paperLocked,

    outline = LightTokens.border,
    outlineVariant = Noir.paperEdge,

    error = Noir.inkRed,
    onError = Noir.chalk,
    errorContainer = Noir.inkRedBright,
    onErrorContainer = Noir.note,

    scrim = Noir.walnutDeep,
)

@Composable
fun CodeUndercoverTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme: ColorScheme = if (darkTheme) DarkScheme else LightScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            // Bars are drawn behind by enableEdgeToEdge; this only decides
            // whether their icons render dark or light against our palette.
            WindowCompat.getInsetsController(window, view)
                .isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(window, view)
                .isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content,
    )
}
