import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { explainCompilerError } from './compilerExplanation'

export interface CompileExecutionResult {
    success: boolean
    output?: string
    compilerError?: string
    errors?: string
    explanation?: string
    exitCode?: number | null
}

export async function executeCode(code: string, input: string = ""): Promise<CompileExecutionResult> {
    const tempPrefix = path.join(os.tmpdir(), "code-undercover-")
    const tempDir = await fs.mkdtemp(tempPrefix)

    try {
        const sourceFile = path.join(tempDir, "program.c")
        const exeFile = path.join(tempDir, process.platform === 'win32' ? "program.exe" : "program")
        await fs.writeFile(sourceFile, code)

        // Compile using spawn (NOT exec with a string) so paths are handled correctly on all platforms
        const compileResult = await new Promise<{ success: boolean; stderr: string }>((resolve) => {
            const compiler = spawn("gcc", [sourceFile, "-o", exeFile], {
                timeout: 3000,
            })

            let compileStderr = ""

            compiler.stdout.on("data", () => {
                // gcc doesn't normally write to stdout during compilation, but capture just in case
            })

            compiler.stderr.on("data", (data: Buffer) => {
                compileStderr += data.toString()
            })

            compiler.on("error", (err) => {
                resolve({ success: false, stderr: err.message })
            })

            compiler.on("close", (code) => {
                resolve({ success: code === 0, stderr: compileStderr })
            })
        })

        if (!compileResult.success) {
            const stderr = compileResult.stderr || "Unknown compiler error"
            return {
                success: false,
                compilerError: stderr,
                explanation: explainCompilerError(stderr),
            }
        }

        return await new Promise((resolve) => {
            const child = spawn(exeFile, [], {
                stdio: ['pipe', 'pipe', 'pipe']
            })

            let stdoutData = ""
            let stderrData = ""
            let isFinished = false
            const maxOutputSize = 1024 * 1024 // 1MB 

            child.stdout.on('data', (data) => {
                stdoutData += data.toString()
                if (stdoutData.length > maxOutputSize) {
                    stdoutData = stdoutData.slice(0, maxOutputSize) + "\n...[OUTPUT TRUNCATED]"
                    child.kill('SIGKILL')
                }
            })

            child.stderr.on('data', (data) => {
                stderrData += data.toString()
            })

            child.on('error', (err) => {
                if (!isFinished) {
                    isFinished = true
                    resolve({
                        success: false,
                        errors: "Failed to execute program: " + err.message
                    })
                }
            })

            child.on('close', (code) => {
                if (!isFinished) {
                    isFinished = true
                    resolve({
                        success: true,
                        output: stdoutData.trim(),
                        errors: stderrData.trim(),
                        exitCode: code
                    })
                }
            })

            if (input) {
                child.stdin.write(input)
            }
            child.stdin.end()

            setTimeout(() => {
                if (!isFinished) {
                    isFinished = true
                    child.kill('SIGKILL')
                    resolve({
                        success: false,
                        errors: "Execution Timeout: Your program took too long to finish. (Potential infinite loop)"
                    })
                }
            }, 2000)
        })

    } finally {
        try {
            await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 })
        } catch (e) {
            console.error("Cleanup error in compiler.ts:", e)
        }
    }
}
