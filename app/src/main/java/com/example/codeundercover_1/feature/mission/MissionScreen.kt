package com.example.codeundercover_1.feature.mission

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.codeundercover_1.data.model.ValidateResponse
import com.example.codeundercover_1.data.repo.MissionPhase
import com.example.codeundercover_1.domain.Aura
import com.example.codeundercover_1.ui.components.AppButton
import com.example.codeundercover_1.ui.components.AppInput
import com.example.codeundercover_1.ui.components.ButtonVariant
import com.example.codeundercover_1.ui.components.ErrorBanner
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.hud.BadgeTone
import com.example.codeundercover_1.ui.hud.HudBadge
import com.example.codeundercover_1.ui.hud.HudPage
import com.example.codeundercover_1.ui.hud.HudPanel
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.CodeStyle
import com.example.codeundercover_1.ui.theme.Console
import com.example.codeundercover_1.ui.theme.Hud
import com.example.codeundercover_1.ui.theme.MetricHint
import com.example.codeundercover_1.ui.theme.MetricLabel
import com.example.codeundercover_1.ui.theme.MonoFont
import com.example.codeundercover_1.ui.theme.Semantic

@Composable
fun MissionScreen(
    missionId: String,
    onExit: () -> Unit,
) {
    val viewModel: MissionViewModel = viewModel(
        key = missionId,
        factory = viewModelFactory { initializer { MissionViewModel(missionId) } },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    val scroll = rememberScrollState()

    when {
        state.loading -> LoadingState(label = "Opening case file")
        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)
        state.detail == null -> ErrorState(message = "Mission not found.", onRetry = onExit)

        else -> {
            val detail = state.detail!!
            Column(
                Modifier
                    .imePadding()
                    .verticalScroll(scroll)
            ) {
                HudPage(
                    eyebrow = "FIELD_OP // MISSION_${detail.order.toString().padStart(2, '0')}",
                    title = detail.title,
                    subtitle = detail.description.takeIf { it.isNotBlank() },
                    status = { HudBadge(text = detail.difficulty, tone = BadgeTone.Amber) },
                ) {
                    PhaseIndicator(state.phase, hasQuiz = state.questions.isNotEmpty())

                    when (state.phase) {
                        MissionPhase.TEACHING -> TeachingPhase(state, viewModel)
                        MissionPhase.MCQ -> QuizPhase(state, viewModel)
                        MissionPhase.CODING -> CodingPhase(state, viewModel)
                    }

                    state.actionError?.let { ErrorBanner(it) }

                    AppButton(
                        text = "Leave mission",
                        onClick = onExit,
                        modifier = Modifier.fillMaxWidth(),
                        variant = ButtonVariant.Outline,
                    )
                    Spacer(Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
private fun ColumnScope.PhaseIndicator(phase: MissionPhase, hasQuiz: Boolean) {
    val steps = if (hasQuiz) {
        listOf(MissionPhase.TEACHING, MissionPhase.MCQ, MissionPhase.CODING)
    } else {
        listOf(MissionPhase.TEACHING, MissionPhase.CODING)
    }
    val index = steps.indexOf(phase).coerceAtLeast(0)

    HudPanel(padding = 12.dp) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            steps.forEachIndexed { position, step ->
                val label = when (step) {
                    MissionPhase.TEACHING -> "INTEL"
                    MissionPhase.MCQ -> "VERIFY"
                    MissionPhase.CODING -> "FIELD WORK"
                }
                Text(
                    text = label,
                    style = MetricLabel,
                    color = if (position <= index) Hud.accent else Hud.muted,
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { (index + 1f) / steps.size },
            modifier = Modifier.fillMaxWidth().height(4.dp),
            color = Hud.accent,
            trackColor = Console.deep,
        )
    }
}

// ─── Phase 1: teaching ───────────────────────────────────────────────────────

@Composable
private fun ColumnScope.TeachingPhase(state: MissionUiState, viewModel: MissionViewModel) {
    val slide = state.currentSlide

    if (slide == null) {
        HudPanel {
            Text("No briefing material.", style = MetricHint, color = Hud.muted)
        }
        AppButton(
            text = "Continue",
            onClick = viewModel::nextSlide,
            modifier = Modifier.fillMaxWidth(),
        )
        return
    }

    HudPanel {
        Text(
            "SLIDE ${state.slideIndex + 1} / ${state.slides.size}",
            style = MetricLabel,
            color = Hud.accent,
        )
        Spacer(Modifier.height(10.dp))
        Text(
            slide.title,
            style = androidx.compose.ui.text.TextStyle(
                fontFamily = MonoFont,
                fontSize = 16.sp,
            ),
            color = Console.text,
        )
        Spacer(Modifier.height(12.dp))
        slide.content.forEach { line ->
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(">", style = CodeStyle, color = Hud.accent)
                Text(
                    line.trim(),
                    style = androidx.compose.ui.text.TextStyle(
                        fontFamily = MonoFont,
                        fontSize = 13.sp,
                        lineHeight = 20.sp,
                    ),
                    color = Console.text,
                )
            }
        }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        if (state.slideIndex > 0) {
            AppButton(
                text = "Back",
                onClick = viewModel::previousSlide,
                variant = ButtonVariant.Outline,
            )
        }
        AppButton(
            text = if (state.isLastSlide) "Start verification" else "Next",
            onClick = viewModel::nextSlide,
            modifier = Modifier.weight(1f),
        )
    }
}

// ─── Phase 2: quiz ───────────────────────────────────────────────────────────

@Composable
private fun ColumnScope.QuizPhase(state: MissionUiState, viewModel: MissionViewModel) {
    state.questions.forEachIndexed { questionIndex, question ->
        HudPanel {
            Text("QUERY ${questionIndex + 1}", style = MetricLabel, color = Hud.accent)
            Spacer(Modifier.height(8.dp))
            Text(
                question.question,
                style = androidx.compose.ui.text.TextStyle(
                    fontFamily = MonoFont,
                    fontSize = 14.sp,
                    lineHeight = 21.sp,
                ),
                color = Console.text,
            )
            Spacer(Modifier.height(12.dp))

            Column(Modifier.selectableGroup()) {
                question.options.forEachIndexed { optionIndex, option ->
                    val selected = state.answers[questionIndex] == optionIndex
                    // Once graded the right answer is always highlighted, so a
                    // wrong pick still teaches the correct one.
                    val tone = when {
                        !state.quizGraded -> if (selected) Hud.accent else Console.text
                        optionIndex == question.correctIndex -> Semantic.emerald400
                        selected -> Semantic.red400
                        else -> Hud.muted
                    }
                    OptionRow(
                        text = option,
                        tone = tone,
                        selected = selected,
                        enabled = !state.quizGraded,
                        onSelect = { viewModel.answer(questionIndex, optionIndex) },
                    )
                }
            }
        }
    }

    if (!state.quizGraded) {
        AppButton(
            text = "Check answers",
            onClick = viewModel::gradeQuiz,
            modifier = Modifier.fillMaxWidth(),
            enabled = state.allAnswered,
        )
        return
    }

    HudPanel(
        borderColor = if (state.quizPassed) Semantic.emeraldBorder else Semantic.errorBorder
    ) {
        Text(
            if (state.quizPassed) "// ALL CORRECT" else "// NOT QUITE",
            style = MetricLabel.copy(fontSize = 12.sp),
            color = if (state.quizPassed) Semantic.emerald400 else Semantic.red400,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "${state.correctCount} of ${state.questions.size} correct.",
            style = MetricHint,
            color = Hud.muted,
        )
    }

    AppButton(
        text = if (state.quizPassed) "Begin field work" else "Try again",
        onClick = {
            if (state.quizPassed) viewModel.proceedToCoding() else viewModel.retryQuiz()
        },
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun OptionRow(
    text: String,
    tone: Color,
    selected: Boolean,
    enabled: Boolean,
    onSelect: () -> Unit,
) {
    val shape = RoundedCornerShape(6.dp)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
            .clip(shape)
            .background(Console.deep)
            .border(1.dp, if (selected) tone else Console.border, shape)
            .clickable(enabled = enabled, onClick = onSelect)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(if (selected) tone else Console.border)
        )
        Text(
            text,
            style = androidx.compose.ui.text.TextStyle(
                fontFamily = MonoFont,
                fontSize = 13.sp,
            ),
            color = tone,
        )
    }
}

// ─── Phase 3: coding ─────────────────────────────────────────────────────────

@Composable
private fun ColumnScope.CodingPhase(state: MissionUiState, viewModel: MissionViewModel) {
    val layout = LocalAppLayout.current
    val detail = state.detail ?: return

    if (detail.goal?.isNotBlank() == true || detail.briefing.isNotBlank()) {
        HudPanel {
            Text("OBJECTIVE", style = MetricLabel, color = Hud.accent)
            Spacer(Modifier.height(8.dp))
            Text(
                detail.goal?.takeIf { it.isNotBlank() } ?: detail.briefing,
                style = androidx.compose.ui.text.TextStyle(
                    fontFamily = MonoFont,
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                ),
                color = Console.text,
            )
        }
    }

    val editor: @Composable ColumnScope.() -> Unit = {
        HudPanel {
            Text("EDITOR", style = MetricLabel, color = Hud.muted)
            Spacer(Modifier.height(8.dp))
            AppInput(
                value = state.code,
                onValueChange = viewModel::onCodeChange,
                enabled = !state.submitting && !state.running,
                singleLine = false,
                minHeight = 260.dp,
                textStyle = CodeStyle,
            )
            Spacer(Modifier.height(10.dp))
            Text("STDIN", style = MetricLabel, color = Hud.muted)
            Spacer(Modifier.height(8.dp))
            AppInput(
                value = state.stdin,
                onValueChange = viewModel::onStdinChange,
                enabled = !state.submitting && !state.running,
                singleLine = false,
                minHeight = 72.dp,
                textStyle = CodeStyle,
            )
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                AppButton(
                    text = "Run",
                    onClick = viewModel::run,
                    variant = ButtonVariant.Secondary,
                    enabled = !state.running && !state.submitting,
                    loading = state.running,
                )
                AppButton(
                    text = "Submit",
                    onClick = viewModel::submit,
                    modifier = Modifier.weight(1f),
                    loading = state.submitting,
                    enabled = !state.running,
                )
            }
        }
    }

    val results: @Composable ColumnScope.() -> Unit = {
        state.runResult?.let { result ->
            HudPanel {
                Text("TEST RUN", style = MetricLabel, color = Hud.muted)
                Spacer(Modifier.height(8.dp))
                Terminal(
                    text = when {
                        result.serviceUnavailable ->
                            result.errors ?: "The execution service is unavailable."

                        !result.success ->
                            result.compilerError ?: result.errors ?: "Execution failed."

                        else -> result.output?.takeIf { it.isNotBlank() } ?: "(no output)"
                    },
                    tone = if (result.success) Semantic.emerald400 else Semantic.red400,
                )
            }
        }

        state.submitResult?.let { SubmissionOutcome(it) }

        HudPanel {
            Text("SUPPORT", style = MetricLabel, color = Hud.muted)
            Spacer(Modifier.height(6.dp))
            Text(
                "${state.hintsRemaining} of ${MissionUiState.MAX_HINTS} hints left · " +
                    "${Aura.HINT_PENALTY} AP each",
                style = MetricHint,
                color = Hud.muted,
            )
            Spacer(Modifier.height(10.dp))
            AppButton(
                text = "Request hint",
                onClick = viewModel::requestHint,
                variant = ButtonVariant.Outline,
                enabled = !state.hintLoading && state.hintsRemaining > 0,
                loading = state.hintLoading,
            )
            state.hints.forEach { hint ->
                Spacer(Modifier.height(8.dp))
                Text(hint, style = CodeStyle, color = Semantic.amber400)
            }
        }
    }

    if (layout.supportsTwoPane) {
        Row(horizontalArrangement = Arrangement.spacedBy(layout.gutter)) {
            Column(Modifier.weight(1f)) { editor() }
            Column(Modifier.weight(1f)) { results() }
        }
    } else {
        editor()
        results()
    }
}

@Composable
private fun ColumnScope.SubmissionOutcome(result: ValidateResponse) {
    val passed = result.success

    HudPanel(
        borderColor = if (passed) Semantic.emeraldBorder else Semantic.errorBorder
    ) {
        Text(
            when {
                result.serviceUnavailable -> "// JUDGE UNAVAILABLE"
                passed && result.isReplay -> "// CLEARED AGAIN"
                passed -> "// MISSION CLEARED"
                else -> "// NOT ACCEPTED"
            },
            style = MetricLabel.copy(fontSize = 12.sp),
            color = if (passed) Semantic.emerald400 else Semantic.red400,
        )

        if (result.validationErrors.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            result.validationErrors.forEach {
                Text("· $it", style = MetricHint, color = Console.text)
            }
        }

        result.explanation?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, style = MetricHint, color = Hud.muted)
        }

        if (passed) {
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                if (result.earnedAura > 0) {
                    Text(
                        "+${result.earnedAura} AP",
                        style = MetricLabel.copy(fontSize = 12.sp),
                        color = Hud.accent,
                    )
                }
                if (result.comboBonus > 0) {
                    Text(
                        "+${result.comboBonus} COMBO",
                        style = MetricLabel.copy(fontSize = 12.sp),
                        color = Semantic.amber400,
                    )
                }
            }
            if (result.innovationUnlocked) {
                Spacer(Modifier.height(6.dp))
                Text(
                    "FOX INSIGNIA — ${result.innovationReason ?: "innovative solution"}",
                    style = MetricLabel,
                    color = Semantic.amber400,
                )
            }
            // A replay earns nothing; showing what it would have paid keeps the
            // feedback honest instead of silently awarding zero.
            result.wouldHaveEarnedAura?.let {
                Spacer(Modifier.height(6.dp))
                Text(
                    "Replay — no AP awarded (worth $it on a first clear).",
                    style = MetricHint,
                    color = Hud.muted,
                )
            }
        }

        if (result.stdout.isNotBlank()) {
            Spacer(Modifier.height(10.dp))
            Terminal(text = result.stdout, tone = Console.text)
        }
    }
}

@Composable
private fun Terminal(text: String, tone: Color) {
    val shape = RoundedCornerShape(6.dp)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(Console.deep)
            .border(1.dp, Console.border, shape)
            .padding(12.dp),
    ) {
        Text(text = text, style = CodeStyle, color = tone)
    }
}
