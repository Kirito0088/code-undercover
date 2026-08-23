package com.example.codeundercover_1.feature.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.domain.Validation
import com.example.codeundercover_1.ui.components.AppButton
import com.example.codeundercover_1.ui.components.AppInput
import com.example.codeundercover_1.ui.components.ButtonVariant
import com.example.codeundercover_1.ui.components.ErrorBanner
import com.example.codeundercover_1.ui.hud.BadgeTone
import com.example.codeundercover_1.ui.hud.HudBadge
import com.example.codeundercover_1.ui.hud.HudPage
import com.example.codeundercover_1.ui.hud.HudPanel
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricHint
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.Semantic
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val name: String = "",
    val codename: String = "",
    val email: String = "",
    val nameError: String? = null,
    val codenameError: String? = null,
    val emailError: String? = null,
    val saving: Boolean = false,
    val savedMessage: String? = null,
    val formError: String? = null,
    val deleting: Boolean = false,
    val deleted: Boolean = false,
)

class ProfileViewModel(user: SessionUser) : ViewModel() {

    private val repo = ServiceLocator.profile

    private val _state = MutableStateFlow(
        ProfileUiState(
            name = user.name.orEmpty(),
            codename = user.username.orEmpty(),
            email = user.email.orEmpty(),
        )
    )
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    fun onNameChange(value: String) =
        _state.update { it.copy(name = value, nameError = null, savedMessage = null) }

    fun onCodenameChange(value: String) =
        _state.update { it.copy(codename = value, codenameError = null, savedMessage = null) }

    fun onEmailChange(value: String) =
        _state.update { it.copy(email = value, emailError = null, savedMessage = null) }

    fun save() {
        val current = _state.value
        if (current.saving) return

        val nameError = Validation.name(current.name)
        val codenameError = Validation.codename(current.codename)
        val emailError = Validation.email(current.email)

        if (listOfNotNull(nameError, codenameError, emailError).isNotEmpty()) {
            _state.update {
                it.copy(
                    nameError = nameError,
                    codenameError = codenameError,
                    emailError = emailError,
                )
            }
            return
        }

        _state.update { it.copy(saving = true, formError = null, savedMessage = null) }
        viewModelScope.launch {
            val result = repo.update(
                name = current.name.trim(),
                email = current.email.trim().lowercase(),
                username = current.codename.trim(),
            )

            when (result) {
                is ApiResult.Success ->
                    _state.update { it.copy(saving = false, savedMessage = "Profile updated.") }

                is ApiResult.Failure -> {
                    // A 409 is always about the codename or the email; route it
                    // to the field it belongs to rather than a generic banner.
                    val message = result.error.message
                    val codenameClash = message.contains("codename", ignoreCase = true)
                    val emailClash = message.contains("email", ignoreCase = true)
                    _state.update {
                        it.copy(
                            saving = false,
                            codenameError = if (codenameClash) message else null,
                            emailError = if (emailClash && !codenameClash) message else null,
                            formError = if (!codenameClash && !emailClash) message else null,
                        )
                    }
                }
            }
        }
    }

    fun deleteAccount() {
        if (_state.value.deleting) return
        _state.update { it.copy(deleting = true, formError = null) }
        viewModelScope.launch {
            when (val result = repo.deleteAccount()) {
                is ApiResult.Success ->
                    _state.update { it.copy(deleting = false, deleted = true) }

                is ApiResult.Failure ->
                    _state.update { it.copy(deleting = false, formError = result.error.message) }
            }
        }
    }
}

@Composable
fun ProfileScreen(
    user: SessionUser,
    onSignOut: () -> Unit,
) {
    val viewModel: ProfileViewModel = viewModel(
        key = user.id,
        factory = viewModelFactory { initializer { ProfileViewModel(user) } },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    val scroll = rememberScrollState()
    var confirmingDelete by remember { mutableStateOf(false) }

    if (state.deleted) {
        // The server already cleared the session cookie; drop local state so
        // the app returns to sign-in.
        onSignOut()
    }

    Column(
        Modifier
            .imePadding()
            .verticalScroll(scroll)
    ) {
        HudPage(
            eyebrow = "Operative",
            title = "Profile",
            subtitle = user.username ?: user.name ?: "agent",
            status = { HudBadge(text = "OPEN", tone = BadgeTone.Active) },
        ) {
            HudPanel {
                Text("IDENTITY", style = MetricLabel, color = Hud.muted)
                Spacer(Modifier.height(12.dp))

                AppInput(
                    value = state.name,
                    onValueChange = viewModel::onNameChange,
                    label = "Name",
                    errorText = state.nameError,
                    enabled = !state.saving,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                )
                Spacer(Modifier.height(16.dp))
                AppInput(
                    value = state.codename,
                    onValueChange = viewModel::onCodenameChange,
                    label = "Codename",
                    errorText = state.codenameError,
                    helperText = "3–20 characters. Letters, numbers, _ and - only.",
                    enabled = !state.saving,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                )
                Spacer(Modifier.height(16.dp))
                AppInput(
                    value = state.email,
                    onValueChange = viewModel::onEmailChange,
                    label = "Email",
                    errorText = state.emailError,
                    enabled = !state.saving,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Done,
                    ),
                )

                state.formError?.let {
                    Spacer(Modifier.height(12.dp))
                    ErrorBanner(it)
                }
                state.savedMessage?.let {
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "// $it",
                        style = MetricHint.copy(fontSize = 12.sp),
                        color = Semantic.emerald400,
                    )
                }

                Spacer(Modifier.height(20.dp))
                AppButton(
                    text = if (state.saving) "Saving..." else "Save changes",
                    onClick = viewModel::save,
                    modifier = Modifier.fillMaxWidth(),
                    loading = state.saving,
                )
            }

            HudPanel {
                Text("SESSION", style = MetricLabel, color = Hud.muted)
                Spacer(Modifier.height(12.dp))
                AppButton(
                    text = "Sign out",
                    onClick = onSignOut,
                    modifier = Modifier.fillMaxWidth(),
                    variant = ButtonVariant.Secondary,
                )
            }

            HudPanel(borderColor = Semantic.errorBorder) {
                Text("DANGER ZONE", style = MetricLabel, color = Semantic.red400)
                Spacer(Modifier.height(8.dp))
                Text(
                    "Deleting your account removes every mission record. This cannot be undone.",
                    style = MetricHint,
                    color = Hud.muted,
                )
                Spacer(Modifier.height(12.dp))
                AppButton(
                    text = "Delete account",
                    onClick = { confirmingDelete = true },
                    modifier = Modifier.fillMaxWidth(),
                    variant = ButtonVariant.Destructive,
                    enabled = !state.deleting,
                )
            }

            Spacer(Modifier.height(24.dp))
        }
    }

    if (confirmingDelete) {
        AlertDialog(
            onDismissRequest = { confirmingDelete = false },
            containerColor = Hud.surface,
            titleContentColor = Hud.text,
            textContentColor = Hud.muted,
            title = { Text("Delete account?") },
            text = {
                Text(
                    "This permanently removes your agent file, aura and mission " +
                        "history. It cannot be undone."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmingDelete = false
                        viewModel.deleteAccount()
                    }
                ) {
                    Text("DELETE", color = Semantic.red400)
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmingDelete = false }) {
                    Text("CANCEL", color = Hud.muted)
                }
            },
        )
    }
}

