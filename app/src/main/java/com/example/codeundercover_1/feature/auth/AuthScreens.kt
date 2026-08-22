package com.example.codeundercover_1.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.domain.Validation
import com.example.codeundercover_1.ui.components.AppTextField
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.PrimaryButton
import com.example.codeundercover_1.ui.components.TextLink
import com.example.codeundercover_1.ui.responsive.LocalAppLayout

/**
 * Forms get a fixed reading width even on a tablet. A login field stretched to
 * 1000dp is harder to use, not easier, so the card centres instead of filling.
 */
private val FormMaxWidth = 460.dp

@Composable
private fun AuthScaffold(
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val layout = LocalAppLayout.current
    val scroll = rememberScrollState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .imePadding(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .verticalScroll(scroll)
                .widthIn(max = FormMaxWidth)
                .fillMaxWidth()
                .padding(horizontal = layout.screenPadding, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "CODE UNDERCOVER",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(24.dp))

            DossierCard(content = content)

            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun FormError(message: String?) {
    if (message == null) return
    Spacer(Modifier.height(12.dp))
    Text(
        text = message,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.error,
    )
}

// ─── Login ───────────────────────────────────────────────────────────────────

@Composable
fun LoginScreen(
    onAuthenticated: (SessionUser) -> Unit,
    onRegister: () -> Unit,
    onForgotPassword: () -> Unit,
    onServerSettings: () -> Unit,
    viewModel: LoginViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.authenticated) {
        state.authenticated?.let {
            onAuthenticated(it)
            viewModel.consumeAuthentication()
        }
    }

    AuthScaffold(
        title = "Agent Sign-In",
        subtitle = "Identify yourself to access the case files.",
    ) {
        AppTextField(
            value = state.email,
            onValueChange = viewModel::onEmailChange,
            label = "Email",
            placeholder = "agent@codeundercover.com",
            errorText = state.emailError,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(Modifier.height(14.dp))
        AppTextField(
            value = state.password,
            onValueChange = viewModel::onPasswordChange,
            label = "Password",
            errorText = state.passwordError,
            isPassword = true,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
            ),
        )

        FormError(state.formError)

        Spacer(Modifier.height(20.dp))
        PrimaryButton(
            text = "SIGN IN",
            onClick = viewModel::submit,
            modifier = Modifier.fillMaxWidth(),
            loading = state.submitting,
        )

        Spacer(Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextLink(text = "Forgot password?", onClick = onForgotPassword)
            TextLink(text = "Register", onClick = onRegister)
        }

        Spacer(Modifier.height(4.dp))
        TextLink(text = "Server settings", onClick = onServerSettings)
    }
}

// ─── Register ────────────────────────────────────────────────────────────────

@Composable
fun RegisterScreen(
    onRegistered: () -> Unit,
    onBackToLogin: () -> Unit,
    viewModel: RegisterViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.registered) {
        if (state.registered) onRegistered()
    }

    AuthScaffold(
        title = "Recruit an Agent",
        subtitle = "Register to begin the training programme.",
    ) {
        AppTextField(
            value = state.name,
            onValueChange = viewModel::onNameChange,
            label = "Name",
            errorText = state.nameError,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Words,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(Modifier.height(14.dp))
        AppTextField(
            value = state.codename,
            onValueChange = viewModel::onCodenameChange,
            label = "Codename",
            placeholder = "shadow_fox",
            errorText = state.codenameError,
            helperText = "3–20 characters. Letters, numbers, _ and - only.",
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
        )
        Spacer(Modifier.height(14.dp))
        AppTextField(
            value = state.email,
            onValueChange = viewModel::onEmailChange,
            label = "Email",
            errorText = state.emailError,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(Modifier.height(14.dp))
        AppTextField(
            value = state.password,
            onValueChange = viewModel::onPasswordChange,
            label = "Password",
            errorText = state.passwordError,
            helperText = "At least 8 characters.",
            isPassword = true,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(Modifier.height(14.dp))
        AppTextField(
            value = state.confirmPassword,
            onValueChange = viewModel::onConfirmChange,
            label = "Confirm password",
            errorText = state.confirmError,
            isPassword = true,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
            ),
        )

        Spacer(Modifier.height(18.dp))
        Text(
            text = "PREFERRED TRACK",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.primary,
        )
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Validation.LANGUAGES.forEach { language ->
                FilterChip(
                    selected = state.language == language,
                    onClick = { viewModel.onLanguageChange(language) },
                    enabled = !state.submitting,
                    label = { Text(language, style = MaterialTheme.typography.labelSmall) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    ),
                )
            }
        }

        FormError(state.formError)

        Spacer(Modifier.height(20.dp))
        PrimaryButton(
            text = "REGISTER",
            onClick = viewModel::submit,
            modifier = Modifier.fillMaxWidth(),
            loading = state.submitting,
        )
        Spacer(Modifier.height(4.dp))
        TextLink(text = "Already have clearance? Sign in", onClick = onBackToLogin)
    }
}

// ─── Forgot password ─────────────────────────────────────────────────────────

@Composable
fun ForgotPasswordScreen(
    onBackToLogin: () -> Unit,
    onHaveCode: () -> Unit,
    viewModel: ForgotPasswordViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    AuthScaffold(
        title = "Lost Credentials",
        subtitle = "We will send a reset code to your registered email.",
    ) {
        if (state.sent) {
            Text(
                text = "If that email is registered, a reset code is on its way. " +
                    "Check your inbox, then enter the code on the next screen.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(20.dp))
            PrimaryButton(
                text = "I HAVE A CODE",
                onClick = onHaveCode,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(4.dp))
            TextLink(text = "Back to sign-in", onClick = onBackToLogin)
            return@AuthScaffold
        }

        AppTextField(
            value = state.email,
            onValueChange = viewModel::onEmailChange,
            label = "Email",
            errorText = state.emailError,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Done,
            ),
        )

        FormError(state.formError)

        Spacer(Modifier.height(20.dp))
        PrimaryButton(
            text = "SEND RESET CODE",
            onClick = viewModel::submit,
            modifier = Modifier.fillMaxWidth(),
            loading = state.submitting,
        )
        Spacer(Modifier.height(4.dp))
        TextLink(text = "Back to sign-in", onClick = onBackToLogin)
    }
}

// ─── Reset password ──────────────────────────────────────────────────────────

@Composable
fun ResetPasswordScreen(
    onDone: () -> Unit,
    onBackToLogin: () -> Unit,
    viewModel: ResetPasswordViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.done) {
        if (state.done) onDone()
    }

    AuthScaffold(
        title = "New Credentials",
        subtitle = "Enter the code from your email and choose a new password.",
    ) {
        AppTextField(
            value = state.token,
            onValueChange = viewModel::onTokenChange,
            label = "Reset code",
            errorText = state.tokenError,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
        )
        Spacer(Modifier.height(14.dp))
        AppTextField(
            value = state.password,
            onValueChange = viewModel::onPasswordChange,
            label = "New password",
            errorText = state.passwordError,
            helperText = "At least 8 characters.",
            isPassword = true,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(Modifier.height(14.dp))
        AppTextField(
            value = state.confirmPassword,
            onValueChange = viewModel::onConfirmChange,
            label = "Confirm new password",
            errorText = state.confirmError,
            isPassword = true,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
            ),
        )

        FormError(state.formError)

        Spacer(Modifier.height(20.dp))
        PrimaryButton(
            text = "SET NEW PASSWORD",
            onClick = viewModel::submit,
            modifier = Modifier.fillMaxWidth(),
            loading = state.submitting,
        )
        Spacer(Modifier.height(4.dp))
        TextLink(text = "Back to sign-in", onClick = onBackToLogin)
    }
}
