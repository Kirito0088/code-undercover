package com.example.codeundercover_1.ui.shell

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.Today
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.PermanentDrawerSheet
import androidx.compose.material3.PermanentNavigationDrawer
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.codeundercover_1.Routes
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.ui.hud.BadgeTone
import com.example.codeundercover_1.ui.hud.HudBadge
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.responsive.NavStyle
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.MonoFont

/**
 * Destinations, and their labels, taken verbatim from
 * `components/layout/MobileNav.tsx` — Dashboard, Daily Task (with its NEW
 * badge), Debug Lab, Leaderboard, History. The web reaches Profile through the
 * navbar's ProfileMenu rather than the nav list, so it lives in the top bar
 * here for the same reason.
 */
private data class Destination(
    val route: String,
    val label: String,
    val icon: ImageVector,
    val badge: String? = null,
)

private val Destinations = listOf(
    Destination(Routes.DASHBOARD, "Dashboard", Icons.Filled.Dashboard),
    Destination(Routes.DAILY, "Daily Task", Icons.Filled.Today, badge = "NEW"),
    Destination(Routes.DEBUG_LAB, "Debug Lab", Icons.Filled.Terminal),
    Destination(Routes.LEADERBOARD, "Leaderboard", Icons.Filled.EmojiEvents),
    Destination(Routes.HISTORY, "History", Icons.AutoMirrored.Filled.List),
)

@Composable
fun AppShell(
    user: SessionUser,
    onSignOut: () -> Unit,
    onIntroCompleted: () -> Unit,
    navController: NavHostController = rememberNavController(),
) {
    val layout = LocalAppLayout.current

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
            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    val body: @Composable () -> Unit = {
        Column(modifier = Modifier.fillMaxSize().background(Hud.bg)) {
            TopBar(
                username = user.username ?: user.name ?: "agent",
                onProfile = { navigateTo(Routes.PROFILE) },
            )
            Box(Modifier.weight(1f)) {
                AppNavHost(navController, user, onSignOut)
            }
        }
    }

    when (layout.navStyle) {
        NavStyle.BottomBar -> Column(Modifier.fillMaxSize()) {
            Box(Modifier.weight(1f)) { body() }
            NavigationBar(
                containerColor = Hud.surface,
                contentColor = Hud.muted,
            ) {
                Destinations.forEach { destination ->
                    NavigationBarItem(
                        selected = isSelected(destination.route),
                        onClick = { navigateTo(destination.route) },
                        icon = {
                            Icon(
                                destination.icon,
                                contentDescription = destination.label,
                                modifier = Modifier.size(20.dp),
                            )
                        },
                        label = {
                            Text(
                                destination.label,
                                style = MetricLabel.copy(fontSize = 9.sp),
                                maxLines = 1,
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Hud.accent,
                            selectedTextColor = Hud.accent,
                            unselectedIconColor = Hud.muted,
                            unselectedTextColor = Hud.muted,
                            indicatorColor = Hud.accentAlpha(0.12f),
                        ),
                    )
                }
            }
        }

        NavStyle.Rail -> Row(Modifier.fillMaxSize()) {
            NavigationRail(containerColor = Hud.surface, contentColor = Hud.muted) {
                Destinations.forEach { destination ->
                    NavigationRailItem(
                        selected = isSelected(destination.route),
                        onClick = { navigateTo(destination.route) },
                        icon = {
                            Icon(
                                destination.icon,
                                contentDescription = destination.label,
                                modifier = Modifier.size(20.dp),
                            )
                        },
                        label = {
                            Text(
                                destination.label,
                                style = MetricLabel.copy(fontSize = 9.sp),
                                maxLines = 1,
                            )
                        },
                        colors = NavigationRailItemDefaults.colors(
                            selectedIconColor = Hud.accent,
                            selectedTextColor = Hud.accent,
                            unselectedIconColor = Hud.muted,
                            unselectedTextColor = Hud.muted,
                            indicatorColor = Hud.accentAlpha(0.12f),
                        ),
                    )
                }
            }
            body()
        }

        NavStyle.PermanentDrawer -> PermanentNavigationDrawer(
            drawerContent = {
                PermanentDrawerSheet(
                    modifier = Modifier.width(240.dp),
                    drawerContainerColor = Hud.surface,
                ) {
                    Spacer(Modifier.height(16.dp))
                    Text(
                        text = "CODE UNDERCOVER",
                        style = MetricLabel.copy(fontSize = 10.sp),
                        color = Hud.accent,
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp),
                    )
                    Destinations.forEach { destination ->
                        NavigationDrawerItem(
                            selected = isSelected(destination.route),
                            onClick = { navigateTo(destination.route) },
                            icon = {
                                Icon(destination.icon, contentDescription = destination.label)
                            },
                            label = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Text(destination.label)
                                    destination.badge?.let {
                                        HudBadge(text = it, tone = BadgeTone.Active)
                                    }
                                }
                            },
                            colors = NavigationDrawerItemDefaults.colors(
                                selectedContainerColor = Hud.accentAlpha(0.12f),
                                selectedIconColor = Hud.accent,
                                selectedTextColor = Hud.accent,
                                unselectedIconColor = Hud.muted,
                                unselectedTextColor = Hud.muted,
                            ),
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 2.dp),
                        )
                    }
                }
            },
        ) {
            body()
        }
    }
}

/** Mirrors the web Navbar: brand mark on the left, profile entry on the right. */
@Composable
private fun TopBar(username: String, onProfile: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Hud.surface)
            .statusBarsPadding()
            .height(56.dp) // h-14
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = "CODE UNDERCOVER",
            style = androidx.compose.ui.text.TextStyle(
                fontFamily = MonoFont,
                fontSize = 12.sp,
                letterSpacing = 1.2.sp,
            ),
            color = Hud.accent,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.clickable(onClick = onProfile),
        ) {
            Text(
                text = username,
                style = androidx.compose.ui.text.TextStyle(
                    fontFamily = MonoFont,
                    fontSize = 12.sp,
                ),
                color = Hud.muted,
            )
            Icon(
                Icons.Filled.Person,
                contentDescription = "Profile",
                tint = Hud.accent,
                modifier = Modifier.size(20.dp),
            )
        }
    }
}
