package com.example.codeundercover_1

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.calculateWindowSizeClass
import androidx.compose.ui.Modifier
import com.example.codeundercover_1.ui.responsive.ProvideAppLayout
import com.example.codeundercover_1.ui.theme.CodeUndercoverTheme

class MainActivity : ComponentActivity() {

    @OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            // Recomputed on rotation, fold/unfold and multi-window resize, so
            // the whole tree re-lays-out rather than keeping a stale shape.
            val windowSizeClass = calculateWindowSizeClass(this)

            CodeUndercoverTheme {
                ProvideAppLayout(windowSizeClass) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background,
                    ) {
                        CodeUndercoverNavHost()
                    }
                }
            }
        }
    }
}
