package com.example.codeundercover_1.feature.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.net.SettingsStore
import com.example.codeundercover_1.ui.components.AppButton
import com.example.codeundercover_1.ui.components.AppInput
import com.example.codeundercover_1.ui.components.ButtonVariant
import com.example.codeundercover_1.ui.hud.HudPanel
import com.example.codeundercover_1.ui.theme.AuthHeading
import com.example.codeundercover_1.ui.theme.BodyText
import com.example.codeundercover_1.ui.theme.Console
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricHint
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.Semantic
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ServerSettingsUiState(
    val url: String = "",
    val loaded: Boolean = false,
    val testing: Boolean = false,
    val saved: Boolean = false,
    val reachable: Boolean? = null,
    val message: String? = null,
)

/**
 * There is no fixed production host for this backend yet, so the app has to let
 * someone point it at whatever is running. Baking a URL into the binary would
 * make the app untestable.
 */
class ServerSettingsViewModel : ViewModel() {

    private val settings = ServiceLocator.settings
    private val api = ServiceLocator.api

    private val _state = MutableStateFlow(ServerSettingsUiState())
    val state: StateFlow<ServerSettingsUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            _state.update { it.copy(url = settings.currentBaseUrl(), loaded = true) }
        }
    }

    fun onUrlChange(value: String) =
        _state.update { it.copy(url = value, saved = false, reachable = null, message = null) }

    /** Saves first, then pings — a test against an unsaved URL would lie. */
    fun testConnection() {
        val target = SettingsStore.normalizeBaseUrl(_state.value.url)
        _state.update { it.copy(testing = true, message = null, reachable = null) }

        viewModelScope.launch {
            val previous = settings.currentBaseUrl()
            settings.setBaseUrl(target)

            // Only a genuine change of backend invalidates the session. Testing
            // the address you are already pointed at must not sign you out —
            // clearing unconditionally did exactly that.
            if (previous != target) api.cookieJar.clear()

            when (val result = api.send("GET", "/api/ping")) {
                is ApiResult.Success -> _state.update {
                    it.copy(
                        testing = false,
                        url = target,
                        saved = true,
                        reachable = true,
                        message = "Connected to $target",
                    )
                }

                is ApiResult.Failure -> _state.update {
                    it.copy(
                        testing = false,
                        url = target,
                        saved = true,
                        reachable = false,
                        message = "Saved, but unreachable: ${result.error.message}",
                    )
                }
            }
        }
    }
}

@Composable
fun ServerSettingsScreen(
    onDone: () -> Unit,
    viewModel: ServerSettingsViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val scroll = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Hud.bg)
            .safeDrawingPadding()
            .imePadding(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .verticalScroll(scroll)
                .widthIn(max = 480.dp)
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 24.dp),
        ) {
            Text("Backend", style = AuthHeading, color = Console.text)
            Spacer(Modifier.height(8.dp))
            Text(
                "Where this app should look for the Code Undercover API.",
                style = BodyText,
                color = Console.muted,
            )
            Spacer(Modifier.height(24.dp))

            HudPanel {
                Text("SERVER ADDRESS", style = MetricLabel, color = Hud.muted)
                Spacer(Modifier.height(8.dp))
                AppInput(
                    value = state.url,
                    onValueChange = viewModel::onUrlChange,
                    placeholder = "http://192.168.1.5:3000",
                    enabled = state.loaded && !state.testing,
                    helperText = "Emulator: 10.0.2.2 is this machine. Physical device: " +
                        "your computer's LAN IP, same Wi-Fi.",
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Done,
                    ),
                )

                state.message?.let { message ->
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = "// $message",
                        style = MetricHint.copy(fontSize = 12.sp),
                        color = if (state.reachable == true) {
                            Semantic.emerald400
                        } else {
                            Semantic.red400
                        },
                    )
                }

                Spacer(Modifier.height(20.dp))
                AppButton(
                    text = if (state.testing) "Testing..." else "Save & test",
                    onClick = viewModel::testConnection,
                    modifier = Modifier.fillMaxWidth(),
                    loading = state.testing,
                    enabled = state.loaded,
                )
                Spacer(Modifier.height(8.dp))
                AppButton(
                    text = "Done",
                    onClick = onDone,
                    modifier = Modifier.fillMaxWidth(),
                    variant = ButtonVariant.Outline,
                )
            }
        }
    }
}
