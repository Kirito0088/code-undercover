import { explainFirstDiagnostic } from './compilerExplanation'
import { CompilerDiagnostic } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum time (ms) allowed for the C compilation to finish */
const COMPILATION_TIMEOUT_MS = 4000

/** Maximum time (ms) allowed for the compiled binary to run */
const EXECUTION_TIMEOUT_MS = 3000

/** Memory ceiling (KB) for a single submission — mirrors judge0.conf's MEMORY_LIMIT */
const MEMORY_LIMIT_KB = 128000

/**
 * Fallback C (GCC) language id if JUDGE0_C_LANGUAGE_ID isn't set. 50 ("C (GCC
 * 9.2.0)") is confirmed present on the self-hosted judge0/judge0:latest image
 * — re-verify via GET {JUDGE0_API_URL}/languages/all if the image changes.
 */
const DEFAULT_JUDGE0_C_LANGUAGE_ID = 50

// ─── Judge0 status ids (github.com/judge0/judge0) ────────────────────────────

const STATUS_ACCEPTED = 3
const STATUS_TIME_LIMIT_EXCEEDED = 5
const STATUS_COMPILATION_ERROR = 6
const STATUS_INTERNAL_ERROR = 13
const STATUS_EXEC_FORMAT_ERROR = 14

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
// Avoids redundant Judge0 invocations for repeated identical submissions.

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
 * beginners (system include paths, linker cruft, etc.).
 */
function sanitizeString(raw: string): string {
    if (!raw) return ''

    const NOISE_PATTERNS = [
        /^In file included from/i,
        /^cc1(\.exe)?:/i,
        /^collect2/i,
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
 * Parse GCC diagnostic messages from sanitized compiler output into structured objects.
 */
function b64encode(text: string): string {
    return Buffer.from(text, 'utf-8').toString('base64')
}

function b64decode(encoded: string | null | undefined): string {
    if (!encoded) return ''
    return Buffer.from(encoded, 'base64').toString('utf-8')
}

function parseGccDiagnostics(sanitizedStderr: string): CompilerDiagnostic[] {
    const diagnostics: CompilerDiagnostic[] = []
    const lines = sanitizedStderr.split('\n')

    // Matches GCC's `<file>:<line>:<col>: error|warning|note: <message>` format.
    // Filename-agnostic on purpose — different backends/language boxes compile
    // the submitted source under different internal filenames (e.g. Judge0's
    // C box compiles as `main.c`, not a name we control).
    const diagnosticRegex = /^\S+:(\d+):(\d+):\s*(error|warning|note|fatal error):\s*(.+)$/

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
        const apiUrl = process.env.JUDGE0_API_URL || 'http://judge0-server:2358'
        const languageId = Number(process.env.JUDGE0_C_LANGUAGE_ID) || DEFAULT_JUDGE0_C_LANGUAGE_ID

        const cpuTimeLimitSec = EXECUTION_TIMEOUT_MS / 1000
        const wallTimeLimitSec = (COMPILATION_TIMEOUT_MS + EXECUTION_TIMEOUT_MS) / 1000

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), wallTimeLimitSec * 1000 + 5000)

        let judge0Response;
        try {
            const response = await fetch(`${apiUrl}/submissions?base64_encoded=true&wait=true`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_code: b64encode(code),
                    language_id: languageId,
                    stdin: b64encode(input),
                    cpu_time_limit: cpuTimeLimitSec,
                    wall_time_limit: wallTimeLimitSec,
                    memory_limit: MEMORY_LIMIT_KB,
                    // Judge0's default (shared, cgroup-based) limiting needs cgroup v1
                    // paths (isolate --cg); many Docker hosts only expose cgroup v2,
                    // where that mode fails outright. Per-process limiting avoids
                    // cgroups entirely and works on both — verified against this
                    // instance, where --cg failed with "No such file or directory".
                    enable_per_process_and_thread_time_limit: true,
                    enable_per_process_and_thread_memory_limit: true,
                }),
                signal: controller.signal,
            })

            if (!response.ok) {
                const errText = await response.text()
                throw new Error(`Judge0 API returned status ${response.status}: ${errText}`)
            }

            judge0Response = await response.json()
        } finally {
            clearTimeout(timeoutId)
        }

        if (!judge0Response || typeof judge0Response !== 'object') {
            throw new Error('Invalid response from Judge0 API')
        }

        const statusId: number = judge0Response.status?.id
        const executionTimeMs = Date.now() - startTime

        // ── Compilation error ────────────────────────────────────────────
        if (statusId === STATUS_COMPILATION_ERROR) {
            const sanitizedCompilerError = sanitizeString(b64decode(judge0Response.compile_output))
            const diagnostics = parseGccDiagnostics(sanitizedCompilerError)
            const explanationText =
                explainFirstDiagnostic(diagnostics) ??
                'There is a compilation error. Read the output above for details.'

            const compileErrorResult: CompileExecutionResult = {
                success: false,
                compilerError: sanitizedCompilerError || 'Compilation failed',
                diagnostics,
                explanation: explanationText,
                executionTimeMs,
            }
            setCachedResult(code, input, compileErrorResult)
            return compileErrorResult
        }

        // ── Timeout ───────────────────────────────────────────────────────
        if (statusId === STATUS_TIME_LIMIT_EXCEEDED) {
            return {
                success: false,
                output: sanitizeString(b64decode(judge0Response.stdout)) || undefined,
                errors: `Execution Timeout: Your program took longer than ${cpuTimeLimitSec}s to finish. Check for infinite loops or excessive computation.`,
                exitCode: null,
                executionTimeMs,
            }
        }

        // ── Internal / exec-format errors ──────────────────────────────────
        if (statusId === STATUS_INTERNAL_ERROR || statusId === STATUS_EXEC_FORMAT_ERROR) {
            return {
                success: false,
                errors: `Internal compiler error: ${b64decode(judge0Response.message) || judge0Response.status?.description || 'Unknown error'}`,
                executionTimeMs,
            }
        }

        // ── Runtime error (signals, non-zero exit) ─────────────────────────
        if (statusId !== STATUS_ACCEPTED) {
            const programOutput = sanitizeString(b64decode(judge0Response.stdout))
            const programError = sanitizeString(b64decode(judge0Response.stderr))
            return {
                success: false,
                output: programOutput || undefined,
                errors: programError || judge0Response.status?.description || `Program exited abnormally (status ${statusId})`,
                exitCode: judge0Response.exit_code ?? null,
                executionTimeMs,
            }
        }

        // ── Collect any compiler warnings that didn't block execution ─────
        const programOutput = sanitizeString(b64decode(judge0Response.stdout))
        const programError = sanitizeString(b64decode(judge0Response.stderr))
        const sanitizedWarnings = judge0Response.compile_output
            ? sanitizeString(b64decode(judge0Response.compile_output)) || undefined
            : undefined
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
            exitCode: judge0Response.exit_code ?? 0,
            executionTimeMs,
        }
        setCachedResult(code, input, successResult)
        return successResult

    } catch (error) {
        console.error('[COMPILER] Unexpected error during Judge0 API execution:', error)
        return {
            success: false,
            errors: `Internal compiler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            executionTimeMs: Date.now() - startTime,
        }
    }
}
