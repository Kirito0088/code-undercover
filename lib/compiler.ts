import { explainFirstDiagnostic } from './compilerExplanation'
import { CompilerDiagnostic } from '@/types'

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

// ─── Wandbox API Configuration ──────────────────────────────────────────────
const WANDBOX_API_URL = "https://wandbox.org/api/compile.json";
const WANDBOX_COMPILER = "gcc-13.2.0-c";   // GCC 13, C language
const VIRTUAL_FILE_NAME = "solution.c";     // What we show to the user
const WANDBOX_FILE_NAME = "prog.c";         // What Wandbox uses internally

// ─── Compile Cache (avoids redundant Wandbox calls) ─────────────────────────
const CACHE_MAX_SIZE = 50;
const compileCache = new Map<string, { result: CompileExecutionResult; timestamp: number }>();

function getCacheKey(code: string, input: string): string {
    // Simple hash: use code length + first/last chars + input to create a key.
    // For exact matching we use the full content as key.
    return `${code}\0${input}`;
}

function getCachedResult(code: string, input: string): CompileExecutionResult | null {
    const key = getCacheKey(code, input);
    const entry = compileCache.get(key);
    if (!entry) return null;
    // Cache entries expire after 5 minutes
    if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
        compileCache.delete(key);
        return null;
    }
    return entry.result;
}

function setCachedResult(code: string, input: string, result: CompileExecutionResult): void {
    const key = getCacheKey(code, input);
    // Evict oldest entries if cache is full
    if (compileCache.size >= CACHE_MAX_SIZE) {
        const firstKey = compileCache.keys().next().value;
        if (firstKey !== undefined) compileCache.delete(firstKey);
    }
    compileCache.set(key, { result, timestamp: Date.now() });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sanitize Wandbox output: replace internal filenames with our virtual name
 * and filter out noisy GCC lines.
 */
function sanitizeString(rawStr: string): string {
    if (!rawStr) return "";

    // Replace Wandbox's internal filename with our user-friendly one
    let sanitized = rawStr.split(WANDBOX_FILE_NAME).join(VIRTUAL_FILE_NAME);

    // ── Filter noisy GCC lines that confuse beginners ──────────────────
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
        /^\/opt\/wandbox/i,
    ];
    const lines = sanitized.split('\n');
    const filtered = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true; // keep blank lines for context
        return !NOISE_PATTERNS.some(pat => pat.test(trimmed));
    });
    sanitized = filtered.join('\n');

    return sanitized;
}

/**
 * Parse GCC diagnostic messages from sanitized stderr.
 */
function parseGccDiagnostics(sanitizedStderr: string): CompilerDiagnostic[] {
    const diagnostics: CompilerDiagnostic[] = [];
    const lines = sanitizedStderr.split('\n');

    const diagnosticRegex = new RegExp(`^${VIRTUAL_FILE_NAME}:(\\d+):(\\d+):\\s*(error|warning|note|fatal error):\\s*(.+)$`);

    let currentDiag: CompilerDiagnostic | null = null;
    let contextLines: string[] = [];

    for (const line of lines) {
        const match = line.match(diagnosticRegex);
        if (match) {
            // Save the previous diagnostic
            if (currentDiag) {
                currentDiag.rawContext = contextLines.join('\n').trim();
                diagnostics.push(currentDiag);
            }
            // Start a new one
            currentDiag = {
                line: parseInt(match[1], 10),
                column: parseInt(match[2], 10),
                type: (match[3] === 'fatal error' ? 'error' : match[3]) as "error" | "warning" | "note",
                message: match[4].trim(),
                rawContext: ""
            };
            contextLines = [];
        } else if (currentDiag && line.trim() !== '') {
            // Accumulate context lines (like the code snippet and the ^ pointer)
            contextLines.push(line);
        }
    }

    // Push the final diagnostic
    if (currentDiag) {
        currentDiag.rawContext = contextLines.join('\n').trim();
        diagnostics.push(currentDiag);
    }

    return diagnostics;
}

// ─── Wandbox API Response ───────────────────────────────────────────────────
interface WandboxResponse {
    status?: string           // exit code as string, e.g. "0"
    signal?: string           // signal name if killed, e.g. "Killed"
    compiler_output?: string  // compiler stdout (rarely used)
    compiler_error?: string   // compiler stderr (warnings/errors)
    compiler_message?: string // combined compiler output
    program_output?: string   // program stdout
    program_error?: string    // program stderr (runtime errors)
    program_message?: string  // combined program output
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

export async function executeCode(code: string, input: string = ""): Promise<CompileExecutionResult> {
    // ── Check cache first (instant return for repeated submissions) ──
    const cached = getCachedResult(code, input);
    if (cached) {
        console.log("[COMPILER] Cache hit — returning cached result");
        return { ...cached, executionTimeMs: 0 };
    }

    const startTime = Date.now();

    try {
        // Build the request payload for Wandbox
        const payloadStr = JSON.stringify({
            compiler: WANDBOX_COMPILER,
            code: code,
            stdin: input,
            options: "warning",              // Enable -Wall -Wextra
            "compiler-option-raw": "-O2",    // Optimization level
        });

        // Fetch with timeout (10s — student programs compile fast)
        const doFetch = async (): Promise<Response> => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            try {
                const res = await fetch(WANDBOX_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Connection": "keep-alive",
                    },
                    body: payloadStr,
                    signal: controller.signal,
                });
                return res;
            } finally {
                clearTimeout(timeoutId);
            }
        };

        let response: Response;
        try {
            response = await doFetch();
        } catch {
            // Retry once on network/timeout failure
            console.warn("[COMPILER] First Wandbox call failed, retrying...");
            response = await doFetch();
        }

        const executionTimeMs = Date.now() - startTime;

        if (!response.ok) {
            return {
                success: false,
                errors: `Compiler service returned status ${response.status}. Please try again in a moment.`,
                executionTimeMs,
            };
        }

        const result: WandboxResponse = await response.json();

        // ── Handle Compilation Errors ───────────────────────────────────
        const compilerStderr = result.compiler_error || "";
        const sanitizedCompilerError = sanitizeString(compilerStderr);

        // Check if compilation failed: compiler_error contains actual GCC error
        // patterns AND there is no program_output (program never ran).
        // Wandbox always sets `status` even on compile failure, so we can't
        // rely on status being undefined.
        const hasGccErrors = /\b(error|fatal error):/i.test(sanitizedCompilerError);
        const programNeverRan = !result.program_output && !result.program_error;
        const hasCompileErrors = sanitizedCompilerError.length > 0
            && (hasGccErrors || programNeverRan);

        if (hasCompileErrors) {
            const diagnostics = parseGccDiagnostics(sanitizedCompilerError);
            const explanationText = explainFirstDiagnostic(diagnostics)
                ?? "There is a compilation error. Read the output above for details.";

            const compileErrorResult: CompileExecutionResult = {
                success: false,
                compilerError: sanitizedCompilerError,
                diagnostics,
                explanation: explanationText,
                executionTimeMs,
            };
            setCachedResult(code, input, compileErrorResult);
            return compileErrorResult;
        }

        // ── Handle Runtime Results ──────────────────────────────────────
        const programOutput = sanitizeString(result.program_output || "");
        const programError = sanitizeString(result.program_error || "");
        const exitCode = result.status !== undefined ? parseInt(result.status, 10) : null;

        // Check for timeout / signal kill
        if (result.signal) {
            return {
                success: false,
                output: programOutput,
                errors: result.signal === "Killed"
                    ? "Execution Timeout: Your program took too long to finish. (Potential infinite loop)"
                    : `Runtime Error: Program terminated by signal ${result.signal}`,
                exitCode,
                executionTimeMs,
            };
        }

        // Check for non-zero exit code (runtime error / crash)
        if (exitCode !== null && exitCode !== 0) {
            return {
                success: false,
                output: programOutput,
                errors: programError || `Program exited with code ${exitCode}`,
                exitCode,
                executionTimeMs,
            };
        }

        // ── Success ───────────────────────────────────────────────────
        const successResult: CompileExecutionResult = {
            success: true,
            output: programOutput,
            // Pass along any compiler warnings (they don't prevent execution)
            compilerError: sanitizedCompilerError || undefined,
            diagnostics: sanitizedCompilerError ? parseGccDiagnostics(sanitizedCompilerError) : undefined,
            errors: programError || undefined,
            exitCode: exitCode ?? 0,
            executionTimeMs,
        };
        setCachedResult(code, input, successResult);
        return successResult;

    } catch (error) {
        const executionTimeMs = Date.now() - startTime;
        console.error("[COMPILER] Wandbox API call failed:", error);

        return {
            success: false,
            errors: `Compiler service is temporarily unavailable. Please try again. (${error instanceof Error ? error.message : 'Network error'})`,
            executionTimeMs,
        };
    }
}
