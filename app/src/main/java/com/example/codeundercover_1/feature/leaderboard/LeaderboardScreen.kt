package com.example.codeundercover_1.feature.leaderboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.LeaderboardPlayer
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.EmptyState
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.components.StampChip
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.Noir
import com.example.codeundercover_1.ui.theme.RankColors
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LeaderboardUiState(
    val loading: Boolean = true,
    val players: List<LeaderboardPlayer> = emptyList(),
    val error: String? = null,
)

class LeaderboardViewModel : ViewModel() {

    private val profile = ServiceLocator.profile

    private val _state = MutableStateFlow(LeaderboardUiState())
    val state: StateFlow<LeaderboardUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = profile.leaderboard()) {
                is ApiResult.Success ->
                    _state.update { it.copy(loading = false, players = result.data) }

                is ApiResult.Failure ->
                    _state.update { it.copy(loading = false, error = result.error.message) }
            }
        }
    }
}

@Composable
fun LeaderboardScreen(
    currentUserId: String?,
    viewModel: LeaderboardViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val layout = LocalAppLayout.current

    when {
        state.loading -> LoadingState(label = "TALLYING THE RANKS...")

        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)

        state.players.isEmpty() -> EmptyState(
            title = "No agents ranked",
            detail = "Complete a mission to appear on the board.",
        )

        else -> LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding(),
            contentPadding = PaddingValues(
                start = layout.screenPadding,
                end = layout.screenPadding,
                top = 12.dp,
                bottom = 32.dp,
            ),
            verticalArrangement = Arrangement.spacedBy(layout.gutter),
        ) {
            item {
                Column {
                    Text(
                        "Standings",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        "${state.players.size} agents ranked by aura",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            itemsIndexed(state.players, key = { _, player -> player.id }) { index, player ->
                PlayerRow(
                    position = index + 1,
                    player = player,
                    isCurrentUser = player.id == currentUserId,
                )
            }
        }
    }
}

@Composable
private fun PlayerRow(
    position: Int,
    player: LeaderboardPlayer,
    isCurrentUser: Boolean,
) {
    val rankTone = RankColors.forRank(player.rankTier)

    DossierCard(
        // The signed-in agent is outlined so they can find themselves without
        // reading every row.
        accent = if (isCurrentUser) Noir.brass else null,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = position.toString(),
                style = MaterialTheme.typography.displaySmall,
                color = when (position) {
                    1 -> RankColors.platypus
                    2 -> RankColors.wolf
                    3 -> RankColors.fox
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                },
                textAlign = TextAlign.Center,
                modifier = Modifier.width(48.dp),
            )

            Column(Modifier.weight(1f)) {
                Text(
                    player.username.ifBlank { player.name },
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    "Level ${player.auraLevel} · ${player.missionsCompleted} missions · " +
                        "${player.completionPercent}%",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    StampChip(text = player.rankTier, color = rankTone)
                    if (player.foxBadges > 0) {
                        StampChip(text = "${player.foxBadges} FOX", color = Noir.brass)
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    player.auraPoints.toString(),
                    style = MaterialTheme.typography.titleLarge,
                    color = Noir.brass,
                )
                Text(
                    "AURA",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
