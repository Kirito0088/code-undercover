package com.example.codeundercover_1.ui.shell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.PermanentDrawerSheet
import androidx.compose.material3.PermanentNavigationDrawer
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.codeundercover_1.Routes
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.responsive.NavStyle

/** Primary destinations — the ones that earn a permanent slot in the chrome. */
private data class Destination(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

private val PrimaryDestinations = listOf(
    Destination(Routes.DASHBOARD, "Briefing", Icons.Filled.Dashboard),
    Destination(Routes.LEVELS, "Missions", Icons.AutoMirrored.Filled.List),
    Destination(Routes.DEBUG_LAB, "Lab", Icons.Filled.Terminal),
    Destination(Routes.LEADERBOARD, "Ranks", Icons.Filled.EmojiEvents),
    Destination(Routes.PROFILE, "Agent", Icons.Filled.Person),
)

/**
 * Signed-in chrome. The navigation pattern is chosen from the window size
 * rather than hard-coded, so the same code gives a phone a thumb-reachable
 * bottom bar and a tablet a permanent drawer.
 */
@Composable
fun AppShell(
    user: SessionUser,
    onSignOut: () -> Unit,
    onIntroCompleted: () -> Unit,
    navController: NavHostController = rememberNavController(),
) {
    val layout = LocalAppLayout.current

    // Mirrors the middleware rule: an agent who has not been briefed cannot
    // reach the rest of the app yet.
    if (!user.hasSeenIntro) {
        IntroRoute(onCompleted = onIntroCompleted)
        return
    }

    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination

    fun isSelected(route: String): Boolean =
        currentDestination?.hierarchy?.any { it.route == route } == true

    fun navigateTo(route: String) {
        navController.navigate(route) {
            // Keep a single copy of each top-level destination and preserve
            // each one's own scroll/state as the user moves between them.
            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    when (layout.navStyle) {
        NavStyle.BottomBar -> Scaffold(
            bottomBar = {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                    PrimaryDestinations.forEach { destination ->
                        NavigationBarItem(
                            selected = isSelected(destination.route),
                            onClick = { navigateTo(destination.route) },
                            icon = {
                                Icon(destination.icon, contentDescription = destination.label)
                            },
                            label = {
                                Text(
                                    destination.label,
                                    style = MaterialTheme.typography.labelSmall,
                                )
                            },
                        )
                    }
                }
            },
        ) { innerPadding ->
            Box(Modifier.padding(innerPadding)) {
                AppNavHost(navController, user, onSignOut)
            }
        }

        NavStyle.Rail -> Row(Modifier.fillMaxSize()) {
            NavigationRail(containerColor = MaterialTheme.colorScheme.surface) {
                PrimaryDestinations.forEach { destination ->
                    NavigationRailItem(
                        selected = isSelected(destination.route),
                        onClick = { navigateTo(destination.route) },
                        icon = { Icon(destination.icon, contentDescription = destination.label) },
                        label = {
                            Text(
                                destination.label,
                                style = MaterialTheme.typography.labelSmall,
                            )
                        },
                    )
                }
            }
            AppNavHost(navController, user, onSignOut)
        }

        NavStyle.PermanentDrawer -> PermanentNavigationDrawer(
            drawerContent = {
                PermanentDrawerSheet(
                    modifier = Modifier.width(240.dp),
                    drawerContainerColor = MaterialTheme.colorScheme.surface,
                ) {
                    PrimaryDestinations.forEach { destination ->
                        NavigationDrawerItem(
                            selected = isSelected(destination.route),
                            onClick = { navigateTo(destination.route) },
                            icon = {
                                Icon(destination.icon, contentDescription = destination.label)
                            },
                            label = { Text(destination.label) },
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        )
                    }
                }
            },
        ) {
            AppNavHost(navController, user, onSignOut)
        }
    }
}
