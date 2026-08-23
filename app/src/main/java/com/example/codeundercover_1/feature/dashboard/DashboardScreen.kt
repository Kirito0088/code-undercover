package com.example.codeundercover_1.feature.dashboard

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.example.codeundercover_1.ui.components.AppButton
import com.example.codeundercover_1.ui.components.ButtonVariant
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.hud.BadgeTone
import com.example.codeundercover_1.ui.hud.HudBadge
import com.example.codeundercover_1.ui.hud.HudMetric
import com.example.codeundercover_1.ui.hud.HudPage
import com.example.codeundercover_1.ui.hud.HudPanel
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.Console
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricHint
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.MonoFont
import com.example.codeundercover_1.ui.theme.RankColors
import com.example.codeundercover_1.ui.theme.Semantic
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

            // A failed mission list should not blank the whole briefing — the
            // stats half is still useful on its own.
            val board = (missionsResult as? ApiResult.Success)?.data.orEmpty()

            when (statsResult) {
                is ApiResult.Success -> _state.update {
                    it.copy(
                        loading = false,
                        stats = statsResult.data,
                        activeMission = board.firstOrNull { mission ->
                            MissionStatus.from(mission.status) == MissionStatus.ACTIVE
                        },
                        completedCount = board.count { mission ->
                            MissionStatus.from(mission.status) == MissionStatus.COMPLETED
                        },
                        totalCount = board.size,
                    )
                }

                is ApiResult.Failure ->
                    _state.update { it.copy(loading = false, error = statsResult.error.message) }
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
        state.loading -> LoadingState(label = "Assembling briefing")
        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)

        else -> Column(Modifier.verticalScroll(scroll)) {
            val stats = state.stats
            val aura = stats?.auraPoints ?: 0
            val rank = Aura.rank(aura)

            HudPage(
                eyebrow = "OPS_DECK // AGENT_STATUS",
                title = "Agent Briefing",
                subtitle = user.username ?: user.name ?: "agent",
                status = { HudBadge(text = rank.uppercase(), tone = BadgeTone.Active) },
            ) {
                val perRow = if (layout.isExpanded) 4 else 2
                val metrics = listOf(
                    Triple("OPERATIONAL AP", aura.toString(), "Aura Points"),
                    Triple(
                        "FIELD CLASSIF",
                        "LVL ${stats?.auraLevel ?: Aura.level(aura)}",
                        rank,
                    ),
                    Triple(
                        "RESOLVED",
                        "${state.completedCount}/${state.totalCount}",
                        "Missions Cleared",
                    ),
                    Triple("COMBO", "${stats?.comboStreak ?: 0}x", "Current Streak"),
                )
                metrics.chunked(perRow).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        row.forEach { (label, value, hint) ->
                            HudMetric(
                                label = label,
                                value = value,
                                hint = hint,
                                modifier = Modifier.weight(1f),
                                valueColor = when (label) {
                                    "OPERATIONAL AP" -> Semantic.emerald400
                                    "FIELD CLASSIF" -> RankColors.forRank(rank)
                                    else -> Console.text
                                },
                            )
                        }
                        repeat(perRow - row.size) { Spacer(Modifier.weight(1f)) }
                    }
                    Spacer(Modifier.height(16.dp))
                }

                HudPanel {
                    Text("PROGRESSION", style = MetricLabel, color = Hud.muted)
                    Spacer(Modifier.height(10.dp))
                    LinearProgressIndicator(
                        progress = { Aura.levelProgress(aura) },
                        modifier = Modifier.fillMaxWidth().height(6.dp),
                        color = Hud.accent,
                        trackColor = Console.deep,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "${Aura.pointsToNextLevel(aura)} AP to level ${Aura.level(aura) + 1}",
                        style = MetricHint,
                        color = Hud.muted,
                    )
                }

                val active = state.activeMission
                if (active != null) {
                    HudPanel(
                        modifier = Modifier.clickable { onOpenMission(active.id) },
                        borderColor = Hud.accent,
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(
                                "ACTIVE ASSIGNMENT",
                                style = MetricLabel,
                                color = Hud.accent,
                            )
                            HudBadge(text = active.difficulty, tone = BadgeTone.Amber)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "MISSION ${active.order.toString().padStart(2, '0')} · ${active.title}",
                            style = androidx.compose.ui.text.TextStyle(
                                fontFamily = MonoFont,
                                fontSize = 14.sp,
                            ),
                            color = Console.text,
                        )
                        if (active.description.isNotBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(
                                active.description,
                                style = MetricHint,
                                color = Hud.muted,
                                maxLines = 3,
                            )
                        }
                    }
                }

                AppButton(
                    text = if (active != null) "Continue mission" else "Open mission board",
                    onClick = {
                        if (active != null) onOpenMission(active.id) else onOpenLevels()
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    AppButton(
                        text = "Daily task",
                        onClick = onOpenDaily,
                        modifier = Modifier.weight(1f),
                        variant = ButtonVariant.Secondary,
                    )
                    AppButton(
                        text = "History",
                        onClick = onOpenHistory,
                        modifier = Modifier.weight(1f),
                        variant = ButtonVariant.Secondary,
                    )
                }

                Spacer(Modifier.height(24.dp))
            }
        }
    }
}
