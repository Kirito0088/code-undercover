package com.example.codeundercover_1

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.codeundercover_1.feature.auth.ForgotPasswordScreen
import com.example.codeundercover_1.feature.auth.LoginScreen
import com.example.codeundercover_1.feature.auth.RegisterScreen
import com.example.codeundercover_1.feature.auth.ResetPasswordScreen
import com.example.codeundercover_1.feature.session.SessionState
import com.example.codeundercover_1.feature.session.SessionViewModel
import com.example.codeundercover_1.feature.settings.ServerSettingsScreen
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.shell.AppShell

/**
 * Route names mirror the web app's URLs so the two products stay conceptually
 * aligned and deep links can be added later without renaming anything.
 */
object Routes {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val FORGOT_PASSWORD = "forgot-password"
    const val RESET_PASSWORD = "reset-password"

    const val DASHBOARD = "dashboard"
    const val LEVELS = "levels"
    const val MISSION = "mission/{missionId}"
    const val DEBUG_LAB = "debug-lab"
    const val LEADERBOARD = "leaderboard"
    const val HISTORY = "history"
    const val PROFILE = "profile"
    const val DAILY = "daily-tasks"
    const val INTRO = "intro"

    fun mission(missionId: String) = "mission/$missionId"
}

/**
 * Top-level routing is driven by session state rather than by a single graph
 * with redirect guards. Swapping the whole NavHost when the user signs in or
 * out means there is never a stale authenticated screen sitting on the back
 * stack — the equivalent of what `middleware.ts` enforces on the web.
 */
@Composable
fun CodeUndercoverNavHost() {
    val sessionViewModel: SessionViewModel = viewModel()
    val sessionState by sessionViewModel.state.collectAsStateWithLifecycle()

    when (val state = sessionState) {
        is SessionState.Loading ->
            LoadingState(label = "ESTABLISHING SECURE CHANNEL...")

        is SessionState.Unreachable ->
            UnreachableRoute(
                message = state.error.message,
                onRetry = sessionViewModel::refresh,
            )

        is SessionState.SignedOut ->
            AuthNavHost(onAuthenticated = sessionViewModel::onAuthenticated)

        is SessionState.SignedIn ->
            AppShell(
                user = state.user,
                onSignOut = sessionViewModel::signOut,
                onIntroCompleted = {
                    sessionViewModel.updateUser { it.copy(hasSeenIntro = true) }
                },
            )
    }
}

/**
 * Shown when the backend cannot be reached at all. Deliberately does not sign
 * the user out — a dev server that is merely stopped is not a logout.
 */
@Composable
private fun UnreachableRoute(message: String, onRetry: () -> Unit) {
    var showingSettings by remember { mutableStateOf(false) }

    if (showingSettings) {
        ServerSettingsScreen(
            onDone = {
                showingSettings = false
                onRetry()
            },
        )
    } else {
        ErrorState(
            message = "$message\n\nCheck that the web app is running and that the " +
                "server address is correct.",
            onRetry = { showingSettings = true },
        )
    }
}

@Composable
private fun AuthNavHost(
    onAuthenticated: (com.example.codeundercover_1.data.model.SessionUser) -> Unit,
    navController: NavHostController = rememberNavController(),
) {
    NavHost(navController = navController, startDestination = Routes.LOGIN) {
        composable(Routes.LOGIN) {
            LoginScreen(
                onAuthenticated = onAuthenticated,
                onRegister = { navController.navigate(Routes.REGISTER) },
                onForgotPassword = { navController.navigate(Routes.FORGOT_PASSWORD) },
                onServerSettings = { navController.navigate(SETTINGS) },
            )
        }

        composable(Routes.REGISTER) {
            RegisterScreen(
                // Registration does not create a session; the web app sends
                // people to sign in afterwards, and so do we.
                onRegistered = {
                    navController.popBackStack(Routes.LOGIN, inclusive = false)
                },
                onBackToLogin = { navController.popBackStack() },
            )
        }

        composable(Routes.FORGOT_PASSWORD) {
            ForgotPasswordScreen(
                onBackToLogin = { navController.popBackStack(Routes.LOGIN, inclusive = false) },
                onHaveCode = { navController.navigate(Routes.RESET_PASSWORD) },
            )
        }

        composable(Routes.RESET_PASSWORD) {
            ResetPasswordScreen(
                onDone = { navController.popBackStack(Routes.LOGIN, inclusive = false) },
                onBackToLogin = { navController.popBackStack(Routes.LOGIN, inclusive = false) },
            )
        }

        composable(SETTINGS) {
            ServerSettingsScreen(onDone = { navController.popBackStack() })
        }
    }
}

private const val SETTINGS = "server-settings"
