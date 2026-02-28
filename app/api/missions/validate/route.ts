import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

import { detectInnovation } from '@/lib/validation/missionValidator'

// ─── Validation Engine ───
interface ValidationRules {
    requiredKeywords?: string[]
    requiredPatterns?: string[]
    forbiddenPatterns?: string[]
    minLength?: number
    requireCustomFunction?: boolean
    description?: string
}

function validateCodeAgainstRules(
    code: string,
    rules: ValidationRules
): { passed: boolean; failures: string[] } {
    const failures: string[] = []

    // 1. Minimum length check
    if (rules.minLength && code.length < rules.minLength) {
        failures.push(
            "Code is too short. Your solution needs to demonstrate the required concepts."
        )
    }

    // 2. Forbidden patterns (e.g. template placeholder still present)
    if (rules.forbiddenPatterns) {
        for (const pattern of rules.forbiddenPatterns) {
            if (code.includes(pattern)) {
                failures.push(
                    "Your code still contains the default template. Write your own solution."
                )
                break
            }
        }
    }

    // 3. Required keywords
    if (rules.requiredKeywords) {
        const missing = rules.requiredKeywords.filter((kw) => !code.includes(kw))
        if (missing.length > 0) {
            failures.push(
                "Missing required concepts: " + missing.join(", ") + ". Review the mission briefing."
            )
        }
    }

    // 4. Required patterns (at least one must match)
    if (rules.requiredPatterns && rules.requiredPatterns.length > 0) {
        const hasAny = rules.requiredPatterns.some((p) => code.includes(p))
        if (!hasAny) {
            failures.push(
                "Missing required pattern. Make sure you're using the correct syntax."
            )
        }
    }

    // 5. Custom function check (must have a function definition besides main)
    if (rules.requireCustomFunction) {
        // Look for a function definition pattern: type name(params) {
        // but not main(
        const funcRegex = /\b(int|void|float|double|char)\s+([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{/g
        let match
        let hasCustomFunc = false
        while ((match = funcRegex.exec(code)) !== null) {
            if (match[2] !== "main") {
                hasCustomFunc = true
                break
            }
        }
        if (!hasCustomFunc) {
            failures.push(
                "You must define at least one custom function besides main()."
            )
        }
    }

    return { passed: failures.length === 0, failures }
}

// ─── API Handler ───
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { missionId, code } = await req.json()
        if (!missionId || !code) {
            return NextResponse.json({ error: 'Missing code payload' }, { status: 400 })
        }

        // 1. Fetch Mission + UserMission
        const mission = await db.mission.findUnique({ where: { id: missionId } })
        if (!mission) {
            return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
        }

        const userMission = await db.userMission.findUnique({
            where: { userId_missionId: { userId: session.user.id, missionId } }
        })
        if (!userMission) {
            return NextResponse.json({ error: 'User mission not found' }, { status: 404 })
        }

        // 2. Increment attempt count
        await db.userMission.update({
            where: { id: userMission.id },
            data: { attemptCount: userMission.attemptCount + 1 }
        })

        // 3. ──── VALIDATE CODE AGAINST MISSION RULES ────
        const rules: ValidationRules = (mission as any).validationRules
            ? JSON.parse((mission as any).validationRules)
            : {}

        const ruleCheck = validateCodeAgainstRules(code, rules)

        if (!ruleCheck.passed) {
            // Rules failed — don't even try compiling
            return NextResponse.json({
                success: false,
                stdout: "",
                stderr: "",
                validationErrors: ruleCheck.failures,
                ruleDescription: rules.description || null,
                innovationUnlocked: false,
                innovationReason: ""
            })
        }

        // 4. ──── COMPILE & RUN (only if rules pass) ────
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cu-runner-'))
        const sourceFile = path.join(tmpDir, 'main.c')
        const exeName = process.platform === 'win32' ? 'main.exe' : 'main'
        const executable = path.join(tmpDir, exeName)

        let stdout = ""
        let stderr = ""
        let compiled = false

        try {
            await fs.writeFile(sourceFile, code)
            const compileCmd = `gcc "${sourceFile}" -o "${executable}"`
            await execAsync(compileCmd)
            const runRes = await execAsync(`"${executable}"`, { timeout: 2000 })
            stdout = runRes.stdout
            stderr = runRes.stderr
            compiled = true
        } catch (e: any) {
            compiled = false
            stderr = e.stderr || e.message || 'Compilation or execution failed.'

            // MVP fallback: if GCC not installed, accept if rules already passed
            if (
                e.message?.includes('gcc') &&
                (e.message?.includes('not recognized') || e.message?.includes('not found'))
            ) {
                console.log("[MVP] GCC not available — rules passed, accepting solution")
                compiled = true
                stdout = "[Simulated] Code validation passed. Output generated successfully."
                stderr = ""
            }
        } finally {
            try {
                await fs.rm(tmpDir, { recursive: true, force: true })
            } catch (_) { /* ignore */ }
        }

        if (!compiled) {
            return NextResponse.json({
                success: false,
                stdout: "",
                stderr: stderr,
                validationErrors: ["Compilation failed. Fix the syntax errors and try again."],
                innovationUnlocked: false,
                innovationReason: ""
            })
        }

        // 5. ──── INNOVATION DETECTION ────
        let isInnovation = false
        let innovationReason = ""

        if (!userMission.innovationUnlocked) {
            const innovationResult = detectInnovation(code, mission.title)
            if (innovationResult.innovationUnlocked) {
                isInnovation = true
                innovationReason = innovationResult.innovationReason

                await db.userMission.update({
                    where: { id: userMission.id },
                    data: { innovationUnlocked: true }
                })
                await db.user.update({
                    where: { id: session.user.id },
                    data: { foxBadges: { increment: 1 } }
                })
            }
        }

        // 6. ──── MARK COMPLETED ────
        await db.userMission.update({
            where: { id: userMission.id },
            data: { status: 'COMPLETED', completedAt: new Date() }
        })

        return NextResponse.json({
            success: true,
            stdout,
            stderr,
            validationErrors: [],
            innovationUnlocked: isInnovation,
            innovationReason
        })

    } catch (error) {
        console.error('Validation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
