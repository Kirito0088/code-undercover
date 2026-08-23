package com.example.codeundercover_1.feature.leaderboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.LeaderboardPlayer
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.ui.components.EmptyState
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.hud.BadgeTone
import com.example.codeundercover_1.ui.hud.HudBadge
import com.example.codeundercover_1.ui.hud.HudPage
import com.example.codeundercover_1.ui.hud.HudPanel
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricHint
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.MetricValue
import com.example.codeundercover_1.ui.theme.MonoFont
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
    val scroll = rememberScrollState()

    when {
        state.loading -> LoadingState(label = "Tallying ranks")
        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)
        state.players.isEmpty() -> EmptyState(
            title = "No agents ranked",
            detail = "Complete a mission to appear on the board.",
        )

        else -> Column(Modifier.verticalScroll(scroll)) {
            HudPage(
                eyebrow = "Standings",
                title = "Leaderboard",
                subtitle = "${state.players.size} agents ranked by aura",
                status = { HudBadge(text = "LIVE", tone = BadgeTone.Active) },
            ) {
                state.players.forEachIndexed { index, player ->
                    PlayerRow(
                        position = index + 1,
                        player = player,
                        isCurrentUser = player.id == currentUserId,
                    )
                }
                Spacer(Modifier.height(24.dp))
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

    HudPanel(
        modifier = Modifier.fillMaxWidth(),
        borderColor = if (isCurrentUser) Hud.accent else Hud.border,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = position.toString().padStart(2, '0'),
                style = MetricValue,
                color = when (position) {
                    1 -> RankColors.platypus
                    2 -> RankColors.wolf
                    3 -> RankColors.fox
                    else -> Hud.muted
                },
                textAlign = TextAlign.Center,
                modifier = Modifier.width(40.dp),
            )

            Column(Modifier.weight(1f)) {
                Text(
                    text = player.username.ifBlank { player.name },
                    style = androidx.compose.ui.text.TextStyle(
                        fontFamily = MonoFont,
                        fontSize = 14.sp,
                    ),
                    color = Hud.text,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "LVL ${player.auraLevel} · ${player.missionsCompleted} MISSIONS · " +
                        "${player.completionPercent}%",
                    style = MetricHint,
                    color = Hud.muted,
                )
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    HudBadge(text = player.rankTier.uppercase(), tone = BadgeTone.Dim)
                    if (player.foxBadges > 0) {
                        HudBadge(text = "${player.foxBadges} FOX", tone = BadgeTone.Amber)
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = player.auraPoints.toString(),
                    style = MetricValue.copy(fontSize = 18.sp),
                    color = rankTone,
                )
                Text(text = "AURA", style = MetricLabel, color = Hud.muted)
            }
        }
    }
    Spacer(Modifier.height(12.dp))
}
