import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

async function runExecutionEngineTest(name, code, expectedErrorMarker) {
    console.log(`\n▶ Running Test: ${name}`)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cu-test-'))
    const sourceFile = path.join(tmpDir, 'main.c')
    const exeName = process.platform === 'win32' ? 'main.exe' : 'main'
    const executable = path.join(tmpDir, exeName)

    let stdout = ""
    let stderr = ""

    try {
        await fs.writeFile(sourceFile, code)
        const compileCmd = `gcc "${sourceFile}" -o "${executable}"`
        await execAsync(compileCmd, { timeout: 5000, killSignal: 'SIGKILL' })

        const runRes = await execAsync(`"${executable}"`, {
            timeout: 2000,
            killSignal: 'SIGKILL',
            maxBuffer: 1024 * 1024 * 2
        })

        stdout = runRes.stdout.length > 10000 ? runRes.stdout.substring(0, 10000) + '...[OUTPUT TRUNCATED]' : runRes.stdout
        stderr = runRes.stderr.length > 10000 ? runRes.stderr.substring(0, 10000) + '...[ERROR TRUNCATED]' : runRes.stderr
        console.log("❌ Test Failed (Expected an error marker but got success)")
    } catch (e) {
        if (e.killed && e.signal === 'SIGKILL') {
            stderr = "Execution timed out (2000ms max). Infinite loop detected and process terminated."
        } else if (e.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' || e.message?.includes('maxBuffer')) {
            stderr = "Execution generated massive output buffer. Possible infinite print loop. Terminated."
        } else {
            stderr = e.stderr || e.message || 'Compilation or execution failed.'
        }

        if (stderr.includes(expectedErrorMarker)) {
            console.log(`✅ Test Passed! Caught expected marker: "${expectedErrorMarker}"`)
        } else {
            console.log(`❌ Test Failed! Expected "${expectedErrorMarker}", but got:\n${stderr}`)
        }
    } finally {
        try {
            await fs.rm(tmpDir, { recursive: true, force: true })
        } catch (_) { }
    }
}

async function runAllTests() {
    console.log("=== BEGINNING ENGINE AUDIT ===")

    // 1. Syntax Error Handling
    await runExecutionEngineTest(
        "Syntax Error Detection",
        `#include <stdio.h>\nint main() { printf("Missing semicolon") return 0; }`,
        "error: expected ';' before 'return'"
    )

    // 2. Infinite Loop Handling
    await runExecutionEngineTest(
        "Infinite Loop Hard-Kill",
        `#include <stdio.h>\nint main() { while(1) {} return 0; }`,
        "Execution timed out (2000ms max)"
    )

    // 3. Infinite Print Overflow
    await runExecutionEngineTest(
        "Massive Output Buffer Limit",
        `#include <stdio.h>\nint main() { while(1) { printf("AABBCCDDEE"); } return 0; }`,
        "Execution generated massive output buffer"
    )

    console.log("\n=== ENGINE AUDIT COMPLETE ===")
}

runAllTests()
