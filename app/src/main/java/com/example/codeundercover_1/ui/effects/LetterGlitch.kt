package com.example.codeundercover_1.ui.effects

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlin.random.Random

/**
 * Port of `components/LetterGlitch.tsx` — the matrix-rain canvas behind every
 * auth screen.
 *
 * Parameters match the call site in `app/(auth)/layout.tsx`: glitchSpeed 50,
 * smooth, centre vignette, and the layout's own `opacity-40`.
 *
 * The web version accumulates a fading trail by painting a translucent
 * rectangle over the previous frame. Compose has no persistent backing bitmap
 * here, so each column's trail is drawn explicitly every frame with the same
 * alpha ramp the web uses — visually equivalent, and it avoids allocating an
 * offscreen bitmap on every recomposition.
 */

private const val CHARACTERS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#\$&*()-_+=/[]{};:<>.,0123456789"

/** `glitchColors = ['#312e81', '#0EB94D', '#39D375']` */
private val GlitchColors = intArrayOf(0xFF312E81.toInt(), 0xFF0EB94D.toInt(), 0xFF39D375.toInt())

private const val FONT_SIZE_DP = 16
private const val FRAME_MS = 50L

@Composable
fun LetterGlitch(
    modifier: Modifier = Modifier,
    opacity: Float = 0.40f,
    centerVignette: Boolean = true,
) {
    var frame by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(FRAME_MS)
            frame++
        }
    }

    val density = LocalDensity.current
    val cell = with(density) { FONT_SIZE_DP.dp.toPx() }

    val paint = remember {
        Paint().apply {
            typeface = Typeface.MONOSPACE
            textSize = cell
            isAntiAlias = true
        }
    }

    // Column heads, persisted across frames. Sized lazily once the canvas size
    // is known, then reused so the rain keeps falling instead of restarting.
    val drops = remember { mutableListOf<Float>() }

    Canvas(modifier = modifier.fillMaxSize().alpha(opacity)) {
        val columns = (size.width / cell).toInt() + 1
        if (drops.size != columns) {
            drops.clear()
            repeat(columns) { drops.add(Random.nextFloat() * -40f) }
        }

        // Read `frame` so the canvas repaints on every tick.
        @Suppress("UNUSED_EXPRESSION")
        frame

        drawIntoCanvas { canvas ->
            val native = canvas.nativeCanvas

            for (i in 0 until columns) {
                val x = i * cell
                val y = drops[i] * cell

                if (y > 0 && y < size.height) {
                    // Leading character is white.
                    paint.color = Color.White.toArgb()
                    paint.alpha = 255
                    native.drawText(randomChar(), x, y, paint)

                    // The character just behind it takes the primary colour.
                    if (y - cell > 0) {
                        paint.color = GlitchColors[0]
                        paint.alpha = (0.8f * 255).toInt()
                        native.drawText(randomChar(), x, y - cell, paint)
                    }
                }

                // Trail: 8..19 characters fading out behind the head.
                val trailLength = 8 + (i * 7 + frame) % 12
                for (j in 2 until trailLength) {
                    val trailY = y - j * cell
                    if (trailY > 0 && trailY < size.height) {
                        val alpha = maxOf(0.1f, 1f - j.toFloat() / trailLength)
                        paint.color = GlitchColors[j % GlitchColors.size]
                        paint.alpha = (alpha * 255).toInt()
                        native.drawText(randomChar(), x, trailY, paint)
                    }
                }

                // Advance, and respawn above the top once the column runs off.
                drops[i] = drops[i] + 1f
                if (y > size.height && Random.nextFloat() > 0.975f) {
                    drops[i] = 0f
                }
            }
        }

        if (centerVignette) {
            // Keeps the form legible against the rain without hiding it.
            drawRect(
                brush = Brush.radialGradient(
                    colors = listOf(Color.Black.copy(alpha = 0.55f), Color.Transparent),
                    radius = minOf(size.width, size.height) * 0.75f,
                )
            )
        }
    }
}

private fun randomChar(): String =
    CHARACTERS[Random.nextInt(CHARACTERS.length)].toString()
