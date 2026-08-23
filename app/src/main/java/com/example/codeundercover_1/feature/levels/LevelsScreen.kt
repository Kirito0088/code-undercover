package com.example.codeundercover_1.feature.levels

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.MissionSummary
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.repo.MissionStatus
import com.example.codeundercover_1.ui.components.EmptyState
import com.example.codeundercover_1.ui.components.ErrorBanner
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.hud.BadgeTone
import com.example.codeundercover_1.ui.hud.HudBadge
import com.example.codeundercover_1.ui.hud.HudPage
import com.example.codeundercover_1.ui.hud.HudPanel
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.Console
import com.example.codeundercover_1.ui.theme.DifficultyColors
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricHint
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.MonoFont
import com.example.codeundercover_1.ui.theme.Semantic
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LevelsUiState(
    val loading: Boolean = true,
    val missions: List<MissionSummary> = emptyList(),
    val error: String? = null,
    val opening: String? = null,
    val actionError: String? = null,
)

class LevelsViewModel : ViewModel() {

    private val repo = ServiceLocator.missions

    private val _state = MutableStateFlow(LevelsUiState())
    val state: StateFlow<LevelsUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.missions()) {
                is ApiResult.Success ->
                    _state.update { it.copy(loading = false, missions = result.data) }

                is ApiResult.Failure ->
                    _state.update { it.copy(loading = false, error = result.error.message) }
            }
        }
    }

    /**
     * A mission must be accepted before it can be opened — the server refuses
     * phase changes, hints and submissions for a mission never taken.
     */
    fun open(mission: MissionSummary, onOpen: (String) -> Unit) {
        if (MissionStatus.from(mission.status) == MissionStatus.LOCKED) return
        if (_state.value.opening != null) return

        _state.update { it.copy(opening = mission.id, actionError = null) }
        viewModelScope.launch {
            when (val result = repo.accept(mission.id)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(opening = null) }
                    onOpen(mission.id)
                }

                is ApiResult.Failure ->
                    _state.update { it.copy(opening = null, actionError = result.error.message) }
            }
        }
    }
}

@Composable
fun LevelsScreen(
    onOpenMission: (String) -> Unit,
    viewModel: LevelsViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val layout = LocalAppLayout.current
    val scroll = rememberScrollState()

    when {
        state.loading -> LoadingState(label = "Pinning the board")
        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)
        state.missions.isEmpty() -> EmptyState(
            title = "No missions",
            detail = "The mission catalogue is empty.",
        )

        else -> Column(Modifier.verticalScroll(scroll)) {
            val cleared = state.missions.count {
                MissionStatus.from(it.status) == MissionStatus.COMPLETED
            }

            HudPage(
                eyebrow = "CASE_MAP // MISSION_BOARD",
                title = "Mission Board",
                subtitle = "$cleared of ${state.missions.size} operations cleared",
                status = { HudBadge(text = "OPEN", tone = BadgeTone.Active) },
            ) {
                state.actionError?.let { ErrorBanner(it) }

                // Column count comes from the window size, so a phone gets one
                // and a tablet three without a separate layout.
                state.missions.chunked(layout.boardColumns).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(layout.gutter)) {
                        row.forEach { mission ->
                            MissionCard(
                                mission = mission,
                                busy = state.opening == mission.id,
                                modifier = Modifier.weight(1f),
                                onClick = { viewModel.open(mission, onOpenMission) },
                            )
                        }
                        repeat(layout.boardColumns - row.size) {
                            Spacer(Modifier.weight(1f))
                        }
                    }
                    Spacer(Modifier.height(layout.gutter))
                }

                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun MissionCard(
    mission: MissionSummary,
    busy: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val status = MissionStatus.from(mission.status)
    val locked = status == MissionStatus.LOCKED

    val accent = when (status) {
        MissionStatus.COMPLETED -> Semantic.emeraldBorder
        MissionStatus.ACTIVE -> Hud.accent
        MissionStatus.LOCKED -> Hud.border
    }

    HudPanel(
        modifier = modifier.clickable(enabled = !locked && !busy, onClick = onClick),
        borderColor = accent,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "OP ${mission.order.toString().padStart(2, '0')}",
                style = MetricLabel,
                color = if (locked) Hud.muted else Hud.accent,
            )
            StatusBadge(status)
        }

        Spacer(Modifier.height(8.dp))
        Text(
            text = mission.title,
            style = androidx.compose.ui.text.TextStyle(
                fontFamily = MonoFont,
                fontSize = 14.sp,
            ),
            // Locked titles stay legible — the web board shows them too; only
            // the contents are gated.
            color = if (locked) Hud.muted else Console.text,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )

        if (mission.description.isNotBlank()) {
            Spacer(Modifier.height(6.dp))
            Text(
                text = mission.description,
                style = MetricHint,
                color = Hud.muted,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
            )
        }

        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            HudBadge(text = mission.difficulty, tone = BadgeTone.Dim)
            HudBadge(text = mission.language, tone = BadgeTone.Dim)
            HudBadge(text = "${mission.auraReward} AP", tone = BadgeTone.Active)
        }
    }
}

@Composable
private fun StatusBadge(status: MissionStatus) {
    val (icon, tone, label) = when (status) {
        MissionStatus.COMPLETED ->
            Triple(Icons.Filled.CheckCircle, Semantic.emerald400, "CLEARED")

        MissionStatus.ACTIVE ->
            Triple(Icons.Filled.PlayArrow, Hud.accent, "ACTIVE")

        MissionStatus.LOCKED ->
            Triple(Icons.Filled.Lock, Hud.muted, "LOCKED")
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tone,
            modifier = Modifier.size(12.dp),
        )
        Text(label, style = MetricLabel.copy(fontSize = 8.sp), color = tone)
    }
}

/** Difficulty tint, kept alongside the board for the mission detail header. */
internal fun difficultyTint(difficulty: String) = DifficultyColors.forDifficulty(difficulty)
