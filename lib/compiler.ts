import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { explainFirstDiagnostic } from './compilerExplanation'
import { CompilerDiagnostic } from '@/types'

const execAsync = promisify(exec)

// ─── Constants ───────────────────────────────────────────────────────────────

/** Name shown to the user in diagnostic messages */
const VIRTUAL_FILE_NAME = 'solution.c'

/** Source file written inside each temp dir */
const SOURCE_FILE_NAME = 'prog.c'

/** Output binary name (platform-aware) */
const BINARY_NAME = process.platform === 'win32' ? 'prog.exe' : 'prog'

/** Compilation flags */
const GCC_FLAGS = '-Wall -Wextra -O2'

/** Maximum time (ms) allowed for the compiled binary to run */
const EXECUTION_TIMEOUT_MS = 3_000

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
 * Sanitize GCC output: replace the OS temp path and internal filename with
 * the user-friendly virtual name, and filter out noise lines that confuse
 * beginners (MinGW internals, system includes, linker cruft, etc.).
 */
function sanitizeString(raw: string, tmpDir: string): string {
    if (!raw) return ''

    // Replace the full temp-dir path prefix so users only see "solution.c"
    const s = raw
        .split(path.join(tmpDir, SOURCE_FILE_NAME)).join(VIRTUAL_FILE_NAME)
        .split(SOURCE_FILE_NAME).join(VIRTUAL_FILE_NAME)
        // Windows: also handle forward-slash variants GCC emits
        .split(tmpDir.replace(/\\/g, '/')).join('')

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

    const filtered = s.split('\n').filter(line => {
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

/**
 * Create a fresh isolated temporary directory for each compilation request.
 * Using a timestamp + random suffix guarantees no collision under concurrent load.
 */
async function createTempDir(): Promise<string> {
    const base = path.join(os.tmpdir(), `code-undercover-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await fs.mkdir(base, { recursive: true })
    return base
}

/**
 * Silently remove the temp directory and all its contents.
 * Called in `finally` — never throws, never leaks files.
 */
async function cleanupTempDir(tmpDir: string): Promise<void> {
    try {
        await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
        // Best-effort: log but don't surface cleanup failures to the caller
        console.warn(`[COMPILER] Failed to clean up temp dir: ${tmpDir}`)
    }
}

// ─── Spawn Helper ─────────────────────────────────────────────────────────────

interface SpawnResult {
    stdout: string
    stderr: string
    exitCode: number | null
    timedOut: boolean
}

/**
 * Execute a binary with optional stdin, a hard timeout, and capped output buffers.
 * Uses `spawn` (not `exec`) so we can pipe arbitrary input into stdin cleanly.
 */
function spawnWithInput(
    binaryPath: string,
    stdinData: string,
    timeoutMs: number
): Promise<SpawnResult> {
    return new Promise((resolve) => {
        const child = spawn(binaryPath, [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            // Windows: prevent a new console window from flashing open
            windowsHide: true,
        })

        let stdout = ''
        let stderr = ''
        let timedOut = false
        const MAX_BYTES = 10 * 1024 * 1024 // 10 MB safety cap

        child.stdout.on('data', (chunk: Buffer) => {
            if (stdout.length < MAX_BYTES) stdout += chunk.toString()
        })
        child.stderr.on('data', (chunk: Buffer) => {
            if (stderr.length < MAX_BYTES) stderr += chunk.toString()
        })

        const timer = setTimeout(() => {
            timedOut = true
            child.kill('SIGKILL')
        }, timeoutMs)

        child.on('close', (code) => {
            clearTimeout(timer)
            resolve({ stdout, stderr, exitCode: code, timedOut })
        })

        // Write all stdin then close so the child doesn't block waiting for EOF
        if (stdinData) child.stdin.write(stdinData)
        child.stdin.end()
    })
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
    const tmpDir = await createTempDir()

    try {
        const sourceFile = path.join(tmpDir, SOURCE_FILE_NAME)
        const binaryFile = path.join(tmpDir, BINARY_NAME)

        // ── Step 1: Write source to disk ─────────────────────────────────
        await fs.writeFile(sourceFile, code, 'utf-8')

        // ── Step 2: Compile ───────────────────────────────────────────────
        const gccCommand = `gcc "${sourceFile}" -o "${binaryFile}" ${GCC_FLAGS}`

        let compileStderr = ''
        try {
            await execAsync(gccCommand)
        } catch (compileError: unknown) {
            // GCC exits non-zero on any error/warning-as-error; capture stderr
            if (
                compileError &&
                typeof compileError === 'object' &&
                'stderr' in compileError
            ) {
                compileStderr = String((compileError as { stderr: string }).stderr)
            }
        }

        const sanitizedCompilerError = sanitizeString(compileStderr, tmpDir)
        const hasGccErrors = /\b(error|fatal error):/i.test(sanitizedCompilerError)

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
            // Compile errors are deterministic — safe to cache
            setCachedResult(code, input, compileErrorResult)
            return compileErrorResult
        }

        // ── Step 3: Execute the binary ────────────────────────────────────
        const { stdout, stderr: runStderr, exitCode, timedOut } =
            await spawnWithInput(binaryFile, input, EXECUTION_TIMEOUT_MS)

        const programOutput = sanitizeString(stdout, tmpDir)
        const programError = sanitizeString(runStderr, tmpDir)
        const executionTimeMs = Date.now() - startTime

        // ── Timeout ───────────────────────────────────────────────────────
        if (timedOut) {
            return {
                success: false,
                output: programOutput || undefined,
                errors: `Execution Timeout: Your program took longer than ${EXECUTION_TIMEOUT_MS / 1000}s to finish. Check for infinite loops or excessive computation.`,
                exitCode: null,
                executionTimeMs,
            }
        }

        // ── Runtime error (non-zero exit) ─────────────────────────────────
        if (exitCode !== null && exitCode !== 0) {
            return {
                success: false,
                output: programOutput || undefined,
                errors: programError || `Program exited with code ${exitCode}`,
                exitCode,
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
            exitCode: exitCode ?? 0,
            executionTimeMs,
        }
        setCachedResult(code, input, successResult)
        return successResult

    } catch (error) {
        console.error('[COMPILER] Unexpected error during local GCC execution:', error)
        return {
            success: false,
            errors: `Internal compiler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            executionTimeMs: Date.now() - startTime,
        }
    } finally {
        // ── Guaranteed cleanup — runs on success, failure, and timeout ────
        await cleanupTempDir(tmpDir)
    }
}
