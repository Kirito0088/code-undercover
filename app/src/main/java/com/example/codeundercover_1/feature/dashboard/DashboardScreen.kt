package com.example.codeundercover_1.feature.dashboard

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.AgentStats
import com.example.codeundercover_1.data.model.MissionSummary
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.repo.MissionStatus
import com.example.codeundercover_1.domain.Aura
import com.example.codeundercover_1.ui.components.AuraBar
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.components.PrimaryButton
import com.example.codeundercover_1.ui.components.ResponsiveContent
import com.example.codeundercover_1.ui.components.SecondaryButton
import com.example.codeundercover_1.ui.components.SectionHeader
import com.example.codeundercover_1.ui.components.StampChip
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.DifficultyColors
import com.example.codeundercover_1.ui.theme.Noir
import com.example.codeundercover_1.ui.theme.RankColors
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DashboardUiState(
    val loading: Boolean = true,
    val stats: AgentStats? = null,
    val activeMission: MissionSummary? = null,
    val completedCount: Int = 0,
    val totalCount: Int = 0,
    val error: String? = null,
)

class DashboardViewModel : ViewModel() {

    private val profile = ServiceLocator.profile
    private val missions = ServiceLocator.missions

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val statsResult = profile.stats()
            val missionsResult = missions.missions()

            // The mission list drives the "continue where you left off" card,
            // but a failure there should not blank the whole briefing — the
            // stats half is still useful on its own.
            val board = (missionsResult as? ApiResult.Success)?.data.orEmpty()

            when (statsResult) {
                is ApiResult.Success -> _state.update {
                    it.copy(
                        loading = false,
                        stats = statsResult.data,
                        activeMission = board.firstOrNull {
                            MissionStatus.from(it.status) == MissionStatus.ACTIVE
                        },
                        completedCount = board.count {
                            MissionStatus.from(it.status) == MissionStatus.COMPLETED
                        },
                        totalCount = board.size,
                    )
                }

                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, error = statsResult.error.message)
                }
            }
        }
    }
}

@Composable
fun DashboardScreen(
    user: SessionUser,
    onOpenLevels: () -> Unit,
    onOpenDaily: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenMission: (String) -> Unit,
    viewModel: DashboardViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val layout = LocalAppLayout.current
    val scroll = rememberScrollState()

    when {
        state.loading -> LoadingState(label = "ASSEMBLING YOUR BRIEFING...")

        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)

        else -> Column(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .verticalScroll(scroll),
        ) {
            ResponsiveContent {
                val stats = state.stats
                val aura = stats?.auraPoints ?: 0

                Spacer(Modifier.height(12.dp))
                Text(
                    "Good hunting,",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    user.username ?: user.name ?: "agent",
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.onBackground,
                )

                Spacer(Modifier.height(18.dp))

                DossierCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column {
                            Text(
                                "AURA",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                aura.toString(),
                                style = MaterialTheme.typography.displaySmall,
                                color = Noir.brass,
                            )
                        }
                        Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                            StampChip(
                                text = Aura.rank(aura),
                                color = RankColors.forRank(Aura.rank(aura)),
                            )
                            Spacer(Modifier.height(6.dp))
                            Text(
                                "Level ${stats?.auraLevel ?: Aura.level(aura)}",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }

                    Spacer(Modifier.height(14.dp))
                    AuraBar(
                        progress = Aura.levelProgress(aura),
                        caption = "${Aura.pointsToNextLevel(aura)} aura to level " +
                            "${Aura.level(aura) + 1}",
                    )

                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                        Metric("CLEARED", "${state.completedCount}/${state.totalCount}")
                        Metric("STREAK", "${stats?.comboStreak ?: 0}")
                        Metric("FOX", "${stats?.foxBadges ?: 0}", Noir.brass)
                    }
                }

                Spacer(Modifier.height(18.dp))

                val active = state.activeMission
                if (active != null) {
                    SectionHeader("Current assignment")
                    DossierCard(
                        modifier = Modifier.clickable { onOpenMission(active.id) },
                        accent = Noir.brass,
                    ) {
                        Text(
                            "MISSION ${active.order}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            active.title,
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        if (active.description.isNotBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(
                                active.description,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 3,
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            StampChip(
                                text = active.difficulty,
                                color = DifficultyColors.forDifficulty(active.difficulty),
                            )
                            StampChip(text = "${active.auraReward} AURA", color = Noir.brass)
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                }

                PrimaryButton(
                    text = if (active != null) "CONTINUE MISSION" else "OPEN MISSION BOARD",
                    onClick = { if (active != null) onOpenMission(active.id) else onOpenLevels() },
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(layout.gutter)) {
                    SecondaryButton(
                        text = "DAILY BRIEF",
                        onClick = onOpenDaily,
                        modifier = Modifier.weight(1f),
                    )
                    SecondaryButton(
                        text = "CASE FILES",
                        onClick = onOpenHistory,
                        modifier = Modifier.weight(1f),
                    )
                }

                Spacer(Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun Metric(label: String, value: String, tone: Color? = null) {
    Column {
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            value,
            style = MaterialTheme.typography.titleLarge,
            color = tone ?: MaterialTheme.colorScheme.onSurface,
        )
    }
}
