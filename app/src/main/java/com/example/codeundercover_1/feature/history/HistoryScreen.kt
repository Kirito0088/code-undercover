package com.example.codeundercover_1.feature.history

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.HistoryEntry
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.EmptyState
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.components.SecondaryButton
import com.example.codeundercover_1.ui.components.StampChip
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.CodeStyle
import com.example.codeundercover_1.ui.theme.DifficultyColors
import com.example.codeundercover_1.ui.theme.Noir
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
    val layout = LocalAppLayout.current

    when {
        state.loading -> LoadingState(label = "OPENING CLOSED CASES...")

        state.error != null ->
            ErrorState(message = state.error!!, onRetry = viewModel::load)

        state.entries.isEmpty() -> EmptyState(
            title = "No closed cases",
            detail = "Missions you complete will be filed here.",
            action = { SecondaryButton(text = "BACK", onClick = onBack) },
        )

        else -> LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(
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
                        "Case Files",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        "${state.entries.size} closed",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            items(state.entries, key = { it.id }) { entry ->
                HistoryCard(entry)
            }
        }
    }
}

@Composable
private fun HistoryCard(entry: HistoryEntry) {
    var expanded by remember { mutableStateOf(false) }

    DossierCard(
        modifier = Modifier.clickable(
            enabled = entry.submittedCode != null,
        ) { expanded = !expanded },
        accent = if (entry.innovationUnlocked) Noir.brass else null,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    "MISSION ${entry.missionOrder}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    entry.missionTitle,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
            StampChip(
                text = entry.difficulty,
                color = DifficultyColors.forDifficulty(entry.difficulty),
            )
        }

        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Stat("AURA", "+${entry.auraReward}", Noir.brass)
            Stat("ATTEMPTS", entry.attemptCount.toString(), MaterialTheme.colorScheme.onSurfaceVariant)
            Stat("HINTS", entry.hintsUsed.toString(), MaterialTheme.colorScheme.onSurfaceVariant)
        }

        if (entry.innovationUnlocked) {
            Spacer(Modifier.height(8.dp))
            Text(
                "FOX BADGE — innovative solution",
                style = MaterialTheme.typography.labelSmall,
                color = Noir.brass,
            )
        }

        if (entry.submittedCode != null) {
            Spacer(Modifier.height(10.dp))
            Text(
                if (expanded) "Hide submission" else "Show submission",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary,
            )

            AnimatedVisibility(visible = expanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp)
                        .background(Noir.chalkboardDeep, RoundedCornerShape(4.dp))
                        .padding(12.dp),
                ) {
                    Text(
                        entry.submittedCode,
                        style = CodeStyle,
                        color = Noir.chalk,
                    )
                }
            }
        }
    }
}

@Composable
private fun Stat(label: String, value: String, tone: androidx.compose.ui.graphics.Color) {
    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.titleMedium, color = tone)
    }
}
