package com.example.codeundercover_1.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.codeundercover_1.ui.theme.BodyText
import com.example.codeundercover_1.ui.theme.ButtonText
import com.example.codeundercover_1.ui.theme.Console
import com.example.codeundercover_1.ui.theme.FieldLabel
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.Semantic

/*
 * Ports of components/ui/Button.tsx and components/ui/Input.tsx. Sizes and
 * colours are the literal values from those files, not approximations.
 */

enum class ButtonVariant { Default, Destructive, Outline, Secondary, Ghost, Link }
enum class ButtonSize { Default, Sm, Lg, Icon }

private fun ButtonSize.height(): Dp = when (this) {
    ButtonSize.Default -> 40.dp  // h-10
    ButtonSize.Sm -> 36.dp       // h-9
    ButtonSize.Lg -> 44.dp       // h-11
    ButtonSize.Icon -> 40.dp     // size-10
}

private fun ButtonSize.horizontalPadding(): Dp = when (this) {
    ButtonSize.Default -> 16.dp  // px-4
    ButtonSize.Sm -> 12.dp       // px-3
    ButtonSize.Lg -> 32.dp       // px-8
    ButtonSize.Icon -> 0.dp
}

@Composable
fun AppButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.Default,
    size: ButtonSize = ButtonSize.Default,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    val interactive = enabled && !loading

    // Mirrors the `variants` map in components/ui/Button.tsx.
    val (container, content, borderColor) = when (variant) {
        ButtonVariant.Default -> Triple(Hud.accent, Hud.accentFg, Color.Transparent)
        ButtonVariant.Destructive -> Triple(Semantic.red500, Color.White, Color.Transparent)
        ButtonVariant.Outline -> Triple(Color.Transparent, Hud.muted, Hud.border)
        ButtonVariant.Secondary -> Triple(Hud.surface, Hud.text, Hud.border)
        ButtonVariant.Ghost -> Triple(Color.Transparent, Hud.muted, Color.Transparent)
        ButtonVariant.Link -> Triple(Color.Transparent, Hud.accent, Color.Transparent)
    }

    // disabled:opacity-50
    val alpha = if (interactive) 1f else 0.5f
    val shape = RoundedCornerShape(6.dp) // rounded-md

    Box(
        modifier = modifier
            .heightIn(min = size.height())
            .clip(shape)
            .background(container.copy(alpha = container.alpha * alpha))
            .border(1.dp, borderColor.copy(alpha = borderColor.alpha * alpha), shape)
            .clickable(enabled = interactive, onClick = onClick)
            .padding(horizontal = size.horizontalPadding()),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(14.dp),
                    strokeWidth = 2.dp,
                    color = content,
                )
                Spacer(Modifier.size(8.dp))
            }
            Text(
                text = text,
                style = if (size == ButtonSize.Lg) ButtonText.copy(fontSize = 18.sp) else ButtonText,
                color = content.copy(alpha = alpha),
                maxLines = 1,
            )
        }
    }
}

/**
 * Port of `components/ui/Input.tsx`, with the label treatment the auth pages
 * wrap it in (`text-xs font-medium text-[#8F9F8F] mb-1.5`).
 *
 * Built on BasicTextField rather than OutlinedTextField because Material's
 * outlined field draws a notched border and a floating label — neither of
 * which the web input has.
 */
@Composable
fun AppInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String? = null,
    errorText: String? = null,
    helperText: String? = null,
    isPassword: Boolean = false,
    singleLine: Boolean = true,
    enabled: Boolean = true,
    minHeight: Dp = 40.dp, // h-10
    textStyle: TextStyle = BodyText,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
) {
    var revealed by remember { mutableStateOf(false) }
    val focusedBorder = Semantic.emerald500.copy(alpha = 0.60f)
    val shape = RoundedCornerShape(6.dp)

    Column(modifier = modifier.fillMaxWidth()) {
        if (label != null) {
            Text(text = label, style = FieldLabel, color = Console.muted)
            Spacer(Modifier.height(6.dp)) // mb-1.5
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = minHeight)
                .clip(shape)
                .background(Console.panel)
                .border(
                    width = 1.dp,
                    color = when {
                        errorText != null -> Semantic.red500.copy(alpha = 0.6f)
                        else -> Console.border
                    },
                    shape = shape,
                )
                .padding(horizontal = 12.dp, vertical = 8.dp), // px-3 py-2
            contentAlignment = Alignment.CenterStart,
        ) {
            if (value.isEmpty() && placeholder != null) {
                Text(text = placeholder, style = textStyle, color = Console.placeholder)
            }
            CompositionLocalProvider(LocalTextStyle provides textStyle) {
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = enabled,
                    singleLine = singleLine,
                    textStyle = textStyle.copy(color = Console.text),
                    cursorBrush = SolidColor(focusedBorder),
                    keyboardOptions = keyboardOptions,
                    visualTransformation = when {
                        !isPassword || revealed -> VisualTransformation.None
                        else -> PasswordVisualTransformation()
                    },
                )
            }
        }

        val support = errorText ?: helperText
        if (support != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = support,
                style = androidx.compose.ui.text.TextStyle(
                    fontFamily = com.example.codeundercover_1.ui.theme.SansFont,
                    fontSize = 12.sp,
                ),
                color = if (errorText != null) Semantic.red400 else Console.muted,
            )
        }
    }
}

/** `rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400` */
@Composable
fun ErrorBanner(message: String, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(8.dp)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(Semantic.errorFill)
            .border(1.dp, Semantic.errorBorder, shape)
            .padding(12.dp),
    ) {
        Text(text = message, style = BodyText, color = Semantic.red400)
    }
}

/** The `or` rule between the credentials form and Google sign-in. */
@Composable
fun OrDivider(modifier: Modifier = Modifier, background: Color = Console.panel) {
    Box(modifier = modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(Console.border)
        )
        Text(
            text = "or",
            style = BodyText.copy(fontSize = 12.sp),
            color = Console.placeholder,
            modifier = Modifier
                .background(background)
                .padding(horizontal = 12.dp),
        )
    }
}

@Composable
fun LoadingState(modifier: Modifier = Modifier, label: String = "LOADING") {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Hud.bg),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        CircularProgressIndicator(color = Hud.accent, strokeWidth = 2.dp)
        Spacer(Modifier.height(16.dp))
        Text(text = label.uppercase(), style = MetricLabel, color = Hud.muted)
    }
}

@Composable
fun ErrorState(
    message: String,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Hud.bg)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = "// ERROR", style = MetricLabel, color = Semantic.red400)
        Spacer(Modifier.height(8.dp))
        Text(
            text = message,
            style = BodyText,
            color = Hud.muted,
            textAlign = TextAlign.Center,
        )
        if (onRetry != null) {
            Spacer(Modifier.height(20.dp))
            AppButton(text = "Retry", onClick = onRetry, variant = ButtonVariant.Outline)
        }
    }
}

@Composable
fun EmptyState(
    title: String,
    detail: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Hud.bg)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = title, style = BodyText.copy(fontSize = 16.sp), color = Hud.text)
        Spacer(Modifier.height(8.dp))
        Text(text = detail, style = BodyText, color = Hud.muted, textAlign = TextAlign.Center)
        if (action != null) {
            Spacer(Modifier.height(20.dp))
            action()
        }
    }
}

/** Inline text link — `text-[#39D375]` on auth screens. */
@Composable
fun TextLink(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    color: Color = Console.link,
) {
    Text(
        text = text,
        style = BodyText.copy(fontSize = 12.sp),
        color = color,
        modifier = modifier
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp),
    )
}
