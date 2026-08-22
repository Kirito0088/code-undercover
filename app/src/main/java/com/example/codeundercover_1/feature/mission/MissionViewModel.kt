package com.example.codeundercover_1.feature.mission

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.CompileResponse
import com.example.codeundercover_1.data.model.McqQuestion
import com.example.codeundercover_1.data.model.MissionDetail
import com.example.codeundercover_1.data.model.TeachingSlide
import com.example.codeundercover_1.data.model.ValidateResponse
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.repo.MissionPhase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MissionUiState(
    val loading: Boolean = true,
    val error: String? = null,

    val detail: MissionDetail? = null,
    val slides: List<TeachingSlide> = emptyList(),
    val questions: List<McqQuestion> = emptyList(),

    val phase: MissionPhase = MissionPhase.TEACHING,
    val slideIndex: Int = 0,

    /** questionIndex -> chosen option index. */
    val answers: Map<Int, Int> = emptyMap(),
    val quizGraded: Boolean = false,

    val code: String = "",
    val stdin: String = "",

    val running: Boolean = false,
    val runResult: CompileResponse? = null,

    val submitting: Boolean = false,
    val submitResult: ValidateResponse? = null,

    val hints: List<String> = emptyList(),
    val hintsUsed: Int = 0,
    val hintLoading: Boolean = false,

    val actionError: String? = null,
) {
    val currentSlide: TeachingSlide? get() = slides.getOrNull(slideIndex)
    val isLastSlide: Boolean get() = slideIndex >= slides.lastIndex

    val correctCount: Int
        get() = questions.indices.count { index ->
            answers[index] == questions[index].correctIndex
        }

    val quizPassed: Boolean
        get() = questions.isNotEmpty() && correctCount == questions.size

    val allAnswered: Boolean get() = answers.size == questions.size && questions.isNotEmpty()

    /** Hints are capped server-side; mirror that so the button can disable. */
    val hintsRemaining: Int get() = (MAX_HINTS - hintsUsed).coerceAtLeast(0)

    companion object {
        const val MAX_HINTS = 5
    }
}

class MissionViewModel(private val missionId: String) : ViewModel() {

    private val repo = ServiceLocator.missions
    private val compiler = ServiceLocator.compiler

    private val _state = MutableStateFlow(MissionUiState())
    val state: StateFlow<MissionUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.mission(missionId)) {
                is ApiResult.Success -> {
                    val detail = result.data
                    val slides = repo.teachingSlides(detail)
                    val questions = repo.mcqQuestions(detail)

                    // Resume where the server says the agent left off. A
                    // mission with no quiz skips straight past the MCQ phase
                    // rather than showing an empty step.
                    val serverPhase = MissionPhase.from(detail.phase)
                    val phase = when {
                        serverPhase == MissionPhase.MCQ && questions.isEmpty() ->
                            MissionPhase.CODING

                        serverPhase == MissionPhase.TEACHING && slides.isEmpty() ->
                            if (questions.isEmpty()) MissionPhase.CODING else MissionPhase.MCQ

                        else -> serverPhase
                    }

                    _state.update {
                        it.copy(
                            loading = false,
                            detail = detail,
                            slides = slides,
                            questions = questions,
                            phase = phase,
                            hintsUsed = detail.hintsUsed,
                            code = detail.submittedCode
                                ?: detail.startingCode
                                ?: DEFAULT_CODE,
                        )
                    }
                }

                is ApiResult.Failure ->
                    _state.update { it.copy(loading = false, error = result.error.message) }
            }
        }
    }

    // ─── Teaching ────────────────────────────────────────────────────────────

    fun nextSlide() {
        val current = _state.value
        if (!current.isLastSlide) {
            _state.update { it.copy(slideIndex = it.slideIndex + 1) }
        } else {
            val next = if (current.questions.isEmpty()) MissionPhase.CODING else MissionPhase.MCQ
            advanceTo(next)
        }
    }

    fun previousSlide() {
        if (_state.value.slideIndex > 0) {
            _state.update { it.copy(slideIndex = it.slideIndex - 1) }
        }
    }

    // ─── MCQ ─────────────────────────────────────────────────────────────────

    fun answer(questionIndex: Int, optionIndex: Int) {
        if (_state.value.quizGraded) return
        _state.update { it.copy(answers = it.answers + (questionIndex to optionIndex)) }
    }

    fun gradeQuiz() {
        if (!_state.value.allAnswered) return
        _state.update { it.copy(quizGraded = true) }
    }

    /** Lets a failed quiz be retried rather than dead-ending the mission. */
    fun retryQuiz() {
        _state.update { it.copy(answers = emptyMap(), quizGraded = false) }
    }

    fun proceedToCoding() {
        if (_state.value.quizPassed) advanceTo(MissionPhase.CODING)
    }

    private fun advanceTo(phase: MissionPhase) {
        _state.update { it.copy(phase = phase, actionError = null) }
        viewModelScope.launch {
            // Persist progress so the web app and a reinstalled phone both
            // resume in the same place. A failure here is not worth blocking
            // the UI over — it is recorded again on the next transition.
            repo.setPhase(missionId, phase)
        }
    }

    // ─── Coding ──────────────────────────────────────────────────────────────

    fun onCodeChange(value: String) = _state.update { it.copy(code = value) }
    fun onStdinChange(value: String) = _state.update { it.copy(stdin = value) }

    fun run() {
        val current = _state.value
        if (current.running) return
        _state.update { it.copy(running = true, runResult = null, actionError = null) }

        viewModelScope.launch {
            when (val result = compiler.run(current.code, current.stdin)) {
                is ApiResult.Success ->
                    _state.update { it.copy(running = false, runResult = result.data) }

                is ApiResult.Failure ->
                    _state.update { it.copy(running = false, actionError = result.error.message) }
            }
        }
    }

    fun submit() {
        val current = _state.value
        if (current.submitting) return
        _state.update { it.copy(submitting = true, submitResult = null, actionError = null) }

        viewModelScope.launch {
            when (val result = repo.submit(missionId, current.code, current.stdin)) {
                is ApiResult.Success ->
                    _state.update { it.copy(submitting = false, submitResult = result.data) }

                is ApiResult.Failure ->
                    _state.update {
                        it.copy(submitting = false, actionError = result.error.message)
                    }
            }
        }
    }

    fun requestHint() {
        val current = _state.value
        if (current.hintLoading || current.hintsRemaining == 0) return
        _state.update { it.copy(hintLoading = true, actionError = null) }

        viewModelScope.launch {
            when (val result = repo.requestHint(missionId)) {
                is ApiResult.Success -> _state.update {
                    val hint = result.data.hint
                    it.copy(
                        hintLoading = false,
                        hintsUsed = result.data.hintsUsed,
                        hints = if (hint != null) it.hints + hint else it.hints,
                    )
                }

                is ApiResult.Failure ->
                    _state.update {
                        it.copy(hintLoading = false, actionError = result.error.message)
                    }
            }
        }
    }

    fun dismissResult() = _state.update { it.copy(submitResult = null) }

    private companion object {
        const val DEFAULT_CODE = "#include <stdio.h>\n\nint main(void) {\n    \n    return 0;\n}\n"
    }
}
