package com.example.codeundercover_1.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.domain.Validation
import com.example.codeundercover_1.ui.components.AppButton
import com.example.codeundercover_1.ui.components.AppInput
import com.example.codeundercover_1.ui.components.ButtonVariant
import com.example.codeundercover_1.ui.components.ErrorBanner
import com.example.codeundercover_1.ui.components.OrDivider
import com.example.codeundercover_1.ui.effects.LetterGlitch
import com.example.codeundercover_1.ui.theme.AuthHeading
import com.example.codeundercover_1.ui.theme.BodyText
import com.example.codeundercover_1.ui.theme.Console
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MonoFont
import com.example.codeundercover_1.ui.theme.Semantic

/*
 * Ports of the app/(auth) route group. The login screen and the register screen are styled
 * differently in the web app — login is the plain console card, register is the
 * mono "intake terminal" with gold CTAs — and that difference is preserved here
 * rather than unified.
 */

/** `max-w-sm` — 384px. */
private val AuthMaxWidth = 384.dp

/** `rounded-2xl` on both auth cards. */
private val AuthCardShape = RoundedCornerShape(16.dp)

/**
 * `app/(auth)/layout.tsx`: the LetterGlitch canvas is fixed behind every auth
 * route at 40% opacity, and it persists across login/register navigation.
 */
@Composable
private fun AuthScaffold(
    heading: String?,
    subheading: String?,
    content: @Composable ColumnScope.() -> Unit,
) {
    val scroll = rememberScrollState()

    Box(modifier = Modifier.fillMaxSize().background(Hud.bg)) {
        LetterGlitch()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .imePadding()
                .verticalScroll(scroll)
                .padding(horizontal = 16.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Column(
                modifier = Modifier.widthIn(max = AuthMaxWidth).fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                if (heading != null) {
                    Text(text = heading, style = AuthHeading, color = Console.text)
                }
                if (subheading != null) {
                    Spacer(Modifier.height(8.dp)) // mt-2
                    Text(
                        text = subheading,
                        style = BodyText,
                        color = Console.muted,
                        textAlign = TextAlign.Center,
                    )
                }
                if (heading != null) Spacer(Modifier.height(32.dp)) // mt-8

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(AuthCardShape)
                        .background(Console.panel)
                        .border(1.dp, Console.border, AuthCardShape)
                        .padding(32.dp), // p-8
                    content = content,
                )
            }
        }
    }
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
    var rememberMe by remember { mutableStateOf(false) }

    LaunchedEffect(state.authenticated) {
        state.authenticated?.let {
            onAuthenticated(it)
            viewModel.consumeAuthentication()
        }
    }

    AuthScaffold(
        heading = "Welcome back",
        subheading = "Continue your learning journey",
    ) {
        if (state.formError != null) {
            ErrorBanner(state.formError!!)
            Spacer(Modifier.height(24.dp)) // space-y-6
        }

        AppInput(
            value = state.email,
            onValueChange = viewModel::onEmailChange,
            label = "Email Address",
            placeholder = "name@email.com",
            errorText = state.emailError,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
            ),
        )

        Spacer(Modifier.height(24.dp))

        AppInput(
            value = state.password,
            onValueChange = viewModel::onPasswordChange,
            label = "Password",
            placeholder = "••••••••",
            errorText = state.passwordError,
            isPassword = true,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
            ),
        )

        Spacer(Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = rememberMe,
                    onCheckedChange = { rememberMe = it },
                    colors = CheckboxDefaults.colors(
                        checkedColor = Hud.accent,
                        uncheckedColor = Console.border,
                        checkmarkColor = Console.panel,
                    ),
                    modifier = Modifier.size(20.dp),
                )
                Spacer(Modifier.size(8.dp)) // ml-2
                Text(
                    text = "Remember me",
                    style = BodyText.copy(fontSize = 12.sp),
                    color = Console.muted,
                )
            }
            Text(
                text = "Forgot password?",
                style = BodyText.copy(fontSize = 12.sp),
                color = Console.link,
                modifier = Modifier.clickable(onClick = onForgotPassword),
            )
        }

        Spacer(Modifier.height(24.dp))

        AppButton(
            text = if (state.submitting) "Signing in..." else "Sign In",
            onClick = viewModel::submit,
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.submitting,
        )

        Spacer(Modifier.height(24.dp)) // mt-6
        OrDivider()
        Spacer(Modifier.height(24.dp))

        GoogleButton(onClick = onServerSettings, label = "Sign in with Google")

        Spacer(Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Don't have an account? ",
                style = BodyText.copy(fontSize = 12.sp),
                color = Console.muted,
            )
            Text(
                text = "Sign up",
                style = BodyText.copy(fontSize = 12.sp),
                color = Console.link,
                modifier = Modifier.clickable(onClick = onRegister),
            )
        }
    }
}

/**
 * The web renders a Google button on the login card. Android cannot complete
 * NextAuth's OAuth handshake in-process — the callback sets a cookie on the
 * browser, not on this app's jar — so tapping it opens the server settings
 * sheet where the flow can be completed on the web. Kept visually identical so
 * the card matches; see the README for what a real in-app flow would need.
 */
@Composable
private fun GoogleButton(onClick: () -> Unit, label: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(42.dp) // py-2.5 on a text-sm line
            .clip(RoundedCornerShape(6.dp))
            .background(Console.deep)
            .border(1.dp, Console.border, RoundedCornerShape(6.dp))
            .clickable(onClick = onClick),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = "G", style = BodyText.copy(fontSize = 16.sp), color = Semantic.emerald400)
        Spacer(Modifier.size(12.dp)) // gap-3
        Text(text = label, style = BodyText, color = Console.muted)
    }
}

// ─── Register: step 1, agent intake ──────────────────────────────────────────

@Composable
fun RegisterScreen(
    onRegistered: () -> Unit,
    onBackToLogin: () -> Unit,
    viewModel: RegisterViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var step by remember { mutableStateOf(1) }

    LaunchedEffect(state.registered) {
        if (state.registered) onRegistered()
    }

    val step1Valid = Validation.name(state.name) == null &&
        Validation.codename(state.codename) == null &&
        Validation.email(state.email) == null &&
        Validation.password(state.password) == null

    AuthScaffold(heading = null, subheading = null) {
        if (step == 1) {
            Text(
                text = "Classification Level: Unclassified until selection",
                style = androidx.compose.ui.text.TextStyle(
                    fontFamily = MonoFont,
                    fontSize = 12.sp,
                    letterSpacing = 1.2.sp, // tracking-widest
                ),
                color = Console.labelGray,
            )
            Spacer(Modifier.height(24.dp)) // mb-6

            IntakeField(
                label = "Agent Name",
                value = state.name,
                onValueChange = viewModel::onNameChange,
                placeholder = "Enter full real name",
                error = state.nameError,
                enabled = !state.submitting,
                capitalization = KeyboardCapitalization.Words,
            )
            Spacer(Modifier.height(24.dp))
            IntakeField(
                label = "Codename",
                value = state.codename,
                onValueChange = viewModel::onCodenameChange,
                placeholder = "Akshat_09",
                error = state.codenameError,
                enabled = !state.submitting,
            )
            Spacer(Modifier.height(24.dp))
            IntakeField(
                label = "Secure Mail",
                value = state.email,
                onValueChange = viewModel::onEmailChange,
                placeholder = "name@secure-mail.com",
                error = state.emailError,
                enabled = !state.submitting,
                keyboardType = KeyboardType.Email,
            )
            Spacer(Modifier.height(24.dp))
            IntakeField(
                label = "Passphrase",
                value = state.password,
                onValueChange = viewModel::onPasswordChange,
                placeholder = "••••••••",
                error = state.passwordError,
                enabled = !state.submitting,
                isPassword = true,
                keyboardType = KeyboardType.Password,
            )

            if (state.formError != null) {
                Spacer(Modifier.height(16.dp))
                ErrorBanner(state.formError!!)
            }

            Spacer(Modifier.height(24.dp))
            GoldButton(
                text = "PROCEED TO LANGUAGE SELECTION",
                enabled = step1Valid,
                onClick = { step = 2 },
            )

            Spacer(Modifier.height(24.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = "Already enlisted? ",
                    style = androidx.compose.ui.text.TextStyle(
                        fontFamily = MonoFont,
                        fontSize = 12.sp,
                    ),
                    color = Console.labelGray,
                )
                Text(
                    text = "Log in",
                    style = androidx.compose.ui.text.TextStyle(
                        fontFamily = MonoFont,
                        fontSize = 12.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                    ),
                    color = Console.gold,
                    modifier = Modifier.clickable(onClick = onBackToLogin),
                )
            }
        } else {
            DossierSelection(
                selected = state.language,
                submitting = state.submitting,
                error = state.formError,
                onSelect = viewModel::onLanguageChange,
                onConfirm = viewModel::submit,
                onAbort = { step = 1 },
            )
        }
    }
}

/** `text-xs font-mono text-[#6B6B6B] tracking-wider uppercase mb-1` + input. */
@Composable
private fun IntakeField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    error: String?,
    enabled: Boolean,
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.None,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = label.uppercase(),
            style = androidx.compose.ui.text.TextStyle(
                fontFamily = MonoFont,
                fontSize = 12.sp,
                letterSpacing = 0.6.sp, // tracking-wider
            ),
            color = Console.labelGray,
        )
        Spacer(Modifier.height(4.dp)) // mb-1
        AppInput(
            value = value,
            onValueChange = onValueChange,
            placeholder = placeholder,
            errorText = error,
            enabled = enabled,
            isPassword = isPassword,
            minHeight = 48.dp, // py-3
            textStyle = BodyText.copy(fontFamily = MonoFont),
            keyboardOptions = KeyboardOptions(
                keyboardType = keyboardType,
                capitalization = capitalization,
                imeAction = ImeAction.Next,
            ),
        )
    }
}

/**
 * `bg-[#C9A84C] text-[#0D0E12] font-mono text-sm font-bold uppercase
 * tracking-wider`, falling back to the muted disabled fill.
 */
@Composable
private fun GoldButton(text: String, enabled: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(6.dp)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp) // py-3
            .clip(shape)
            .background(if (enabled) Console.gold else Console.disabledFill)
            .then(
                if (enabled) Modifier else Modifier.border(1.dp, Console.border, shape)
            )
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = androidx.compose.ui.text.TextStyle(
                fontFamily = MonoFont,
                fontSize = 14.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                letterSpacing = 0.7.sp,
            ),
            color = if (enabled) Console.panel else Console.placeholder,
            textAlign = TextAlign.Center,
        )
    }
}

/** Step 2 — pick the track the agent enlists into. */
@Composable
private fun DossierSelection(
    selected: String,
    submitting: Boolean,
    error: String?,
    onSelect: (String) -> Unit,
    onConfirm: () -> Unit,
    onAbort: () -> Unit,
) {
    Text(
        text = "Select Your Field of Operation",
        style = androidx.compose.ui.text.TextStyle(
            fontFamily = MonoFont,
            fontSize = 12.sp,
            letterSpacing = 1.2.sp,
        ),
        color = Console.labelGray,
    )
    Spacer(Modifier.height(24.dp))

    Validation.LANGUAGES.forEach { language ->
        val isSelected = selected == language
        val shape = RoundedCornerShape(6.dp)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .padding(bottom = 4.dp)
                .clip(shape)
                .background(if (isSelected) Console.gold else Console.deep)
                .border(1.dp, if (isSelected) Console.gold else Console.border, shape)
                .clickable(enabled = !submitting) { onSelect(language) },
            contentAlignment = Alignment.CenterStart,
        ) {
            Text(
                text = language.uppercase(),
                style = androidx.compose.ui.text.TextStyle(
                    fontFamily = MonoFont,
                    fontSize = 14.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                    letterSpacing = 0.7.sp,
                ),
                color = if (isSelected) Console.panel else Console.muted,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }
        Spacer(Modifier.height(8.dp))
    }

    if (error != null) {
        Spacer(Modifier.height(16.dp))
        ErrorBanner(error)
    }

    Spacer(Modifier.height(16.dp))
    GoldButton(
        text = if (submitting) "TRANSMITTING..." else "CONFIRM ENLISTMENT",
        enabled = !submitting,
        onClick = onConfirm,
    )
    Spacer(Modifier.height(12.dp))
    AppButton(
        text = "Abort",
        onClick = onAbort,
        modifier = Modifier.fillMaxWidth(),
        variant = ButtonVariant.Outline,
        enabled = !submitting,
    )
}

// ─── Forgot / reset ──────────────────────────────────────────────────────────

@Composable
fun ForgotPasswordScreen(
    onBackToLogin: () -> Unit,
    onHaveCode: () -> Unit,
    viewModel: ForgotPasswordViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    AuthScaffold(
        heading = "Reset access",
        subheading = "We will send a reset code to your registered email",
    ) {
        if (state.sent) {
            Text(
                text = "If that email is registered, a reset code is on its way.",
                style = BodyText,
                color = Console.text,
            )
            Spacer(Modifier.height(24.dp))
            AppButton(
                text = "I have a code",
                onClick = onHaveCode,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(12.dp))
            AppButton(
                text = "Back to sign in",
                onClick = onBackToLogin,
                modifier = Modifier.fillMaxWidth(),
                variant = ButtonVariant.Outline,
            )
            return@AuthScaffold
        }

        if (state.formError != null) {
            ErrorBanner(state.formError!!)
            Spacer(Modifier.height(24.dp))
        }

        AppInput(
            value = state.email,
            onValueChange = viewModel::onEmailChange,
            label = "Email Address",
            placeholder = "name@email.com",
            errorText = state.emailError,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Done,
            ),
        )
        Spacer(Modifier.height(24.dp))
        AppButton(
            text = if (state.submitting) "Sending..." else "Send reset code",
            onClick = viewModel::submit,
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.submitting,
        )
        Spacer(Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Back to sign in",
                style = BodyText.copy(fontSize = 12.sp),
                color = Console.link,
                modifier = Modifier.clickable(onClick = onBackToLogin),
            )
        }
    }
}

@Composable
fun ResetPasswordScreen(
    onDone: () -> Unit,
    onBackToLogin: () -> Unit,
    viewModel: ResetPasswordViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.done) { if (state.done) onDone() }

    AuthScaffold(
        heading = "New credentials",
        subheading = "Enter the code from your email and choose a new password",
    ) {
        if (state.formError != null) {
            ErrorBanner(state.formError!!)
            Spacer(Modifier.height(24.dp))
        }

        AppInput(
            value = state.token,
            onValueChange = viewModel::onTokenChange,
            label = "Reset Code",
            errorText = state.tokenError,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
        )
        Spacer(Modifier.height(24.dp))
        AppInput(
            value = state.password,
            onValueChange = viewModel::onPasswordChange,
            label = "New Password",
            placeholder = "••••••••",
            errorText = state.passwordError,
            isPassword = true,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(Modifier.height(24.dp))
        AppInput(
            value = state.confirmPassword,
            onValueChange = viewModel::onConfirmChange,
            label = "Confirm Password",
            placeholder = "••••••••",
            errorText = state.confirmError,
            isPassword = true,
            enabled = !state.submitting,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
            ),
        )
        Spacer(Modifier.height(24.dp))
        AppButton(
            text = if (state.submitting) "Saving..." else "Set new password",
            onClick = viewModel::submit,
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.submitting,
        )
        Spacer(Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Back to sign in",
                style = BodyText.copy(fontSize = 12.sp),
                color = Console.link,
                modifier = Modifier.clickable(onClick = onBackToLogin),
            )
        }
    }
}
