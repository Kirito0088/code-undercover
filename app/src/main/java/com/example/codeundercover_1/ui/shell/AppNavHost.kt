package com.example.codeundercover_1.ui.shell

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.example.codeundercover_1.Routes
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.feature.daily.DailyChallengeScreen
import com.example.codeundercover_1.feature.dashboard.DashboardScreen
import com.example.codeundercover_1.feature.history.HistoryScreen
import com.example.codeundercover_1.feature.intro.IntroScreen
import com.example.codeundercover_1.feature.lab.DebugLabScreen
import com.example.codeundercover_1.feature.leaderboard.LeaderboardScreen
import com.example.codeundercover_1.feature.levels.LevelsScreen
import com.example.codeundercover_1.feature.mission.MissionScreen
import com.example.codeundercover_1.feature.profile.ProfileScreen

@Composable
internal fun AppNavHost(
    navController: NavHostController,
    user: SessionUser,
    onSignOut: () -> Unit,
) {
    NavHost(navController = navController, startDestination = Routes.DASHBOARD) {

        composable(Routes.DASHBOARD) {
            DashboardScreen(
                user = user,
                onOpenLevels = { navController.navigate(Routes.LEVELS) },
                onOpenDaily = { navController.navigate(Routes.DAILY) },
                onOpenHistory = { navController.navigate(Routes.HISTORY) },
                onOpenMission = { navController.navigate(Routes.mission(it)) },
            )
        }

        composable(Routes.LEVELS) {
            LevelsScreen(
                onOpenMission = { navController.navigate(Routes.mission(it)) },
            )
        }

        composable(
            route = Routes.MISSION,
            arguments = listOf(navArgument("missionId") { type = NavType.StringType }),
        ) { entry ->
            MissionScreen(
                missionId = entry.arguments?.getString("missionId").orEmpty(),
                onExit = { navController.popBackStack() },
            )
        }

        composable(Routes.DEBUG_LAB) { DebugLabScreen() }

        composable(Routes.LEADERBOARD) { LeaderboardScreen(currentUserId = user.id) }

        composable(Routes.HISTORY) {
            HistoryScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.DAILY) {
            DailyChallengeScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.PROFILE) {
            ProfileScreen(user = user, onSignOut = onSignOut)
        }
    }
}

@Composable
internal fun IntroRoute(onCompleted: () -> Unit) {
    IntroScreen(onCompleted = onCompleted)
}
