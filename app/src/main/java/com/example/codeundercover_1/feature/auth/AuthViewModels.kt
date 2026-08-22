package com.example.codeundercover_1.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.net.ErrorKind
import com.example.codeundercover_1.domain.Validation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

// ─── Sign in ─────────────────────────────────────────────────────────────────

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val emailError: String? = null,
    val passwordError: String? = null,
    val formError: String? = null,
    val submitting: Boolean = false,
    val authenticated: SessionUser? = null,
)

class LoginViewModel : ViewModel() {

    private val auth = ServiceLocator.auth

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    fun onEmailChange(value: String) =
        _state.update { it.copy(email = value, emailError = null, formError = null) }

    fun onPasswordChange(value: String) =
        _state.update { it.copy(password = value, passwordError = null, formError = null) }

    fun submit() {
        val current = _state.value
        if (current.submitting) return

        val emailError = Validation.email(current.email)
        val passwordError = if (current.password.isEmpty()) "Enter your password." else null
        if (emailError != null || passwordError != null) {
            _state.update { it.copy(emailError = emailError, passwordError = passwordError) }
            return
        }

        _state.update { it.copy(submitting = true, formError = null) }

        viewModelScope.launch {
            when (val result = auth.signIn(current.email, current.password)) {
                is ApiResult.Success ->
                    _state.update { it.copy(submitting = false, authenticated = result.data) }

                is ApiResult.Failure -> {
                    // "No such account" is worth distinguishing from "wrong
                    // password" here. The credentials endpoint deliberately
                    // returns the same error for both, so ask check-user —
                    // the web login page does exactly this too.
                    val refined =
                        if (result.error.kind == ErrorKind.Unauthorized) {
                            when (val exists = auth.accountExists(current.email)) {
                                is ApiResult.Success ->
                                    if (!exists.data) {
                                        "No agent is registered with that email."
                                    } else {
                                        result.error.message
                                    }

                                is ApiResult.Failure -> result.error.message
                            }
                        } else {
                            result.error.message
                        }

                    _state.update { it.copy(submitting = false, formError = refined) }
                }
            }
        }
    }

    fun consumeAuthentication() = _state.update { it.copy(authenticated = null) }
}

// ─── Register ────────────────────────────────────────────────────────────────

data class RegisterUiState(
    val name: String = "",
    val codename: String = "",
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val language: String = "C",
    val nameError: String? = null,
    val codenameError: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val confirmError: String? = null,
    val formError: String? = null,
    val submitting: Boolean = false,
    val registered: Boolean = false,
)

class RegisterViewModel : ViewModel() {

    private val auth = ServiceLocator.auth

    private val _state = MutableStateFlow(RegisterUiState())
    val state: StateFlow<RegisterUiState> = _state.asStateFlow()

    fun onNameChange(value: String) =
        _state.update { it.copy(name = value, nameError = null, formError = null) }

    fun onCodenameChange(value: String) =
        _state.update { it.copy(codename = value, codenameError = null, formError = null) }

    fun onEmailChange(value: String) =
        _state.update { it.copy(email = value, emailError = null, formError = null) }

    fun onPasswordChange(value: String) =
        _state.update { it.copy(password = value, passwordError = null, formError = null) }

    fun onConfirmChange(value: String) =
        _state.update { it.copy(confirmPassword = value, confirmError = null, formError = null) }

    fun onLanguageChange(value: String) = _state.update { it.copy(language = value) }

    fun submit() {
        val current = _state.value
        if (current.submitting) return

        val nameError = Validation.name(current.name)
        val codenameError = Validation.codename(current.codename)
        val emailError = Validation.email(current.email)
        val passwordError = Validation.password(current.password)
        val confirmError =
            Validation.confirmPassword(current.password, current.confirmPassword)

        if (listOfNotNull(nameError, codenameError, emailError, passwordError, confirmError)
                .isNotEmpty()
        ) {
            _state.update {
                it.copy(
                    nameError = nameError,
                    codenameError = codenameError,
                    emailError = emailError,
                    passwordError = passwordError,
                    confirmError = confirmError,
                )
            }
            return
        }

        _state.update { it.copy(submitting = true, formError = null) }

        viewModelScope.launch {
            val result = auth.register(
                name = current.name,
                username = current.codename,
                email = current.email,
                password = current.password,
                preferredLanguage = current.language,
            )

            when (result) {
                is ApiResult.Success ->
                    _state.update { it.copy(submitting = false, registered = true) }

                is ApiResult.Failure -> {
                    // A 409 is always about the codename or the email; route it
                    // to the field it belongs to instead of a generic banner.
                    val message = result.error.message
                    val isCodenameClash =
                        result.error.kind == ErrorKind.Conflict &&
                            message.contains("codename", ignoreCase = true)

                    _state.update {
                        it.copy(
                            submitting = false,
                            codenameError = if (isCodenameClash) message else null,
                            formError = if (isCodenameClash) null else message,
                        )
                    }
                }
            }
        }
    }
}

// ─── Forgot / reset password ─────────────────────────────────────────────────

data class ForgotPasswordUiState(
    val email: String = "",
    val emailError: String? = null,
    val formError: String? = null,
    val submitting: Boolean = false,
    val sent: Boolean = false,
)

class ForgotPasswordViewModel : ViewModel() {

    private val auth = ServiceLocator.auth

    private val _state = MutableStateFlow(ForgotPasswordUiState())
    val state: StateFlow<ForgotPasswordUiState> = _state.asStateFlow()

    fun onEmailChange(value: String) =
        _state.update { it.copy(email = value, emailError = null, formError = null) }

    fun submit() {
        val current = _state.value
        if (current.submitting) return

        val emailError = Validation.email(current.email)
        if (emailError != null) {
            _state.update { it.copy(emailError = emailError) }
            return
        }

        _state.update { it.copy(submitting = true, formError = null) }
        viewModelScope.launch {
            when (val result = auth.requestPasswordReset(current.email)) {
                is ApiResult.Success ->
                    _state.update { it.copy(submitting = false, sent = true) }

                is ApiResult.Failure ->
                    _state.update {
                        it.copy(submitting = false, formError = result.error.message)
                    }
            }
        }
    }
}

data class ResetPasswordUiState(
    val token: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val tokenError: String? = null,
    val passwordError: String? = null,
    val confirmError: String? = null,
    val formError: String? = null,
    val submitting: Boolean = false,
    val done: Boolean = false,
)

class ResetPasswordViewModel : ViewModel() {

    private val auth = ServiceLocator.auth

    private val _state = MutableStateFlow(ResetPasswordUiState())
    val state: StateFlow<ResetPasswordUiState> = _state.asStateFlow()

    fun onTokenChange(value: String) =
        _state.update { it.copy(token = value, tokenError = null, formError = null) }

    fun onPasswordChange(value: String) =
        _state.update { it.copy(password = value, passwordError = null, formError = null) }

    fun onConfirmChange(value: String) =
        _state.update { it.copy(confirmPassword = value, confirmError = null, formError = null) }

    fun submit() {
        val current = _state.value
        if (current.submitting) return

        val tokenError = if (current.token.isBlank()) "Paste the reset code from your email." else null
        val passwordError = Validation.password(current.password)
        val confirmError = Validation.confirmPassword(current.password, current.confirmPassword)

        if (listOfNotNull(tokenError, passwordError, confirmError).isNotEmpty()) {
            _state.update {
                it.copy(
                    tokenError = tokenError,
                    passwordError = passwordError,
                    confirmError = confirmError,
                )
            }
            return
        }

        _state.update { it.copy(submitting = true, formError = null) }
        viewModelScope.launch {
            when (val result = auth.resetPassword(current.token, current.password)) {
                is ApiResult.Success ->
                    _state.update { it.copy(submitting = false, done = true) }

                is ApiResult.Failure ->
                    _state.update {
                        it.copy(submitting = false, formError = result.error.message)
                    }
            }
        }
    }
}
