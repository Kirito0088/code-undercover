package com.example.codeundercover_1.feature.history

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.HistoryEntry
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.ui.components.EmptyState
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.hud.BadgeTone
import com.example.codeundercover_1.ui.hud.HudBadge
import com.example.codeundercover_1.ui.hud.HudPage
import com.example.codeundercover_1.ui.hud.HudMetric
import com.example.codeundercover_1.ui.hud.HudPanel
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.CodeStyle
import com.example.codeundercover_1.ui.theme.Console
import com.example.codeundercover_1.ui.theme.DifficultyColors
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricHint
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.MetricValue
import com.example.codeundercover_1.ui.theme.MonoFont
import com.example.codeundercover_1.ui.theme.Semantic
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HistoryUiState(
    val loading: Boolean = true,
    val entries: List<HistoryEntry> = emptyList(),
    val error: String? = null,
)

class HistoryViewModel : ViewModel() {

    private val missions = ServiceLocator.missions

    private val _state = MutableStateFlow(HistoryUiState())
    val state: StateFlow<HistoryUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = missions.history()) {
                is ApiResult.Success ->
                    _state.update { it.copy(loading = false, entries = result.data) }

                is ApiResult.Failure ->
                    _state.update { it.copy(loading = false, error = result.error.message) }
            }
        }
    }
}

@Composable
fun HistoryScreen(
    onBack: () -> Unit,
    viewModel: HistoryViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val scroll = rememberScrollState()

    when {
        state.loading -> LoadingState(label = "Opening closed cases")
        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)
        state.entries.isEmpty() -> EmptyState(
            title = "No closed cases",
            detail = "Missions you complete are filed here.",
        )

        else -> Column(Modifier.verticalScroll(scroll)) {
            HudPage(
                eyebrow = "CHRONO_DECK // RESOLVED_MISSIONS",
                title = "Mission Chrono History",
                subtitle = "Review declassified solutions and intel archives " +
                    "submitted across your completed operations.",
                status = { HudBadge(text = "LOGS", tone = BadgeTone.Active) },
            ) {
                // `grid grid-cols-2 lg:grid-cols-4 gap-4` — two rows of two on a
                // phone, one row of four once there is room.
                val metrics = listOf(
                    Triple("RESOLVED", state.entries.size.toString(), "Missions Completed"),
                    Triple(
                        "AURA PAYLOAD",
                        "${state.entries.sumOf { it.auraReward }} AP",
                        "Total Points Earned",
                    ),
                    Triple(
                        "EXECUTION LOGS",
                        state.entries.sumOf { it.attemptCount }.toString(),
                        "Total Code Attempts",
                    ),
                    Triple(
                        "INNOVATION",
                        state.entries.count { it.innovationUnlocked }.toString(),
                        "Fox Insignia Badges",
                    ),
                )
                val perRow = if (LocalAppLayout.current.isExpanded) 4 else 2
                metrics.chunked(perRow).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        row.forEach { (label, value, hint) ->
                            Stat(
                                label = label,
                                value = value,
                                hint = hint,
                                modifier = Modifier.weight(1f),
                                tone = when (label) {
                                    "AURA PAYLOAD" -> Semantic.emerald400
                                    "INNOVATION" -> Semantic.amber400
                                    else -> Console.text
                                },
                            )
                        }
                        repeat(perRow - row.size) { Spacer(Modifier.weight(1f)) }
                    }
                    Spacer(Modifier.height(16.dp))
                }

                state.entries.forEach { entry -> HistoryCard(entry) }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun Stat(
    label: String,
    value: String,
    hint: String,
    modifier: Modifier = Modifier,
    tone: Color = Console.text,
) {
    HudMetric(
        label = label,
        value = value,
        hint = hint,
        modifier = modifier,
        valueColor = tone,
    )
}

@Composable
private fun HistoryCard(entry: HistoryEntry) {
    var expanded by remember { mutableStateOf(false) }

    HudPanel(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = entry.submittedCode != null) { expanded = !expanded },
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    "MISSION ${entry.missionOrder.toString().padStart(2, '0')}",
                    style = MetricLabel,
                    color = Hud.accent,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    entry.missionTitle,
                    style = androidx.compose.ui.text.TextStyle(
                        fontFamily = MonoFont,
                        fontSize = 14.sp,
                    ),
                    color = Hud.text,
                )
            }
            HudBadge(
                text = entry.difficulty,
                tone = if (entry.innovationUnlocked) BadgeTone.Amber else BadgeTone.Dim,
            )
        }

        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Inline("AURA", "+${entry.auraReward}", Hud.accent)
            Inline("ATTEMPTS", entry.attemptCount.toString(), Hud.muted)
            Inline("HINTS", entry.hintsUsed.toString(), Hud.muted)
            Inline("LANG", entry.language, DifficultyColors.forDifficulty(entry.difficulty))
        }

        if (entry.submittedCode != null) {
            Spacer(Modifier.height(10.dp))
            Text(
                if (expanded) "// hide submission" else "// show submission",
                style = MetricHint,
                color = Hud.accent,
            )
            AnimatedVisibility(visible = expanded) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(Console.deep)
                        .border(1.dp, Console.border, RoundedCornerShape(6.dp))
                        .padding(12.dp),
                ) {
                    Text(entry.submittedCode, style = CodeStyle, color = Console.text)
                }
            }
        }
    }
    Spacer(Modifier.height(12.dp))
}

@Composable
private fun Inline(label: String, value: String, tone: Color) {
    Column {
        Text(label, style = MetricLabel, color = Hud.muted)
        Text(value, style = MetricHint.copy(fontSize = 13.sp), color = tone)
    }
}
