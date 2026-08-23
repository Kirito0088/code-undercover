package com.example.codeundercover_1.feature.lab

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.CompileResponse
import com.example.codeundercover_1.data.model.CompilerDiagnostic
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.repo.CompilerRepository
import com.example.codeundercover_1.ui.components.AppButton
import com.example.codeundercover_1.ui.components.AppInput
import com.example.codeundercover_1.ui.components.ButtonVariant
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
import com.example.codeundercover_1.ui.theme.Semantic
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private const val STARTER_CODE = """#include <stdio.h>

int main(void) {
    printf("Hello Agent\n");
    return 0;
}
"""

data class DebugLabUiState(
    val code: String = STARTER_CODE,
    val stdin: String = "",
    val running: Boolean = false,
    val result: CompileResponse? = null,
    val error: String? = null,
)

class DebugLabViewModel : ViewModel() {

    private val compiler = ServiceLocator.compiler

    private val _state = MutableStateFlow(DebugLabUiState())
    val state: StateFlow<DebugLabUiState> = _state.asStateFlow()

    fun onCodeChange(value: String) = _state.update { it.copy(code = value) }
    fun onStdinChange(value: String) = _state.update { it.copy(stdin = value) }

    fun reset() = _state.update {
        it.copy(code = STARTER_CODE, stdin = "", result = null, error = null)
    }

    fun run() {
        val current = _state.value
        if (current.running) return

        _state.update { it.copy(running = true, error = null, result = null) }
        viewModelScope.launch {
            when (val result = compiler.run(current.code, current.stdin)) {
                is ApiResult.Success ->
                    _state.update { it.copy(running = false, result = result.data) }

                is ApiResult.Failure ->
                    _state.update { it.copy(running = false, error = result.error.message) }
            }
        }
    }
}

@Composable
fun DebugLabScreen(viewModel: DebugLabViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val layout = LocalAppLayout.current
    val scroll = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .imePadding()
            .verticalScroll(scroll),
    ) {
        HudPage(
            eyebrow = "Sandbox",
            title = "Debug Lab",
            subtitle = "Same compiler the missions use",
            status = {
                HudBadge(
                    text = if (state.running) "RUNNING" else "IDLE",
                    tone = if (state.running) BadgeTone.Amber else BadgeTone.Active,
                )
            },
        ) {
            if (layout.supportsTwoPane) {
                Row(horizontalArrangement = Arrangement.spacedBy(layout.gutter)) {
                    Column(Modifier.weight(1f)) { EditorSection(state, viewModel) }
                    Column(Modifier.weight(1f)) { OutputSection(state) }
                }
            } else {
                EditorSection(state, viewModel)
                OutputSection(state)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun ColumnScope.EditorSection(state: DebugLabUiState, viewModel: DebugLabViewModel) {
    HudPanel {
        Text("SOURCE", style = MetricLabel, color = Hud.muted)
        Spacer(Modifier.height(8.dp))
        AppInput(
            value = state.code,
            onValueChange = viewModel::onCodeChange,
            enabled = !state.running,
            singleLine = false,
            minHeight = 240.dp,
            textStyle = CodeStyle,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "${state.code.length} / ${CompilerRepository.MAX_CODE_LENGTH}",
            style = MetricHint,
            color = if (state.code.length > CompilerRepository.MAX_CODE_LENGTH) {
                Semantic.red400
            } else {
                Hud.muted
            },
        )

        Spacer(Modifier.height(16.dp))
        Text("STDIN", style = MetricLabel, color = Hud.muted)
        Spacer(Modifier.height(8.dp))
        AppInput(
            value = state.stdin,
            onValueChange = viewModel::onStdinChange,
            enabled = !state.running,
            singleLine = false,
            minHeight = 72.dp,
            textStyle = CodeStyle,
        )

        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AppButton(
                text = if (state.running) "Running..." else "Run",
                onClick = viewModel::run,
                modifier = Modifier.weight(1f),
                loading = state.running,
            )
            AppButton(
                text = "Reset",
                onClick = viewModel::reset,
                variant = ButtonVariant.Outline,
                enabled = !state.running,
            )
        }
    }
}

@Composable
private fun ColumnScope.OutputSection(state: DebugLabUiState) {
    HudPanel {
        Text("OUTPUT", style = MetricLabel, color = Hud.muted)
        Spacer(Modifier.height(8.dp))

        val result = state.result
        when {
            state.error != null -> Terminal(state.error!!, Semantic.red400)

            state.running -> Terminal("Compiling and running...", Hud.muted)

            result == null -> Terminal("Nothing has been run yet.", Hud.muted)

            // A judge outage must never be dressed up as a compile error.
            result.serviceUnavailable -> Terminal(
                result.errors ?: "The execution service is unavailable.",
                Semantic.red400,
            )

            !result.success -> {
                Terminal(
                    result.compilerError ?: result.errors ?: "Execution failed.",
                    Semantic.red400,
                )
                result.explanation?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, style = MetricHint, color = Hud.muted)
                }
                Diagnostics(result.diagnostics)
            }

            else -> {
                Terminal(
                    result.output?.takeIf { it.isNotBlank() } ?: "(no output)",
                    Semantic.emerald400,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Finished in ${result.executionTimeMs} ms" +
                        (result.exitCode?.let { " · exit $it" } ?: ""),
                    style = MetricHint,
                    color = Hud.muted,
                )
                Diagnostics(result.diagnostics.filter { it.type != "error" })
            }
        }
    }
}

@Composable
private fun ColumnScope.Diagnostics(diagnostics: List<CompilerDiagnostic>) {
    if (diagnostics.isEmpty()) return
    Spacer(Modifier.height(12.dp))
    Text("COMPILER NOTES", style = MetricLabel, color = Hud.muted)
    Spacer(Modifier.height(6.dp))
    diagnostics.forEach { diagnostic ->
        val tone = when (diagnostic.type) {
            "error" -> Semantic.red400
            "warning" -> Semantic.amber400
            else -> Hud.muted
        }
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(diagnostic.line?.let { "L$it" } ?: "—", style = CodeStyle, color = tone)
            Text(diagnostic.message.orEmpty(), style = MetricHint, color = Hud.text)
        }
    }
}

@Composable
private fun Terminal(text: String, tone: Color) {
    val shape = RoundedCornerShape(6.dp)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 120.dp)
            .clip(shape)
            .background(Console.deep)
            .border(1.dp, Console.border, shape)
            .padding(12.dp),
    ) {
        Text(text = text, style = CodeStyle, color = tone)
    }
}
