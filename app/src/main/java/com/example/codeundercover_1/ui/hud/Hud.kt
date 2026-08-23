package com.example.codeundercover_1.ui.hud

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.BadgeText
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.HudEyebrow
import com.example.codeundercover_1.ui.theme.HudSubtitle
import com.example.codeundercover_1.ui.theme.HudTitle
import com.example.codeundercover_1.ui.theme.MetricHint
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.MetricValue

/*
 * Compose ports of the components/hud primitives. The visual grammar — corner brackets,
 * scanline grid, CRT sweep, top-right radial glow — is the app's signature and
 * is reproduced here rather than reinterpreted.
 */

/** `size-3` — the 12px corner bracket arm length used throughout the web app. */
private val BracketArm = 12.dp

/** The scanline grid is `bg-[size:20px_20px]`. */
private val GridCell = 20.dp

/**
 * Draws the four L-shaped corner marks. In the web these are four absolutely
 * positioned spans with two borders each; a single draw pass is the equivalent
 * without four extra layout nodes per panel.
 */
private fun DrawScope.drawCornerBrackets(color: Color, arm: Float, stroke: Float) {
    val w = size.width
    val h = size.height
    val half = stroke / 2f

    // Top-left
    drawLine(color, Offset(0f, half), Offset(arm, half), stroke)
    drawLine(color, Offset(half, 0f), Offset(half, arm), stroke)
    // Top-right
    drawLine(color, Offset(w, half), Offset(w - arm, half), stroke)
    drawLine(color, Offset(w - half, 0f), Offset(w - half, arm), stroke)
    // Bottom-left
    drawLine(color, Offset(0f, h - half), Offset(arm, h - half), stroke)
    drawLine(color, Offset(half, h), Offset(half, h - arm), stroke)
    // Bottom-right
    drawLine(color, Offset(w, h - half), Offset(w - arm, h - half), stroke)
    drawLine(color, Offset(w - half, h), Offset(w - half, h - arm), stroke)
}

/** Modifier that stamps the corner brackets over whatever it decorates. */
fun Modifier.cornerBrackets(
    color: Color = Hud.bracket,
    arm: Dp = BracketArm,
): Modifier = this.drawWithContent {
    drawContent()
    drawCornerBrackets(color, arm.toPx(), 1.dp.toPx())
}

/**
 * The scanline grid plus CRT tint that `HudPage` paints across the whole
 * authenticated surface.
 */
private fun Modifier.scanlineField(): Modifier = this.drawBehind {
    val cell = GridCell.toPx()
    val hairline = 1.dp.toPx()

    // Vertical then horizontal grid lines at rgba(183,135,66,0.04).
    var x = 0f
    while (x < size.width) {
        drawLine(Hud.gridLine, Offset(x, 0f), Offset(x, size.height), hairline)
        x += cell
    }
    var y = 0f
    while (y < size.height) {
        drawLine(Hud.gridLine, Offset(0f, y), Offset(size.width, y), hairline)
        y += cell
    }

    // CRT scanlines: 4px band, bottom half darkened, at 40% overall opacity.
    val band = 4.dp.toPx()
    val darken = Color.Black.copy(alpha = 0.25f * 0.40f)
    var scan = 0f
    while (scan < size.height) {
        drawRect(
            color = darken,
            topLeft = Offset(0f, scan + band / 2f),
            size = Size(size.width, band / 2f),
        )
        scan += band
    }
}

/**
 * `animate-scanline-sweep` — a 96px tall gradient bar travelling down the page
 * on a loop.
 */
@Composable
private fun BoxScope.CrtSweep() {
    val transition = rememberInfiniteTransition(label = "crt-sweep")
    val progress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 8000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "sweep-progress",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .drawBehind {
                val bandHeight = 96.dp.toPx()
                val travel = size.height + bandHeight
                val top = progress * travel - bandHeight
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Hud.sweep, Color.Transparent),
                        startY = top,
                        endY = top + bandHeight,
                    ),
                    topLeft = Offset(0f, top),
                    size = Size(size.width, bandHeight),
                )
            }
    )
}

/**
 * Port of `HudPage`. Owns the scanline background, the page container width and
 * the corner-bracketed header tile, so every authenticated screen shares one
 * rhythm.
 *
 * Padding and the header title size scale with the window so the same layout
 * reads correctly from a small phone to a tablet, which is the one thing the
 * web version cannot do.
 */
@Composable
fun HudPage(
    modifier: Modifier = Modifier,
    eyebrow: String? = null,
    title: String? = null,
    subtitle: String? = null,
    status: (@Composable () -> Unit)? = null,
    compact: Boolean = false,
    content: @Composable ColumnScope.() -> Unit,
) {
    val layout = LocalAppLayout.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Hud.bg)
            .scanlineField(),
    ) {
        CrtSweep()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = layout.maxContentWidth)
                .align(Alignment.TopCenter)
                .padding(
                    horizontal = if (compact) layout.gutter else layout.screenPadding,
                    vertical = if (compact) layout.gutter else layout.screenPadding,
                ),
            verticalArrangement = Arrangement.spacedBy(layout.gutter),
        ) {
            if (eyebrow != null || title != null) {
                HudHeader(eyebrow = eyebrow, title = title, subtitle = subtitle, status = status)
            }
            content()
        }
    }
}

@Composable
private fun HudHeader(
    eyebrow: String?,
    title: String?,
    subtitle: String?,
    status: (@Composable () -> Unit)?,
) {
    val layout = LocalAppLayout.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Hud.surface)
            .border(1.dp, Hud.border, RoundedCornerShape(12.dp))
            // radial-gradient(ellipse at center, rgba(183,135,66,0.04), transparent 70%)
            .drawBehind {
                drawRect(
                    Brush.radialGradient(
                        colors = listOf(Hud.gridLine, Color.Transparent),
                        center = Offset(size.width / 2f, size.height / 2f),
                        radius = maxOf(size.width, size.height) * 0.7f,
                    )
                )
            }
            .cornerBrackets()
            .padding(layout.panelPadding),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f, fill = false)) {
                if (eyebrow != null) {
                    Text(
                        text = eyebrow.uppercase(),
                        style = HudEyebrow,
                        color = Hud.muted,
                    )
                    Spacer(Modifier.height(2.dp))
                }
                if (title != null) {
                    Text(
                        text = title,
                        style = HudTitle.copy(fontSize = layout.titleSize),
                        color = Hud.accent,
                    )
                }
                if (subtitle != null) {
                    Spacer(Modifier.height(2.dp))
                    Text(text = subtitle, style = HudSubtitle, color = Hud.muted)
                }
            }
            if (status != null) {
                Spacer(Modifier.size(12.dp))
                status()
            }
        }
    }
}

/**
 * Port of `HudPanel`: surface fill, hairline border, corner brackets and the
 * top-right radial glow.
 */
@Composable
fun HudPanel(
    modifier: Modifier = Modifier,
    radius: Dp = 8.dp,
    padding: Dp? = null,
    borderColor: Color = Hud.border,
    content: @Composable ColumnScope.() -> Unit,
) {
    val layout = LocalAppLayout.current
    val shape = RoundedCornerShape(radius)

    Column(
        modifier = modifier
            .clip(shape)
            .background(Hud.surface)
            .border(1.dp, borderColor, shape)
            // size-32 radial glow anchored top-right.
            .drawBehind {
                val glow = 128.dp.toPx()
                drawRect(
                    brush = Brush.radialGradient(
                        colors = listOf(Hud.panelGlow, Color.Transparent),
                        center = Offset(size.width, 0f),
                        radius = glow,
                    )
                )
            }
            .cornerBrackets()
            .padding(padding ?: layout.panelPadding),
        content = content,
    )
}

enum class BadgeTone { Active, Dim, Amber }

/** Port of `HudBadge` — the 8px mono channel marker. */
@Composable
fun HudBadge(
    text: String,
    modifier: Modifier = Modifier,
    tone: BadgeTone = BadgeTone.Dim,
) {
    val (fg, bg, border) = when (tone) {
        BadgeTone.Active -> Triple(Hud.accent, Hud.accentAlpha(0.10f), Hud.accentAlpha(0.20f))
        BadgeTone.Dim -> Triple(Hud.muted, Color.Transparent, Color.Transparent)
        BadgeTone.Amber -> Triple(
            com.example.codeundercover_1.ui.theme.Semantic.amber400,
            com.example.codeundercover_1.ui.theme.Semantic.amberFill,
            com.example.codeundercover_1.ui.theme.Semantic.amberBorder,
        )
    }

    Text(
        text = text,
        style = BadgeText,
        color = fg,
        maxLines = 1,
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(4.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp),
    )
}

/**
 * Port of `HudMetric`: icon + uppercase label row, bold mono value, quiet hint.
 */
@Composable
fun HudMetric(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    tag: String? = null,
    icon: (@Composable () -> Unit)? = null,
    valueColor: Color = Hud.text,
) {
    val layout = LocalAppLayout.current

    HudPanel(modifier = modifier, radius = 8.dp, padding = 16.dp) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (icon != null) {
                    icon()
                    Spacer(Modifier.size(4.dp))
                }
                Text(
                    text = label.uppercase(),
                    style = MetricLabel,
                    color = Hud.muted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            if (tag != null) {
                Text(text = tag, style = MetricHint, color = Hud.muted, maxLines = 1)
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = value,
            style = MetricValue.copy(fontSize = layout.metricSize),
            color = valueColor,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        if (hint != null) {
            Spacer(Modifier.height(2.dp))
            Text(text = hint, style = MetricHint, color = Hud.muted)
        }
    }
}
