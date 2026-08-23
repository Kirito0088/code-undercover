package com.example.codeundercover_1.feature.daily

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.DailyAnswerResponse
import com.example.codeundercover_1.data.model.DailyQuestion
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.ui.components.AppButton
import com.example.codeundercover_1.ui.components.ButtonVariant
import com.example.codeundercover_1.ui.components.EmptyState
import com.example.codeundercover_1.ui.components.ErrorBanner
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.hud.BadgeTone
import com.example.codeundercover_1.ui.hud.HudBadge
import com.example.codeundercover_1.ui.hud.HudPage
import com.example.codeundercover_1.ui.hud.HudPanel
import com.example.codeundercover_1.ui.theme.Console
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
        state.loading -> LoadingState(label = "Fetching today's brief")

        state.error != null && state.question == null ->
            ErrorState(message = state.error!!, onRetry = viewModel::load)

        state.question == null -> EmptyState(
            title = "No brief today",
            detail = "There is no daily question available right now.",
        )

        else -> {
            val question = state.question!!
            Column(Modifier.verticalScroll(scroll)) {
                HudPage(
                    eyebrow = "Daily",
                    title = "Daily Task",
                    subtitle = "Worth 20 aura",
                    status = { HudBadge(text = "NEW", tone = BadgeTone.Active) },
                ) {
                    HudPanel {
                        Text(
                            text = question.question,
                            style = androidx.compose.ui.text.TextStyle(
                                fontFamily = MonoFont,
                                fontSize = 14.sp,
                                lineHeight = 21.sp,
                            ),
                            color = Hud.text,
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

                    state.error?.let { ErrorBanner(it) }

                    val outcome = state.outcome
                    if (outcome == null) {
                        AppButton(
                            text = if (state.submitting) "Submitting..." else "Submit answer",
                            onClick = viewModel::submit,
                            modifier = Modifier.fillMaxWidth(),
                            enabled = state.selected != null,
                            loading = state.submitting,
                        )
                    } else {
                        HudPanel(
                            borderColor = if (outcome.isCorrect) {
                                Semantic.emeraldBorder
                            } else {
                                Semantic.errorBorder
                            },
                        ) {
                            Text(
                                text = if (outcome.isCorrect) "// CORRECT" else "// INCORRECT",
                                style = MetricLabel.copy(fontSize = 12.sp),
                                color = if (outcome.isCorrect) {
                                    Semantic.emerald400
                                } else {
                                    Semantic.red400
                                },
                            )
                            if (!outcome.isCorrect) {
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    "Answer: ${outcome.correctAnswer}",
                                    style = MetricHint.copy(fontSize = 13.sp),
                                    color = Hud.text,
                                )
                            }
                            Spacer(Modifier.height(10.dp))
                            Text(outcome.explanation, style = MetricHint, color = Hud.muted)
                            if (outcome.earnedAura > 0) {
                                Spacer(Modifier.height(10.dp))
                                Text(
                                    "+${outcome.earnedAura} AURA",
                                    style = MetricLabel.copy(fontSize = 12.sp),
                                    color = Hud.accent,
                                )
                            }
                        }
                        AppButton(
                            text = "Back",
                            onClick = onBack,
                            modifier = Modifier.fillMaxWidth(),
                            variant = ButtonVariant.Outline,
                        )
                    }
                    Spacer(Modifier.height(24.dp))
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
    // Once graded, the correct option is highlighted regardless of what was
    // picked, so a wrong answer still teaches the right one.
    val tone = when {
        outcome == null -> if (selected) Hud.accent else Hud.text
        text == outcome.correctAnswer -> Semantic.emerald400
        selected -> Semantic.red400
        else -> Hud.muted
    }
    val borderTone = when {
        outcome == null -> if (selected) Hud.accent else Console.border
        text == outcome.correctAnswer -> Semantic.emeraldBorder
        selected -> Semantic.errorBorder
        else -> Console.border
    }
    val shape = RoundedCornerShape(6.dp)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
            .clip(shape)
            .background(Console.deep)
            .border(1.dp, borderTone, shape)
            .clickable(enabled = enabled, onClick = onSelect)
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(if (selected || outcome != null) tone else Console.border)
        )
        Text(
            text = text,
            style = androidx.compose.ui.text.TextStyle(
                fontFamily = MonoFont,
                fontSize = 13.sp,
            ),
            color = tone,
        )
    }
}
