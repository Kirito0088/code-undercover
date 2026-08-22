package com.example.codeundercover_1.feature.mission

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.codeundercover_1.data.model.ValidateResponse
import com.example.codeundercover_1.data.repo.MissionPhase
import com.example.codeundercover_1.ui.components.DossierCard
import com.example.codeundercover_1.ui.components.ErrorState
import com.example.codeundercover_1.ui.components.LoadingState
import com.example.codeundercover_1.ui.components.PrimaryButton
import com.example.codeundercover_1.ui.components.ResponsiveContent
import com.example.codeundercover_1.ui.components.SecondaryButton
import com.example.codeundercover_1.ui.components.SectionHeader
import com.example.codeundercover_1.ui.components.StampChip
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.ChalkStyle
import com.example.codeundercover_1.ui.theme.CodeStyle
import com.example.codeundercover_1.ui.theme.DifficultyColors
import com.example.codeundercover_1.ui.theme.Noir

@Composable
fun MissionScreen(
    missionId: String,
    onExit: () -> Unit,
) {
    val viewModel: MissionViewModel = viewModel(
        key = missionId,
        factory = viewModelFactory {
            initializer { MissionViewModel(missionId) }
        },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    val scroll = rememberScrollState()

    when {
        state.loading -> LoadingState(label = "OPENING CASE FILE...")

        state.error != null -> ErrorState(message = state.error!!, onRetry = viewModel::load)

        state.detail == null -> ErrorState(message = "Mission not found.", onRetry = onExit)

        else -> {
            val detail = state.detail!!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .safeDrawingPadding()
                    .imePadding()
                    .verticalScroll(scroll),
            ) {
                ResponsiveContent {
                    Spacer(Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            "MISSION ${detail.order}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        StampChip(
                            text = detail.difficulty,
                            color = DifficultyColors.forDifficulty(detail.difficulty),
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        detail.title,
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                    )

                    Spacer(Modifier.height(12.dp))
                    PhaseIndicator(state.phase, hasQuiz = state.questions.isNotEmpty())
                    Spacer(Modifier.height(18.dp))

                    when (state.phase) {
                        MissionPhase.TEACHING -> TeachingPhase(state, viewModel)
                        MissionPhase.MCQ -> QuizPhase(state, viewModel)
                        MissionPhase.CODING -> CodingPhase(state, viewModel)
                    }

                    state.actionError?.let { message ->
                        Spacer(Modifier.height(12.dp))
                        Text(
                            message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }

                    Spacer(Modifier.height(16.dp))
                    SecondaryButton(
                        text = "LEAVE MISSION",
                        onClick = onExit,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(32.dp))
                }
            }
        }
    }
}

@Composable
private fun PhaseIndicator(phase: MissionPhase, hasQuiz: Boolean) {
    val steps = if (hasQuiz) {
        listOf(MissionPhase.TEACHING, MissionPhase.MCQ, MissionPhase.CODING)
    } else {
        listOf(MissionPhase.TEACHING, MissionPhase.CODING)
    }
    val index = steps.indexOf(phase).coerceAtLeast(0)

    Column {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            steps.forEachIndexed { position, step ->
                val label = when (step) {
                    MissionPhase.TEACHING -> "BRIEF"
                    MissionPhase.MCQ -> "QUIZ"
                    MissionPhase.CODING -> "FIELD WORK"
                }
                Text(
                    label,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (position <= index) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Spacer(Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { (index + 1f) / steps.size },
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp),
            color = Noir.brass,
            trackColor = MaterialTheme.colorScheme.surfaceVariant,
        )
    }
}

// ─── Phase 1: teaching ───────────────────────────────────────────────────────

@Composable
private fun ColumnScope.TeachingPhase(state: MissionUiState, viewModel: MissionViewModel) {
    val slide = state.currentSlide

    if (slide == null) {
        DossierCard {
            Text(
                "This mission has no briefing material.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(14.dp))
        PrimaryButton(
            text = "CONTINUE",
            onClick = viewModel::nextSlide,
            modifier = Modifier.fillMaxWidth(),
        )
        return
    }

    DossierCard {
        Text(
            "SLIDE ${state.slideIndex + 1} OF ${state.slides.size}",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.primary,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            slide.title,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(Modifier.height(12.dp))
        slide.content.forEach { line ->
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("—", style = ChalkStyle, color = Noir.brass)
                Text(
                    line.trim(),
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
        }
    }

    Spacer(Modifier.height(14.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        if (state.slideIndex > 0) {
            SecondaryButton(text = "BACK", onClick = viewModel::previousSlide)
        }
        PrimaryButton(
            text = if (state.isLastSlide) "START QUIZ" else "NEXT",
            onClick = viewModel::nextSlide,
            modifier = Modifier.weight(1f),
        )
    }
}

// ─── Phase 2: quiz ───────────────────────────────────────────────────────────

@Composable
private fun ColumnScope.QuizPhase(state: MissionUiState, viewModel: MissionViewModel) {
    state.questions.forEachIndexed { questionIndex, question ->
        DossierCard(modifier = Modifier.padding(bottom = 12.dp)) {
            Text(
                "QUESTION ${questionIndex + 1}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                question.question,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(10.dp))

            Column(Modifier.selectableGroup()) {
                question.options.forEachIndexed { optionIndex, option ->
                    val selected = state.answers[questionIndex] == optionIndex
                    // Once graded, the right answer is always highlighted so a
                    // wrong pick still teaches the correct one.
                    val tone = when {
                        !state.quizGraded -> MaterialTheme.colorScheme.onSurface
                        optionIndex == question.correctIndex -> Noir.mossBright
                        selected -> MaterialTheme.colorScheme.error
                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(
                            selected = selected,
                            onClick = { viewModel.answer(questionIndex, optionIndex) },
                            enabled = !state.quizGraded,
                        )
                        Text(option, style = MaterialTheme.typography.bodyLarge, color = tone)
                    }
                }
            }
        }
    }

    if (!state.quizGraded) {
        PrimaryButton(
            text = "CHECK ANSWERS",
            onClick = viewModel::gradeQuiz,
            modifier = Modifier.fillMaxWidth(),
            enabled = state.allAnswered,
        )
        return
    }

    DossierCard(accent = if (state.quizPassed) Noir.cleared else MaterialTheme.colorScheme.error) {
        Text(
            if (state.quizPassed) "ALL CORRECT" else "NOT QUITE",
            style = MaterialTheme.typography.titleLarge,
            color = if (state.quizPassed) Noir.mossBright else MaterialTheme.colorScheme.error,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "${state.correctCount} of ${state.questions.size} correct.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }

    Spacer(Modifier.height(14.dp))
    if (state.quizPassed) {
        PrimaryButton(
            text = "BEGIN FIELD WORK",
            onClick = viewModel::proceedToCoding,
            modifier = Modifier.fillMaxWidth(),
        )
    } else {
        PrimaryButton(
            text = "TRY AGAIN",
            onClick = viewModel::retryQuiz,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

// ─── Phase 3: coding ─────────────────────────────────────────────────────────

@Composable
private fun ColumnScope.CodingPhase(state: MissionUiState, viewModel: MissionViewModel) {
    val layout = LocalAppLayout.current
    val detail = state.detail ?: return

    if (detail.goal?.isNotBlank() == true || detail.briefing.isNotBlank()) {
        DossierCard {
            SectionHeader("Objective")
            Text(
                detail.goal?.takeIf { it.isNotBlank() } ?: detail.briefing,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
        }
        Spacer(Modifier.height(14.dp))
    }

    val editor: @Composable ColumnScope.() -> Unit = {
        SectionHeader("Your code")
        MonoField(
            value = state.code,
            onValueChange = viewModel::onCodeChange,
            enabled = !state.submitting && !state.running,
            minHeight = 260.dp,
        )
        Spacer(Modifier.height(10.dp))
        SectionHeader("Standard input")
        MonoField(
            value = state.stdin,
            onValueChange = viewModel::onStdinChange,
            enabled = !state.submitting && !state.running,
            minHeight = 72.dp,
        )
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            SecondaryButton(
                text = "RUN",
                onClick = viewModel::run,
                enabled = !state.running && !state.submitting,
            )
            PrimaryButton(
                text = "SUBMIT",
                onClick = viewModel::submit,
                loading = state.submitting,
                enabled = !state.running,
                modifier = Modifier.weight(1f),
            )
        }
    }

    val results: @Composable ColumnScope.() -> Unit = {
        state.runResult?.let { result ->
            SectionHeader("Test run")
            Terminal(
                text = when {
                    result.serviceUnavailable ->
                        result.errors ?: "The execution service is unavailable."

                    !result.success ->
                        result.compilerError ?: result.errors ?: "Execution failed."

                    else -> result.output?.takeIf { it.isNotBlank() } ?: "(no output)"
                },
                tone = if (result.success) Noir.mossBright else MaterialTheme.colorScheme.error,
            )
            Spacer(Modifier.height(14.dp))
        }

        state.submitResult?.let { result ->
            SubmissionOutcome(result)
            Spacer(Modifier.height(14.dp))
        }

        HintPanel(state, viewModel)
    }

    if (layout.supportsTwoPane) {
        Row(horizontalArrangement = Arrangement.spacedBy(layout.gutter)) {
            Column(Modifier.weight(1f)) { editor() }
            Column(Modifier.weight(1f)) { results() }
        }
    } else {
        editor()
        Spacer(Modifier.height(18.dp))
        results()
    }
}

@Composable
private fun ColumnScope.SubmissionOutcome(result: ValidateResponse) {
    val passed = result.success

    DossierCard(accent = if (passed) Noir.cleared else MaterialTheme.colorScheme.error) {
        Text(
            when {
                result.serviceUnavailable -> "JUDGE UNAVAILABLE"
                passed && result.isReplay -> "CLEARED AGAIN"
                passed -> "MISSION CLEARED"
                else -> "NOT ACCEPTED"
            },
            style = MaterialTheme.typography.titleLarge,
            color = if (passed) Noir.mossBright else MaterialTheme.colorScheme.error,
        )

        if (result.validationErrors.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            result.validationErrors.forEach { message ->
                Text(
                    "• $message",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
        }

        result.explanation?.let { explanation ->
            Spacer(Modifier.height(8.dp))
            Text(
                explanation,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        if (passed) {
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                if (result.earnedAura > 0) {
                    Text(
                        "+${result.earnedAura} aura",
                        style = MaterialTheme.typography.labelLarge,
                        color = Noir.brass,
                    )
                }
                if (result.comboBonus > 0) {
                    Text(
                        "+${result.comboBonus} combo",
                        style = MaterialTheme.typography.labelLarge,
                        color = Noir.amber,
                    )
                }
            }
            if (result.innovationUnlocked) {
                Spacer(Modifier.height(6.dp))
                Text(
                    "FOX BADGE — ${result.innovationReason ?: "innovative solution"}",
                    style = MaterialTheme.typography.labelSmall,
                    color = Noir.brass,
                )
            }
            // A replay earns nothing, but showing what it *would* have paid
            // keeps the feedback honest instead of silently awarding zero.
            result.wouldHaveEarnedAura?.let { potential ->
                Spacer(Modifier.height(6.dp))
                Text(
                    "Replay — no aura awarded (worth $potential on a first clear).",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        if (result.stdout.isNotBlank()) {
            Spacer(Modifier.height(10.dp))
            Terminal(text = result.stdout, tone = Noir.chalk)
        }
    }
}

@Composable
private fun ColumnScope.HintPanel(state: MissionUiState, viewModel: MissionViewModel) {
    SectionHeader("Support")
    Text(
        "${state.hintsRemaining} of ${MissionUiState.MAX_HINTS} hints left. " +
            "Each one costs ${com.example.codeundercover_1.domain.Aura.HINT_PENALTY} aura.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    Spacer(Modifier.height(8.dp))
    SecondaryButton(
        text = "REQUEST HINT",
        onClick = viewModel::requestHint,
        enabled = !state.hintLoading && state.hintsRemaining > 0,
    )

    state.hints.forEach { hint ->
        Spacer(Modifier.height(8.dp))
        Text(hint, style = ChalkStyle, color = Noir.brassBright)
    }
}

@Composable
private fun MonoField(
    value: String,
    onValueChange: (String) -> Unit,
    enabled: Boolean,
    minHeight: Dp,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = minHeight),
        enabled = enabled,
        textStyle = CodeStyle.copy(color = MaterialTheme.colorScheme.onSurface),
        shape = RoundedCornerShape(4.dp),
        singleLine = false,
    )
}

@Composable
private fun Terminal(text: String, tone: Color) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Noir.chalkboardDeep, RoundedCornerShape(4.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(4.dp))
            .padding(12.dp),
    ) {
        Text(text, style = CodeStyle, color = tone)
    }
}
