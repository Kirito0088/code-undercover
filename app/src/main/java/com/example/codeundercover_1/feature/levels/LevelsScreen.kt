package com.example.codeundercover_1.feature.levels

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.MissionSummary
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.repo.MissionStatus
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.EmptyState
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.components.StampChip
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.DifficultyColors
import com.example.codeundercover_1.ui.theme.Noir
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
     * A mission has to be accepted before it can be opened — the server refuses
     * phase changes, hints and submissions for a mission the user never took.
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

    when {
        state.loading -> LoadingState(label = "PINNING THE BOARD...")

        state.error != null ->
            ErrorState(message = state.error!!, onRetry = viewModel::load)

        state.missions.isEmpty() -> EmptyState(
            title = "No missions",
            detail = "The mission catalogue is empty.",
        )

        else -> LazyVerticalGrid(
            // Column count comes from the window size, so a phone gets one
            // column and a tablet three without a separate layout file.
            columns = GridCells.Fixed(layout.boardColumns),
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding(),
            contentPadding = PaddingValues(
                start = layout.screenPadding,
                end = layout.screenPadding,
                top = 12.dp,
                bottom = 32.dp,
            ),
            horizontalArrangement = Arrangement.spacedBy(layout.gutter),
            verticalArrangement = Arrangement.spacedBy(layout.gutter),
        ) {
            item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(maxLineSpan) }) {
                Column {
                    Text(
                        "Mission Board",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    val done = state.missions.count {
                        MissionStatus.from(it.status) == MissionStatus.COMPLETED
                    }
                    Text(
                        "$done of ${state.missions.size} cleared",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    state.actionError?.let { message ->
                        Spacer(Modifier.height(6.dp))
                        Text(
                            message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }

            items(state.missions, key = { it.id }) { mission ->
                MissionCard(
                    mission = mission,
                    busy = state.opening == mission.id,
                    onClick = { viewModel.open(mission, onOpenMission) },
                )
            }
        }
    }
}

@Composable
private fun MissionCard(
    mission: MissionSummary,
    busy: Boolean,
    onClick: () -> Unit,
) {
    val status = MissionStatus.from(mission.status)
    val locked = status == MissionStatus.LOCKED

    val accent = when (status) {
        MissionStatus.COMPLETED -> Noir.cleared
        MissionStatus.ACTIVE -> Noir.brass
        MissionStatus.LOCKED -> null
    }

    DossierCard(
        modifier = Modifier.clickable(enabled = !locked && !busy, onClick = onClick),
        accent = accent,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "MISSION ${mission.order}",
                style = MaterialTheme.typography.labelSmall,
                color = if (locked) MaterialTheme.colorScheme.onSurfaceVariant
                else MaterialTheme.colorScheme.primary,
            )
            StatusBadge(status)
        }

        Spacer(Modifier.height(6.dp))
        Text(
            mission.title,
            style = MaterialTheme.typography.titleLarge,
            // Locked titles stay legible rather than being blanked out — the
            // web board shows them too; only the contents are gated.
            color = if (locked) MaterialTheme.colorScheme.onSurfaceVariant
            else MaterialTheme.colorScheme.onSurface,
        )

        if (mission.description.isNotBlank()) {
            Spacer(Modifier.height(6.dp))
            Text(
                mission.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 3,
            )
        }

        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StampChip(
                text = mission.difficulty,
                color = DifficultyColors.forDifficulty(mission.difficulty),
            )
            StampChip(text = mission.language, color = MaterialTheme.colorScheme.onSurfaceVariant)
            StampChip(text = "${mission.auraReward} AURA", color = Noir.brass)
        }
    }
}

@Composable
private fun StatusBadge(status: MissionStatus) {
    val (icon, tone, label) = when (status) {
        MissionStatus.COMPLETED -> Triple(Icons.Filled.CheckCircle, Noir.mossBright, "CLEARED")
        MissionStatus.ACTIVE -> Triple(Icons.Filled.PlayArrow, Noir.brass, "ACTIVE")
        MissionStatus.LOCKED -> Triple(
            Icons.Filled.Lock,
            MaterialTheme.colorScheme.onSurfaceVariant,
            "LOCKED",
        )
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tone,
            modifier = Modifier.height(16.dp),
        )
        Text(label, style = MaterialTheme.typography.labelSmall, color = tone)
    }
}

