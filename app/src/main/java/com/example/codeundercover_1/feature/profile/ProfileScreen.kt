package com.example.codeundercover_1.feature.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
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
import com.example.codeundercover_1.ui.components.AppTextField
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.PrimaryButton
import com.example.codeundercover_1.ui.components.ResponsiveContent
import com.example.codeundercover_1.ui.components.SecondaryButton
import com.example.codeundercover_1.ui.components.SectionHeader
import com.example.codeundercover_1.ui.theme.Noir
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
                is ApiResult.Success -> _state.update {
                    it.copy(saving = false, savedMessage = "Profile updated.")
                }

                is ApiResult.Failure -> {
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
                    _state.update {
                        it.copy(deleting = false, formError = result.error.message)
                    }
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
        // The server already cleared the session cookie; drop the local state
        // so the app returns to the sign-in screen.
        onSignOut()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .imePadding()
            .verticalScroll(scroll),
    ) {
        ResponsiveContent {
            Spacer(Modifier.height(12.dp))
            Text(
                "Agent File",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                "Your identity on the network.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(20.dp))
            DossierCard {
                SectionHeader("Identity")
                AppTextField(
                    value = state.name,
                    onValueChange = viewModel::onNameChange,
                    label = "Name",
                    errorText = state.nameError,
                    enabled = !state.saving,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                )
                Spacer(Modifier.height(12.dp))
                AppTextField(
                    value = state.codename,
                    onValueChange = viewModel::onCodenameChange,
                    label = "Codename",
                    errorText = state.codenameError,
                    helperText = "3–20 characters. Letters, numbers, _ and - only.",
                    enabled = !state.saving,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                )
                Spacer(Modifier.height(12.dp))
                AppTextField(
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

                state.formError?.let { message ->
                    Spacer(Modifier.height(10.dp))
                    Text(
                        message,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
                state.savedMessage?.let { message ->
                    Spacer(Modifier.height(10.dp))
                    Text(
                        message,
                        style = MaterialTheme.typography.bodySmall,
                        color = Noir.mossBright,
                    )
                }

                Spacer(Modifier.height(18.dp))
                PrimaryButton(
                    text = "SAVE CHANGES",
                    onClick = viewModel::save,
                    modifier = Modifier.fillMaxWidth(),
                    loading = state.saving,
                )
            }

            Spacer(Modifier.height(20.dp))
            SectionHeader("Session")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SecondaryButton(
                    text = "SIGN OUT",
                    onClick = onSignOut,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Spacer(Modifier.height(28.dp))
            SectionHeader("Danger zone")
            Text(
                "Deleting your account removes every mission record and cannot be undone.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(10.dp))
            SecondaryButton(
                text = "DELETE ACCOUNT",
                onClick = { confirmingDelete = true },
                enabled = !state.deleting,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(32.dp))
        }
    }

    if (confirmingDelete) {
        AlertDialog(
            onDismissRequest = { confirmingDelete = false },
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
                    Text("DELETE", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmingDelete = false }) { Text("CANCEL") }
            },
        )
    }
}
