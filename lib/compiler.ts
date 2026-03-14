import { explainCompilerError } from './compilerExplanation'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { execFile, spawn } from 'child_process'
import crypto from 'crypto'

export interface CompileExecutionResult {
    success: boolean
    output?: string
    compilerError?: string
    errors?: string
    explanation?: string
    exitCode?: number | null
}

const EXECUTION_TIMEOUT_MS = 2000; // 5 seconds max

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

                if (isTimeout || signal === 'SIGKILL' || signal === 'SIGXCPU') {
                    resolve({
                        success: false,
                        output: outputRaw.trim(),
                        errors: "Execution Timeout: Your program took too long to finish. (Potential infinite loop)"
                    });
                    return;
                }

                if (signal) {
                    resolve({
                        success: false,
                        output: outputRaw.trim(),
                        errors: errorRaw.trim() || `Runtime Error: Program terminated by signal ${signal}`,
                        exitCode: code
                    });
                    return;
                }

                if (code !== 0) {
                    resolve({
                        success: false,
                        output: outputRaw.trim(),
                        errors: errorRaw.trim() || `Program exited with code ${code}`,
                        exitCode: code
                    });
                    return;
                }

                // Success
                resolve({
                    success: true,
                    output: outputRaw.trim(),
                    errors: errorRaw.trim() || "",
                    exitCode: 0
                });
            });

            child.on('error', (err) => {
                clearTimeout(timeoutId);
                resolve({
                    success: false,
                    errors: `Execution Failed: ${err.message}`
                });
            });
        });

        return result;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error?.type === 'compile_error') {
            const compilerOutput = error.stderr.trim();
            return {
                success: false,
                compilerError: compilerOutput,
                explanation: explainCompilerError(compilerOutput)
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
