package com.example.codeundercover_1.feature.settings

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.net.SettingsStore
import com.example.codeundercover_1.ui.components.AppTextField
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.PrimaryButton
import com.example.codeundercover_1.ui.components.SecondaryButton
import com.example.codeundercover_1.ui.components.TextLink
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
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
 * There is no fixed production host for this backend yet, so the app must let
 * someone point it at whatever is running: a laptop on the LAN, an emulator
 * host, or a future deployment. Baking a URL into the binary would make the
 * app untestable.
 */
class ServerSettingsViewModel : ViewModel() {

    private val settings = ServiceLocator.settings
    private val api = ServiceLocator.api

    private val _state = MutableStateFlow(ServerSettingsUiState())
    val state: StateFlow<ServerSettingsUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val current = settings.currentBaseUrl()
            _state.update { it.copy(url = current, loaded = true) }
        }
    }

    fun onUrlChange(value: String) =
        _state.update {
            it.copy(url = value, saved = false, reachable = null, message = null)
        }

    /** Saves first, then pings — a test against an unsaved URL would lie. */
    fun testConnection() {
        val target = SettingsStore.normalizeBaseUrl(_state.value.url)
        _state.update { it.copy(testing = true, message = null, reachable = null) }

        viewModelScope.launch {
            settings.setBaseUrl(target)
            // Switching backends invalidates any session cookie held for the
            // previous host.
            api.cookieJar.clear()

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
                        message = "Saved, but could not reach it: ${result.error.message}",
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
    val layout = LocalAppLayout.current
    val scroll = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .imePadding(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .verticalScroll(scroll)
                .widthIn(max = 520.dp)
                .fillMaxWidth()
                .padding(horizontal = layout.screenPadding, vertical = 24.dp),
        ) {
            Text(
                text = "Backend",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Where this app should look for the Code Undercover API.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))

            DossierCard {
                AppTextField(
                    value = state.url,
                    onValueChange = viewModel::onUrlChange,
                    label = "Server address",
                    placeholder = "http://192.168.1.5:3000",
                    enabled = state.loaded && !state.testing,
                    helperText = "Emulator: use 10.0.2.2 for this machine. " +
                        "Physical device: your computer's LAN IP, same Wi-Fi.",
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Done,
                    ),
                )

                state.message?.let { message ->
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = message,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (state.reachable == true) {
                            MaterialTheme.colorScheme.secondary
                        } else {
                            MaterialTheme.colorScheme.error
                        },
                    )
                }

                Spacer(Modifier.height(20.dp))
                PrimaryButton(
                    text = "SAVE & TEST",
                    onClick = viewModel::testConnection,
                    modifier = Modifier.fillMaxWidth(),
                    loading = state.testing,
                    enabled = state.loaded,
                )
                Spacer(Modifier.height(8.dp))
                SecondaryButton(
                    text = "DONE",
                    onClick = onDone,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Spacer(Modifier.height(16.dp))
            Text(
                text = "Start the web app with `npm run dev` on port 3000, " +
                    "then point this at that machine.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
