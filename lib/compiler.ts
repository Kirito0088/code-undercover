import { explainFirstDiagnostic } from './compilerExplanation'
import { CompilerDiagnostic } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

/** Name shown to the user in diagnostic messages */
const VIRTUAL_FILE_NAME = 'solution.c'

/** Maximum time (ms) allowed for the C compilation to finish */
const COMPILATION_TIMEOUT_MS = 4000

/** Maximum time (ms) allowed for the compiled binary to run */
const EXECUTION_TIMEOUT_MS = 3000

// ─── Result Interface ────────────────────────────────────────────────────────

export interface CompileExecutionResult {
    success: boolean
    output?: string
    compilerError?: string
    diagnostics?: CompilerDiagnostic[]
    errors?: string
    explanation?: string
    exitCode?: number | null
    executionTimeMs?: number
}

// ─── Compile Cache ───────────────────────────────────────────────────────────
// Avoids redundant GCC invocations for repeated identical submissions.

const CACHE_MAX_SIZE = 50
const compileCache = new Map<string, { result: CompileExecutionResult; timestamp: number }>()

function getCacheKey(code: string, input: string): string {
    return `${code}\0${input}`
}

function getCachedResult(code: string, input: string): CompileExecutionResult | null {
    const key = getCacheKey(code, input)
    const entry = compileCache.get(key)
    if (!entry) return null
    // Entries expire after 5 minutes
    if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
        compileCache.delete(key)
        return null
    }
    return entry.result
}

function setCachedResult(code: string, input: string, result: CompileExecutionResult): void {
    const key = getCacheKey(code, input)
    if (compileCache.size >= CACHE_MAX_SIZE) {
        const firstKey = compileCache.keys().next().value
        if (firstKey !== undefined) compileCache.delete(firstKey)
    }
    compileCache.set(key, { result, timestamp: Date.now() })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sanitize GCC output: filter out noise lines that confuse
 * beginners (MinGW internals, system includes, linker cruft, etc.).
 */
function sanitizeString(raw: string): string {
    if (!raw) return ''

    const NOISE_PATTERNS = [
        /^In file included from/i,
        /^C:[/\\].*gcc/i,
        /^C:[/\\].*mingw/i,
        /mingw/i,
        /^cc1(\.exe)?:/i,
        /^collect2/i,
        /^ld\.exe:/i,
        /^\/usr\/include/i,
        /^\/usr\/lib/i,
        /^\/opt\//i,
    ]

    const filtered = raw.split('\n').filter(line => {
        const t = line.trim()
        if (!t) return true // keep blank lines for context
        return !NOISE_PATTERNS.some(pat => pat.test(t))
    })

    return filtered.join('\n')
}

/**
 * Parse GCC diagnostic messages from sanitized stderr into structured objects.
 */
function parseGccDiagnostics(sanitizedStderr: string): CompilerDiagnostic[] {
    const diagnostics: CompilerDiagnostic[] = []
    const lines = sanitizedStderr.split('\n')

    const diagnosticRegex = new RegExp(
        `^${VIRTUAL_FILE_NAME}:(\\d+):(\\d+):\\s*(error|warning|note|fatal error):\\s*(.+)$`
    )

    let currentDiag: CompilerDiagnostic | null = null
    let contextLines: string[] = []

    for (const line of lines) {
        const match = line.match(diagnosticRegex)
        if (match) {
            if (currentDiag) {
                currentDiag.rawContext = contextLines.join('\n').trim()
                diagnostics.push(currentDiag)
            }
            currentDiag = {
                line: parseInt(match[1], 10),
                column: parseInt(match[2], 10),
                type: (match[3] === 'fatal error' ? 'error' : match[3]) as 'error' | 'warning' | 'note',
                message: match[4].trim(),
                rawContext: '',
            }
            contextLines = []
        } else if (currentDiag && line.trim() !== '') {
            contextLines.push(line)
        }
    }

    if (currentDiag) {
        currentDiag.rawContext = contextLines.join('\n').trim()
        diagnostics.push(currentDiag)
    }

    return diagnostics
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function executeCode(
    code: string,
    input: string = ''
): Promise<CompileExecutionResult> {
    // ── Cache check — instant return for repeated identical submissions ──
    const cached = getCachedResult(code, input)
    if (cached) {
        console.log('[COMPILER] Cache hit — returning cached result')
        return { ...cached, executionTimeMs: 0 }
    }

    const startTime = Date.now()

    try {
        const apiUrl = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute'

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), COMPILATION_TIMEOUT_MS + EXECUTION_TIMEOUT_MS + 4000)

        let pistonResponse;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: 'c',
                    version: '*',
                    files: [
                        {
                            name: VIRTUAL_FILE_NAME,
                            content: code,
                        },
                    ],
                    stdin: input,
                    compile_timeout: COMPILATION_TIMEOUT_MS,
                    run_timeout: EXECUTION_TIMEOUT_MS
                }),
                signal: controller.signal,
            })

            if (!response.ok) {
                const errText = await response.text()
                throw new Error(`Piston API returned status ${response.status}: ${errText}`)
            }

            pistonResponse = await response.json()
        } finally {
            clearTimeout(timeoutId)
        }

        if (!pistonResponse || typeof pistonResponse !== 'object') {
            throw new Error('Invalid response from Piston API')
        }

        const compileData = pistonResponse.compile
        const runData = pistonResponse.run

        if (!runData) {
            // If compile exists and exited non-zero, or no runData is present, compilation failed
            const compileStderr = compileData ? (compileData.stderr || compileData.output || '') : ''
            const sanitizedCompilerError = sanitizeString(compileStderr)
            const diagnostics = parseGccDiagnostics(sanitizedCompilerError)
            const explanationText =
                explainFirstDiagnostic(diagnostics) ??
                'There is a compilation error. Read the output above for details.'

            const compileErrorResult: CompileExecutionResult = {
                success: false,
                compilerError: sanitizedCompilerError || 'Compilation failed',
                diagnostics,
                explanation: explanationText,
                executionTimeMs: Date.now() - startTime,
            }
            setCachedResult(code, input, compileErrorResult)
            return compileErrorResult
        }

        const compileStderr = compileData ? (compileData.stderr || compileData.output || '') : ''
        const sanitizedCompilerError = sanitizeString(compileStderr)
        const hasGccErrors = /\b(error|fatal error):/i.test(sanitizedCompilerError) || (compileData && compileData.code !== 0 && compileData.code !== null)

        if (hasGccErrors) {
            const diagnostics = parseGccDiagnostics(sanitizedCompilerError)
            const explanationText =
                explainFirstDiagnostic(diagnostics) ??
                'There is a compilation error. Read the output above for details.'

            const compileErrorResult: CompileExecutionResult = {
                success: false,
                compilerError: sanitizedCompilerError,
                diagnostics,
                explanation: explanationText,
                executionTimeMs: Date.now() - startTime,
            }
            setCachedResult(code, input, compileErrorResult)
            return compileErrorResult
        }

        // ── Step 3: Parse run results ────────────────────────────────────
        const programOutput = sanitizeString(runData.stdout || '')
        const programError = sanitizeString(runData.stderr || '')
        const executionTimeMs = Date.now() - startTime

        // ── Timeout ───────────────────────────────────────────────────────
        const isTimeout = runData.signal === 'SIGKILL' || runData.signal === 'SIGTERM' || runData.code === null || (runData.stderr && runData.stderr.includes('timeout'))
        if (isTimeout) {
            return {
                success: false,
                output: programOutput || undefined,
                errors: `Execution Timeout: Your program took longer than ${EXECUTION_TIMEOUT_MS / 1000}s to finish. Check for infinite loops or excessive computation.`,
                exitCode: null,
                executionTimeMs,
            }
        }

        // ── Runtime error (non-zero exit) ─────────────────────────────────
        if (runData.code !== null && runData.code !== 0) {
            return {
                success: false,
                output: programOutput || undefined,
                errors: programError || `Program exited with code ${runData.code}`,
                exitCode: runData.code,
                executionTimeMs,
            }
        }

        // ── Collect any compiler warnings that didn't block execution ─────
        const sanitizedWarnings = sanitizedCompilerError || undefined
        const warningDiagnostics = sanitizedWarnings
            ? parseGccDiagnostics(sanitizedWarnings)
            : undefined

        // ── Success ───────────────────────────────────────────────────────
        const successResult: CompileExecutionResult = {
            success: true,
            output: programOutput,
            compilerError: sanitizedWarnings,
            diagnostics: warningDiagnostics,
            errors: programError || undefined,
            exitCode: runData.code ?? 0,
            executionTimeMs,
        }
        setCachedResult(code, input, successResult)
        return successResult

    } catch (error) {
        console.error('[COMPILER] Unexpected error during Piston API execution:', error)
        return {
            success: false,
            errors: `Internal compiler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            executionTimeMs: Date.now() - startTime,
        }
    }
}
