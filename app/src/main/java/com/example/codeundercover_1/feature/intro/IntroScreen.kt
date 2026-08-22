package com.example.codeundercover_1.feature.intro

import android.widget.VideoView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.net.toUri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.ui.components.PrimaryButton
import com.example.codeundercover_1.ui.components.SecondaryButton
import com.example.codeundercover_1.ui.theme.Noir
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class IntroUiState(
    val videoUrl: String? = null,
    val playbackFailed: Boolean = false,
    val finishing: Boolean = false,
)

class IntroViewModel : ViewModel() {

    private val auth = ServiceLocator.auth
    private val settings = ServiceLocator.settings

    private val _state = MutableStateFlow(IntroUiState())
    val state: StateFlow<IntroUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            // The cinematic is a 46 MB asset served by the web app. Streaming
            // it keeps it out of the APK and guarantees the phone shows exactly
            // what the browser shows.
            _state.update { it.copy(videoUrl = settings.currentBaseUrl() + INTRO_VIDEO_PATH) }
        }
    }

    fun onPlaybackFailed() = _state.update { it.copy(playbackFailed = true) }

    /**
     * Marks the briefing seen. The local callback fires regardless of the
     * network result: being unable to record the flag must not trap someone on
     * the intro forever.
     */
    fun complete(onDone: () -> Unit) {
        if (_state.value.finishing) return
        _state.update { it.copy(finishing = true) }
        viewModelScope.launch {
            auth.markIntroSeen()
            _state.update { it.copy(finishing = false) }
            onDone()
        }
    }

    private companion object {
        const val INTRO_VIDEO_PATH = "/intro2.mp4"
    }
}

@Composable
fun IntroScreen(
    onCompleted: () -> Unit,
    viewModel: IntroViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Noir.chalkboardDeep),
    ) {
        val url = state.videoUrl
        if (url != null && !state.playbackFailed) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { context ->
                    VideoView(context).apply {
                        setVideoURI(url.toUri())
                        setOnPreparedListener { player -> player.isLooping = false }
                        setOnCompletionListener { viewModel.complete(onCompleted) }
                        setOnErrorListener { _, _, _ ->
                            viewModel.onPlaybackFailed()
                            true
                        }
                        start()
                    }
                },
            )
        } else {
            // Fallback briefing when the video cannot stream — an unreachable
            // asset should not block access to the app.
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .safeDrawingPadding()
                    .padding(28.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    "CODE UNDERCOVER",
                    style = MaterialTheme.typography.labelMedium,
                    color = Noir.brass,
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    "Your Briefing",
                    style = MaterialTheme.typography.displaySmall,
                    color = Noir.chalk,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "You are an operative in training. Each mission teaches a " +
                        "concept, tests it, then puts you at the keyboard. " +
                        "Complete them in order to earn aura and climb the ranks.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Noir.chalk,
                    textAlign = TextAlign.Center,
                )
            }
        }

        // Always reachable, over the video as well — nobody should be forced to
        // sit through a cinematic a second time.
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .safeDrawingPadding()
                .padding(24.dp)
                .fillMaxWidth(),
        ) {
            if (state.playbackFailed || url == null) {
                PrimaryButton(
                    text = "BEGIN",
                    onClick = { viewModel.complete(onCompleted) },
                    modifier = Modifier.fillMaxWidth(),
                    loading = state.finishing,
                )
            } else {
                SecondaryButton(
                    text = "SKIP BRIEFING",
                    onClick = { viewModel.complete(onCompleted) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}
