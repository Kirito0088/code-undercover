import { explainFirstDiagnostic, explainCompilerError, explainRuntimeFailure } from './compilerExplanation'
import { CompilerDiagnostic } from '@/types'
import { normalizeQuotes } from './errorClassifier'

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
    /**
     * The judge itself was unreachable or broken — nothing was compiled. Kept
     * separate from a code error so the UI never tells an agent to "fix the
     * issues above" when their submission was never even read.
     */
    serviceUnavailable?: boolean
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
export function sanitizeString(raw: string): string {
    if (!raw) return ''

    const NOISE_PATTERNS = [
        /^In file included from/i,
        /^cc1(\.exe)?:/i,
        /^collect2/i,
        /^\/usr\/include/i,
        /^\/usr\/lib/i,
        /^\/opt\//i,
        // The linker's location preamble ("... : in function `main':"). The
        // line after it carries the actual "undefined reference", so this one
        // contributes nothing but a scary-looking object-file path.
        /in function\s+['`][^']*':\s*$/i,
    ]

    const filtered = raw.split('\n')
        // Strip the linker's own binary path prefix without dropping the line.
        // "/usr/bin/ld: main.c:(.text+0x1a): undefined reference to `greet'" is
        // the single most useful line a beginner gets out of a link failure,
        // and the /^\/usr\/lib/ rule above never caught /usr/bin anyway.
        .map(line => line.replace(/^\s*\/\S*\/(ld|ld\.[a-z]+|collect2)(\.exe)?:\s*/i, ''))
        .filter(line => {
            // Normalise before matching: GCC writes ‘main’ under a UTF-8 locale,
            // which the ASCII-quoted noise patterns above would otherwise miss.
            const t = normalizeQuotes(line).trim()
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

/**
 * Strip the COMMON leading indentation from GCC's source-context block.
 *
 * GCC renders context as an aligned gutter:
 *
 *     5 |     printf("hi")
 *       |                ^
 *
 * A blanket .trim() removed the leading spaces of the first line only, sliding
 * it left relative to the caret line — so the ^ pointed at the wrong column,
 * which is the one thing the context block exists to show. Removing the same
 * amount from every line preserves the gutter and the caret position.
 */
function dedentContext(lines: string[]): string {
    if (lines.length === 0) return ''

    const indents = lines
        .filter(l => l.trim() !== '')
        .map(l => (l.match(/^[ \t]*/)?.[0].length ?? 0))
    const common = indents.length > 0 ? Math.min(...indents) : 0

    return lines
        .map(l => l.slice(common).replace(/\s+$/, ''))
        .join('\n')
        .replace(/\n+$/, '')
}

/**
 * Linker diagnostics carry no line:col, so they need their own pattern.
 * Quotes are normalised first — GCC uses ‘directed’ quotes under a UTF-8
 * locale while ld uses `backtick' style, and both reach this code path.
 */
const LINKER_REGEX = /undefined reference to\s+'([^']+)'/i

/** Exported for tests — the caret alignment and linker paths regress silently. */
export function parseGccDiagnostics(sanitizedStderr: string): CompilerDiagnostic[] {
    const diagnostics: CompilerDiagnostic[] = []
    const lines = sanitizedStderr.split('\n')

    // Matches GCC's `<file>:<line>:<col>: error|warning|note: <message>` format.
    // Filename-agnostic on purpose — different backends/language boxes compile
    // the submitted source under different internal filenames (e.g. Judge0's
    // C box compiles as `main.c`, not a name we control).
    const diagnosticRegex = /^\S+:(\d+):(\d+):\s*(error|warning|note|fatal error):\s*(.+)$/

    let currentDiag: CompilerDiagnostic | null = null
    let contextLines: string[] = []

    const flush = () => {
        if (currentDiag) {
            currentDiag.rawContext = dedentContext(contextLines)
            diagnostics.push(currentDiag)
        }
    }

    for (const line of lines) {
        const match = line.match(diagnosticRegex)
        if (match) {
            flush()
            currentDiag = {
                line: parseInt(match[1], 10),
                column: parseInt(match[2], 10),
                type: (match[3] === 'fatal error' ? 'error' : match[3]) as 'error' | 'warning' | 'note',
                message: match[4].trim(),
                rawContext: '',
            }
            contextLines = []
            continue
        }

        // Link failures ("undefined reference to `greet'") carry no line:col and
        // so never matched the regex above. They used to fall through as zero
        // diagnostics, leaving the agent with raw ld output and the generic
        // "read the output above" explanation — calling a function you never
        // defined is far too common a beginner mistake to leave unexplained.
        const linkerMatch = normalizeQuotes(line).match(LINKER_REGEX)
        if (linkerMatch) {
            flush()
            currentDiag = {
                line: 0,
                column: 0,
                type: 'error',
                message: `undefined reference to '${linkerMatch[1]}'`,
                rawContext: '',
            }
            contextLines = []
            continue
        }

        if (currentDiag && line.trim() !== '') {
            contextLines.push(line)
        }
    }

    flush()

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
            // With zero parsed diagnostics, classify the raw compiler text rather
            // than emitting a dead-end "read the output above" line — the
            // classifier still recognises preprocessor and link failures in it.
            const explanationText =
                explainFirstDiagnostic(diagnostics) ??
                (sanitizedCompilerError
                    ? explainCompilerError(sanitizedCompilerError)
                    : 'There is a compilation error. Read the output above for details.')

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
            const detail = b64decode(judge0Response.message) || judge0Response.status?.description || 'Unknown error'
            console.error('[COMPILER] Judge0 internal error (status %d): %s', statusId, detail)
            return {
                success: false,
                serviceUnavailable: true,
                errors: `The code-execution service failed while handling your submission (${detail}). This is a platform problem, not a mistake in your program.`,
                executionTimeMs,
            }
        }

        // ── Runtime error (signals, non-zero exit) ─────────────────────────
        if (statusId !== STATUS_ACCEPTED) {
            const programOutput = sanitizeString(b64decode(judge0Response.stdout))
            const programError = sanitizeString(b64decode(judge0Response.stderr))
            const statusDescription: string | undefined = judge0Response.status?.description
            return {
                success: false,
                output: programOutput || undefined,
                errors: programError || statusDescription || `Program exited abnormally (status ${statusId})`,
                explanation: explainRuntimeFailure(statusDescription, programError),
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
        // Network-level failures surface as an opaque "fetch failed" from undici.
        // Logging the cause is what turns an unactionable UI string into a
        // diagnosable one (ECONNREFUSED vs. DNS vs. timeout).
        const cause = (error as { cause?: { code?: string } })?.cause
        console.error(
            '[COMPILER] Judge0 unreachable at %s (%s)',
            process.env.JUDGE0_API_URL || 'http://judge0-server:2358',
            cause?.code ?? (error instanceof Error ? error.name : 'unknown'),
            error
        )
        return {
            success: false,
            serviceUnavailable: true,
            errors: 'The code-execution service is not responding, so your code was never compiled. This is a platform problem, not a mistake in your program.',
            executionTimeMs: Date.now() - startTime,
        }
    }
}
