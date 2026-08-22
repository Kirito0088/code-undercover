package com.example.codeundercover_1.feature.daily

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
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
import com.example.codeundercover_1.data.model.DailyAnswerResponse
import com.example.codeundercover_1.data.model.DailyQuestion
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.EmptyState
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.components.PrimaryButton
import com.example.codeundercover_1.ui.components.ResponsiveContent
import com.example.codeundercover_1.ui.components.SecondaryButton
import com.example.codeundercover_1.ui.theme.Noir
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DailyUiState(
    val loading: Boolean = true,
    val question: DailyQuestion? = null,
    val selected: String? = null,
    val submitting: Boolean = false,
    val outcome: DailyAnswerResponse? = null,
    val error: String? = null,
)

class DailyChallengeViewModel : ViewModel() {

    private val daily = ServiceLocator.daily

    private val _state = MutableStateFlow(DailyUiState())
    val state: StateFlow<DailyUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null, outcome = null, selected = null) }
        viewModelScope.launch {
            when (val result = daily.question()) {
                is ApiResult.Success ->
                    _state.update { it.copy(loading = false, question = result.data) }

                is ApiResult.Failure ->
                    _state.update { it.copy(loading = false, error = result.error.message) }
            }
        }
    }

    fun select(option: String) {
        // Locked once answered — the server has already scored it.
        if (_state.value.outcome != null) return
        _state.update { it.copy(selected = option) }
    }

    fun submit() {
        val current = _state.value
        val question = current.question ?: return
        val answer = current.selected ?: return
        if (current.submitting) return

        _state.update { it.copy(submitting = true, error = null) }
        viewModelScope.launch {
            when (val result = daily.answer(question.id, answer)) {
                is ApiResult.Success ->
                    _state.update { it.copy(submitting = false, outcome = result.data) }

                is ApiResult.Failure ->
                    _state.update { it.copy(submitting = false, error = result.error.message) }
            }
        }
    }
}

@Composable
fun DailyChallengeScreen(
    onBack: () -> Unit,
    viewModel: DailyChallengeViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val scroll = rememberScrollState()

    when {
        state.loading -> LoadingState(label = "FETCHING TODAY'S BRIEF...")

        state.error != null && state.question == null ->
            ErrorState(message = state.error!!, onRetry = viewModel::load)

        state.question == null -> EmptyState(
            title = "No brief today",
            detail = "There is no daily question available right now.",
            action = { SecondaryButton(text = "BACK", onClick = onBack) },
        )

        else -> {
            val question = state.question!!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .safeDrawingPadding()
                    .verticalScroll(scroll),
            ) {
                ResponsiveContent {
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "Daily Brief",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        "Worth 20 aura if you get it right.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(20.dp))

                    DossierCard {
                        Text(
                            question.question,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Spacer(Modifier.height(16.dp))

                        Column(Modifier.selectableGroup()) {
                            question.options.forEach { option ->
                                OptionRow(
                                    text = option,
                                    selected = state.selected == option,
                                    outcome = state.outcome,
                                    enabled = state.outcome == null && !state.submitting,
                                    onSelect = { viewModel.select(option) },
                                )
                            }
                        }
                    }

                    state.error?.let { message ->
                        Spacer(Modifier.height(12.dp))
                        Text(
                            message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }

                    Spacer(Modifier.height(18.dp))

                    val outcome = state.outcome
                    if (outcome == null) {
                        PrimaryButton(
                            text = "SUBMIT ANSWER",
                            onClick = viewModel::submit,
                            modifier = Modifier.fillMaxWidth(),
                            enabled = state.selected != null,
                            loading = state.submitting,
                        )
                    } else {
                        DossierCard(
                            accent = if (outcome.isCorrect) Noir.cleared else MaterialTheme.colorScheme.error
                        ) {
                            Text(
                                if (outcome.isCorrect) "CORRECT" else "INCORRECT",
                                style = MaterialTheme.typography.titleLarge,
                                color = if (outcome.isCorrect) Noir.mossBright
                                else MaterialTheme.colorScheme.error,
                            )
                            if (!outcome.isCorrect) {
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    "Answer: ${outcome.correctAnswer}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                )
                            }
                            Spacer(Modifier.height(10.dp))
                            Text(
                                outcome.explanation,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            if (outcome.earnedAura > 0) {
                                Spacer(Modifier.height(10.dp))
                                Text(
                                    "+${outcome.earnedAura} aura",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = Noir.brass,
                                )
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                        SecondaryButton(
                            text = "BACK",
                            onClick = onBack,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }

                    Spacer(Modifier.height(32.dp))
                }
            }
        }
    }
}

@Composable
private fun OptionRow(
    text: String,
    selected: Boolean,
    outcome: DailyAnswerResponse?,
    enabled: Boolean,
    onSelect: () -> Unit,
) {
    // After grading, the correct option is highlighted regardless of what was
    // picked, so a wrong answer still teaches something.
    val tint = when {
        outcome == null -> MaterialTheme.colorScheme.onSurface
        text == outcome.correctAnswer -> Noir.mossBright
        selected -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    androidx.compose.foundation.layout.Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        RadioButton(selected = selected, onClick = onSelect, enabled = enabled)
        Text(text = text, style = MaterialTheme.typography.bodyLarge, color = tint)
    }
}
