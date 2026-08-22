package com.example.codeundercover_1.feature.lab

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
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
import com.example.codeundercover_1.ui.components.PrimaryButton
import com.example.codeundercover_1.ui.components.ResponsiveContent
import com.example.codeundercover_1.ui.components.SecondaryButton
import com.example.codeundercover_1.ui.components.SectionHeader
import com.example.codeundercover_1.ui.responsive.LocalAppLayout
import com.example.codeundercover_1.ui.theme.CodeStyle
import com.example.codeundercover_1.ui.theme.Noir
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .imePadding()
            .verticalScroll(scroll),
    ) {
        ResponsiveContent {
            Spacer(Modifier.height(12.dp))
            Text(
                "Debug Lab",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                "A scratchpad wired to the same compiler the missions use.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))

            // On a tablet or unfolded foldable the editor and its output sit
            // side by side; on a phone they stack, because a half-width editor
            // on a 5-inch screen is unusable.
            if (layout.supportsTwoPane) {
                Row(horizontalArrangement = Arrangement.spacedBy(layout.gutter)) {
                    Column(Modifier.weight(1f)) {
                        EditorSection(state, viewModel)
                    }
                    Column(Modifier.weight(1f)) {
                        OutputSection(state)
                    }
                }
            } else {
                EditorSection(state, viewModel)
                Spacer(Modifier.height(16.dp))
                OutputSection(state)
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun EditorSection(state: DebugLabUiState, viewModel: DebugLabViewModel) {
    SectionHeader("Source")
    CodeEditor(
        value = state.code,
        onValueChange = viewModel::onCodeChange,
        enabled = !state.running,
        minHeight = 240.dp,
    )
    Text(
        "${state.code.length} / ${CompilerRepository.MAX_CODE_LENGTH}",
        style = MaterialTheme.typography.bodySmall,
        color = if (state.code.length > CompilerRepository.MAX_CODE_LENGTH) {
            MaterialTheme.colorScheme.error
        } else {
            MaterialTheme.colorScheme.onSurfaceVariant
        },
        modifier = Modifier.padding(top = 4.dp),
    )

    Spacer(Modifier.height(12.dp))
    SectionHeader("Standard input")
    CodeEditor(
        value = state.stdin,
        onValueChange = viewModel::onStdinChange,
        enabled = !state.running,
        minHeight = 88.dp,
    )

    Spacer(Modifier.height(14.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        PrimaryButton(
            text = "RUN",
            onClick = viewModel::run,
            loading = state.running,
            modifier = Modifier.weight(1f),
        )
        SecondaryButton(
            text = "RESET",
            onClick = viewModel::reset,
            enabled = !state.running,
        )
    }
}

@Composable
private fun OutputSection(state: DebugLabUiState) {
    SectionHeader("Output")

    val result = state.result
    when {
        state.error != null -> OutputPane(text = state.error, tone = MaterialTheme.colorScheme.error)

        state.running -> OutputPane(
            text = "Compiling and running...",
            tone = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        result == null -> OutputPane(
            text = "Nothing has been run yet.",
            tone = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        // A judge outage is not the author's fault, and must not be dressed up
        // as a compile error.
        result.serviceUnavailable -> OutputPane(
            text = result.errors
                ?: "The code-execution service is unavailable. Your program was never run.",
            tone = MaterialTheme.colorScheme.error,
        )

        !result.success -> {
            OutputPane(
                text = result.compilerError ?: result.errors ?: "Execution failed.",
                tone = MaterialTheme.colorScheme.error,
            )
            result.explanation?.let { explanation ->
                Spacer(Modifier.height(10.dp))
                Text(
                    explanation,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            DiagnosticsList(result.diagnostics)
        }

        else -> {
            OutputPane(
                text = result.output?.takeIf { it.isNotBlank() }
                    ?: "(the program produced no output)",
                tone = Noir.mossBright,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Finished in ${result.executionTimeMs} ms" +
                    (result.exitCode?.let { " · exit $it" } ?: ""),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            // Warnings survive a successful build and are worth surfacing —
            // an uninitialised variable that happened to work is still a bug.
            DiagnosticsList(result.diagnostics.filter { it.type != "error" })
        }
    }
}

@Composable
private fun DiagnosticsList(diagnostics: List<CompilerDiagnostic>) {
    if (diagnostics.isEmpty()) return
    Spacer(Modifier.height(12.dp))
    SectionHeader("Compiler notes")
    diagnostics.forEach { diagnostic ->
        val tone = when (diagnostic.type) {
            "error" -> MaterialTheme.colorScheme.error
            "warning" -> Noir.amber
            else -> MaterialTheme.colorScheme.onSurfaceVariant
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 3.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = diagnostic.line?.let { "L$it" } ?: "—",
                style = CodeStyle,
                color = tone,
            )
            Text(
                text = diagnostic.message.orEmpty(),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}

/**
 * Plain monospace editor. Monaco is not portable to Android, and a WebView just
 * to host it would cost startup time and break the native keyboard handling —
 * a monospace field with the right IME settings is the better mobile trade.
 */
@Composable
private fun CodeEditor(
    value: String,
    onValueChange: (String) -> Unit,
    enabled: Boolean,
    minHeight: androidx.compose.ui.unit.Dp,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = minHeight),
        enabled = enabled,
        textStyle = CodeStyle.copy(color = MaterialTheme.colorScheme.onSurface),
        shape = RoundedCornerShape(4.dp),
        singleLine = false,
    )
}

@Composable
private fun OutputPane(text: String, tone: Color) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 120.dp)
            .background(Noir.chalkboardDeep, RoundedCornerShape(4.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(4.dp))
            .padding(12.dp),
    ) {
        Text(text = text, style = CodeStyle, color = tone)
    }
}
