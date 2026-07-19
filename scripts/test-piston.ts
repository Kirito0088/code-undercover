import { executeCode } from '../lib/compiler'

async function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`)
    }
}

// Simple mock for Piston API response mapping verification
function installMockFetch() {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any, options: any) => {
        const body = JSON.parse(options.body);
        const code = body.files[0].content;
        const stdin = body.stdin;

        if (code.includes('Missing semicolon')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    language: 'c',
                    version: '10.2.0',
                    compile: {
                        code: 1,
                        stdout: '',
                        stderr: 'solution.c:3:26: error: expected \';\' before \'return\''
                    },
                    run: null
                })
            } as any;
        }

        if (code.includes('return 42;')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    language: 'c',
                    version: '10.2.0',
                    compile: {
                        code: 0,
                        stdout: '',
                        stderr: ''
                    },
                    run: {
                        code: 42,
                        stdout: '',
                        stderr: 'Program exited with code 42',
                        signal: null
                    }
                })
            } as any;
        }

        if (code.includes('scanf')) {
            const val = parseInt(stdin.trim(), 10);
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    language: 'c',
                    version: '10.2.0',
                    compile: {
                        code: 0,
                        stdout: '',
                        stderr: ''
                    },
                    run: {
                        code: 0,
                        stdout: `Received: ${val * 2}`,
                        stderr: '',
                        signal: null
                    }
                })
            } as any;
        }

        // Default valid C program
        return {
            ok: true,
            status: 200,
            json: async () => ({
                language: 'c',
                version: '10.2.0',
                compile: {
                    code: 0,
                    stdout: '',
                    stderr: ''
                },
                run: {
                    code: 0,
                    stdout: 'Hello from Piston!',
                    stderr: '',
                    signal: null
                }
            })
        } as any;
    };
}

async function runTests() {
    console.log("=== Testing executeCode with Piston Sandbox API ===")

    // Check if the API is accessible
    const apiUrl = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';
    let useMock = false;
    try {
        const checkRes = await fetch(apiUrl, { method: 'POST', body: JSON.stringify({}) });
        if (checkRes.status === 401) {
            console.log("⚠️ Public Piston API is whitelist-only. Enabling Mock Piston response wrapper for mapper validation.");
            useMock = true;
        }
    } catch (err) {
        console.log("⚠️ Piston API unreachable. Enabling Mock Piston response wrapper for mapper validation.");
        useMock = true;
    }

    if (useMock) {
        installMockFetch();
    }

    // Test 1: Valid C Program
    console.log("\nTest 1: Running valid program...")
    const validResult = await executeCode(
        `#include <stdio.h>
int main() {
    printf("Hello from Piston!");
    return 0;
}`
    )
    console.log("Result:", JSON.stringify(validResult, null, 2))
    assert(validResult.success === true, "Valid program should succeed")
    assert(validResult.output?.trim() === "Hello from Piston!", "Output should match")
    assert(validResult.exitCode === 0, "Exit code should be 0")
    console.log("✅ Test 1 Passed!")

    // Test 2: Program with Stdin Input
    console.log("\nTest 2: Running program with stdin input...")
    const stdinResult = await executeCode(
        `#include <stdio.h>
int main() {
    int val;
    if (scanf("%d", &val) == 1) {
        printf("Received: %d", val * 2);
    }
    return 0;
}`,
        "21"
    )
    console.log("Result:", JSON.stringify(stdinResult, null, 2))
    assert(stdinResult.success === true, "Stdin program should succeed")
    assert(stdinResult.output?.trim() === "Received: 42", "Output should be 'Received: 42'")
    console.log("✅ Test 2 Passed!")

    // Test 3: Program with Compile Error
    console.log("\nTest 3: Running program with compile error...")
    const compileErrorResult = await executeCode(
        `#include <stdio.h>
int main() {
    printf("Missing semicolon")
    return 0;
}`
    )
    console.log("Result:", JSON.stringify(compileErrorResult, null, 2))
    assert(compileErrorResult.success === false, "Compile error program should fail")
    assert(compileErrorResult.compilerError !== undefined && compileErrorResult.compilerError.includes("error"), "Should return compiler error message")
    assert(Array.isArray(compileErrorResult.diagnostics), "Diagnostics should be an array")
    assert(compileErrorResult.diagnostics !== undefined && compileErrorResult.diagnostics.length > 0, "Diagnostics should not be empty")
    console.log("✅ Test 3 Passed!")

    // Test 4: Program with Runtime Crash
    console.log("\nTest 4: Running program with runtime crash (exit 42)...")
    const crashResult = await executeCode(
        `int main() {
    return 42;
}`
    )
    console.log("Result:", JSON.stringify(crashResult, null, 2))
    assert(crashResult.success === false, "Runtime crash program should fail")
    assert(crashResult.exitCode === 42, "Exit code should be 42")
    console.log("✅ Test 4 Passed!")

    console.log("\n🎉 All compiler mapper and execution tests passed successfully!")
}

runTests().catch(err => {
    console.error("\n❌ Test Suite Failed:", err)
    process.exit(1)
})
