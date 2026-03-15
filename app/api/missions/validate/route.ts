import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { executeCode } from '@/lib/compiler'
import { detectInnovation } from '@/lib/validation/missionValidator'
import {
    AURA_MISSION_COMPLETE,
    AURA_FIRST_ATTEMPT,
    AURA_FOX_INNOVATION,
    AURA_CORRECT_EXECUTION,
    AURA_HINT_PENALTY,
    calculateAuraLevel
} from '@/lib/aura'

interface ValidationRules {
    requiredKeywords?: string[]
    requiredPatterns?: string[]
    forbiddenPatterns?: string[]
    minLength?: number
    requireCustomFunction?: boolean
    description?: string
    testCases?: { input: string; output: string }[]
    requiredOutput?: string
}




function validateCodeAgainstSyntaxRules(
    code: string,
    rules: ValidationRules
): { passed: boolean; failures: string[] } {
    const failures: string[] = []

    // Minimum code length check — prevents trivially short / empty submissions
    if (rules.minLength && code.trim().length < rules.minLength) {
        failures.push(`Your code must be at least ${rules.minLength} characters long. Keep working!`)
    }

    return { passed: failures.length === 0, failures }
}


function getComboBonus(streak: number): number {
    if (streak === 1) return 10
    if (streak === 2) return 20
    if (streak === 3) return 40
    if (streak === 4) return 70
    if (streak >= 5) return 100
    return 0
}

// Normalize output for comparison: trim and use Unix newlines
function normalizeOutput(str: string): string {
    return str.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { missionId, code } = await req.json()
        if (!missionId || !code || typeof code !== 'string' || code.length > 10000) {
            return NextResponse.json({ error: 'Missing or invalid code' }, { status: 400 })
        }

        const mission = await db.mission.findUnique({ where: { id: missionId } })
        const userMission = await db.userMission.findUnique({
            where: { userId_missionId: { userId: session.user.id, missionId } }
        })
        const user = await db.user.findUnique({ where: { id: session.user.id } })

        if (!mission || !userMission || !user) {
            return NextResponse.json({ error: 'Entities not found' }, { status: 404 })
        }

        await db.userMission.update({
            where: { id: userMission.id },
            data: { attemptCount: userMission.attemptCount + 1 }
        })

        const rules: ValidationRules = mission.validationRules
            ? JSON.parse(mission.validationRules)
            : {}

        let newComboStreak = user.comboStreak
        let comboBonusAura = 0

        // 1. Static Validation
        const syntaxCheck = validateCodeAgainstSyntaxRules(code, rules)

        if (!syntaxCheck.passed) {
            // Combo Breaks
            await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
            return NextResponse.json({
                success: false,
                stdout: "",
                stderr: "",
                validationErrors: syntaxCheck.failures,
                ruleDescription: rules.description,
                comboBonus: 0,
                comboStreak: 0
            })
        }

        // 2. Dynamic Execution & Strict Test Case Validation
        let finalStdout = ""
        let finalStderr = ""
        let testCaseFailed = false
        let totalExecutionTimeMs = 0
        const validationFailures: string[] = []

        // Build test cases list from rules.
        // If no testCases and no requiredOutput → no output matching required (freeform mission)
        const hasExpectedOutput = !!(rules.testCases?.length || rules.requiredOutput)
        const testCases = rules.testCases
            || (rules.requiredOutput ? [{ input: "", output: rules.requiredOutput }] : [])

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i]
            const runRes = await executeCode(code, tc.input)

            if (runRes.executionTimeMs) {
                totalExecutionTimeMs += runRes.executionTimeMs
            }

            if (!runRes.success) {
                // Compilation error or runtime crash
                await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
                return NextResponse.json({
                    success: false,
                    stdout: "",
                    stderr: runRes.compilerError || runRes.errors || "Execution failed",
                    diagnostics: runRes.diagnostics,
                    explanation: runRes.explanation,
                    validationErrors: ["Compilation failed. Fix your syntax errors."],
                    comboBonus: 0,
                    comboStreak: 0
                })
            }

            finalStdout = runRes.output || ""
            finalStderr = runRes.errors || ""

            // ── Output Validation: ENABLED ──────────────────────────────────────
            // If the mission has expected output, the actual output MUST match.
            if (tc.output !== undefined && tc.output !== null) {
                const expectedNorm = normalizeOutput(tc.output)
                const actualNorm = normalizeOutput(finalStdout)

                if (expectedNorm !== "" && actualNorm !== expectedNorm) {
                    testCaseFailed = true
                    validationFailures.push(
                        `Test case ${i + 1}${tc.input ? ` (input: "${tc.input}")` : ''}: expected output "${tc.output}", but got "${finalStdout.trim() || "(empty)"}"`
                    )
                }
            }
        }

        // If no test cases / requiredOutput — still check if mission has no expected output logic
        // (fallback for freeform missions: pass as long as code compiles and runs)
        if (!hasExpectedOutput && testCases.length === 0) {
            // Freeform mission: any successful execution counts as a pass
            testCaseFailed = false
        }

        if (testCaseFailed) {
            // Combo Breaks
            await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
            return NextResponse.json({
                success: false,
                stdout: finalStdout,
                stderr: finalStderr,
                validationErrors: validationFailures,
                comboBonus: 0,
                comboStreak: 0
            })
        }

        // 3. Success! Calculate Rewards and Combos
        const isFirstTimeCompletion = userMission.status !== 'COMPLETED'
        const usedHints = userMission.hintsUsed > 0

        if (isFirstTimeCompletion) {
            if (usedHints) {
                newComboStreak = 0 // Combo breaks if a hint was ever used on this mission
            } else {
                newComboStreak += 1 // Flawless finish!
                comboBonusAura = getComboBonus(newComboStreak)
            }
        }

        let isInnovation = false
        let innovationReason = ""
        let earnedAura = comboBonusAura

        if (!userMission.innovationUnlocked) {
            const innovationResult = detectInnovation(code, mission.title)
            if (innovationResult.innovationUnlocked) {
                isInnovation = true
                innovationReason = innovationResult.innovationReason
                earnedAura += AURA_FOX_INNOVATION
            }
        }

        if (isFirstTimeCompletion) {
            earnedAura += mission.auraReward || AURA_MISSION_COMPLETE
            earnedAura += AURA_CORRECT_EXECUTION

            if (userMission.attemptCount === 0) {
                earnedAura += AURA_FIRST_ATTEMPT
            }
            const hintPenalty = userMission.hintsUsed * AURA_HINT_PENALTY
            earnedAura = Math.max(10, earnedAura - hintPenalty)
        }

        // 4. Database Updates
        if (earnedAura > 0 || isInnovation || isFirstTimeCompletion || newComboStreak !== user.comboStreak) {
            const newAuraPoints = user.auraPoints + earnedAura
            const newAuraLevel = calculateAuraLevel(newAuraPoints)
            const newMaxCombo = Math.max(user.maxCombo, newComboStreak)

            await db.user.update({
                where: { id: user.id },
                data: {
                    auraPoints: newAuraPoints,
                    auraLevel: newAuraLevel,
                    comboStreak: newComboStreak,
                    maxCombo: newMaxCombo,
                    foxBadges: isInnovation ? { increment: 1 } : undefined,
                    missionsCompleted: isFirstTimeCompletion ? { increment: 1 } : undefined
                }
            })
        }

        await db.userMission.update({
            where: { id: userMission.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                innovationUnlocked: isInnovation ? true : undefined
            }
        })

        return NextResponse.json({
            success: true,
            stdout: finalStdout,
            stderr: finalStderr,
            validationErrors: [],
            earnedAura,
            innovationUnlocked: isInnovation,
            innovationReason,
            comboBonus: comboBonusAura,
            comboStreak: newComboStreak,
            executionTimeMs: totalExecutionTimeMs
        })

    } catch (error) {
        console.error('Validation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
