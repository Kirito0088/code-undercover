import { explainFirstDiagnostic } from './compilerExplanation'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { execFile, spawn } from 'child_process'
import crypto from 'crypto'
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

const EXECUTION_TIMEOUT_MS = 2000; // 5 seconds max
const VIRTUAL_FILE_NAME = "solution.c";

function sanitizeString(rawStr: string, srcPath: string, tempDir: string): string {
    if (!rawStr) return "";
    let sanitized = rawStr.split(srcPath).join(VIRTUAL_FILE_NAME);
    // Escape backslashes for Regex
    const tempDirRegex = new RegExp(tempDir.replace(/\\/g, '\\\\') + '\\\\[a-zA-Z0-9\\-_]+(?:\\.exe)?', 'g');
    sanitized = sanitized.replace(tempDirRegex, "sandbox");
    
    // Also remove any remaining references to the exact exeName on windows
    const exeExtPattern = new RegExp(VIRTUAL_FILE_NAME.replace('.c', '.exe'), 'g');
    sanitized = sanitized.replace(exeExtPattern, "sandbox");

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

export async function executeCode(code: string, input: string = ""): Promise<CompileExecutionResult> {
    const id = crypto.randomUUID();
    const tempDir = os.tmpdir();
    const srcPath = path.join(tempDir, `${id}.c`);
    // On Windows, executables need .exe extension for easy spawn
    const isWindows = os.platform() === 'win32';
    const exeName = isWindows ? `${id}.exe` : id;
    const exePath = path.join(tempDir, exeName);

    try {
        // 1. Write the source code to a temp file
        await fs.writeFile(srcPath, code, 'utf8');

        // 2. Compile the source code using local GCC
        await new Promise<void>((resolve, reject) => {
            execFile('gcc', [srcPath, '-o', exePath, '-Wall', '-O2'], (error, stdout, stderr) => {
                if (error) {
                    // Compilation failed
                    reject({ type: 'compile_error', stderr: stderr || stdout || error.message });
                } else {
                    resolve();
                }
            });
        });

        // 3. Execute the compiled binary
        const result = await new Promise<CompileExecutionResult>((resolve) => {
            const startTime = Date.now();
            const child = spawn(exePath);
            let outputRaw = '';
            let errorRaw = '';
            let isTimeout = false;

            const timeoutId = setTimeout(() => {
                isTimeout = true;
                child.kill('SIGKILL');
            }, EXECUTION_TIMEOUT_MS);

            if (input) {
                child.stdin.write(input);
                child.stdin.end();
            }

            child.stdout.on('data', (data) => {
                outputRaw += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorRaw += data.toString();
            });

            child.on('close', (code, signal) => {
                clearTimeout(timeoutId);
                const executionTimeMs = Date.now() - startTime;

                // Sanitize runtime output to hide path
                const safeOutput = sanitizeString(outputRaw.trim(), srcPath, tempDir);
                const safeError = sanitizeString(errorRaw.trim(), srcPath, tempDir);

                if (isTimeout || signal === 'SIGKILL' || signal === 'SIGXCPU') {
                    resolve({
                        success: false,
                        output: safeOutput,
                        errors: "Execution Timeout: Your program took too long to finish. (Potential infinite loop)",
                        executionTimeMs
                    });
                    return;
                }

                if (signal) {
                    resolve({
                        success: false,
                        output: safeOutput,
                        errors: safeError || `Runtime Error: Program terminated by signal ${signal}`,
                        exitCode: code,
                        executionTimeMs
                    });
                    return;
                }

                if (code !== 0) {
                    resolve({
                        success: false,
                        output: safeOutput,
                        errors: safeError || `Program exited with code ${code}`,
                        exitCode: code,
                        executionTimeMs
                    });
                    return;
                }

                // Success
                resolve({
                    success: true,
                    output: safeOutput,
                    errors: safeError,
                    exitCode: 0,
                    executionTimeMs
                });
            });

            child.on('error', (err) => {
                clearTimeout(timeoutId);
                resolve({
                    success: false,
                    errors: `Execution Failed: ${sanitizeString(err.message, srcPath, tempDir)}`,
                    executionTimeMs: Date.now() - startTime
                });
            });
        });

        return result;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error?.type === 'compile_error') {
            const compilerOutputRaw = error.stderr.trim();
            const sanitizedOutput = sanitizeString(compilerOutputRaw, srcPath, tempDir);
            const diagnostics = parseGccDiagnostics(sanitizedOutput);

            // Use the first error diagnostic for a targeted Platypus explanation
            const explanationText = explainFirstDiagnostic(diagnostics)
                ?? "There is a compilation error. Read the output above for details.";

            return {
                success: false,
                compilerError: sanitizedOutput,
                diagnostics,
                explanation: explanationText
            };
        }

        console.error("[COMPILER] Failed to execute code locally:", error);
        return {
            success: false,
            errors: `System Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    } finally {
        // 4. Cleanup temp files
        try { await fs.unlink(srcPath); } catch { }
        try { await fs.unlink(exePath); } catch { }
    }
}
