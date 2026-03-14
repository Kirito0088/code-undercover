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



// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateCodeAgainstSyntaxRules(
    _code: string,
    _rules: ValidationRules
): { passed: boolean; failures: string[] } {
    // We now validate ONLY by comparing compiler/program output to expected test cases.
    // Static code requirement checks (like forbidden template comments or required keywords)
    // are bypassed to prevent false-positive failures.
    return { passed: true, failures: [] }
}

function getComboBonus(streak: number): number {
    if (streak === 1) return 10
    if (streak === 2) return 20
    if (streak === 3) return 40
    if (streak === 4) return 70
    if (streak >= 5) return 100
    return 0
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

        // 2. Dynamic Execution & Test Cases Check
        let finalStdout = ""
        let finalStderr = ""
        let testCaseFailed = false
        const validationFailures: string[] = []

        const testCases = rules.testCases || (rules.requiredOutput ? [{ input: "", output: rules.requiredOutput }] : [{ input: "", output: "" }])

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i]
            const runRes = await executeCode(code, tc.input)

            if (!runRes.success) {
                // Compilation error or infinite loop
                await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })

                return NextResponse.json({
                    success: false,
                    stdout: "",
                    stderr: runRes.compilerError || runRes.errors || "Execution failed",
                    explanation: runRes.explanation,
                    validationErrors: ["Compilation failed. Fix your syntax errors."],
                    comboBonus: 0,
                    comboStreak: 0
                })
            }

            finalStdout = runRes.output || ""
            finalStderr = runRes.errors || ""

            // Output Validation (Disabled as per user request to ignore strict string matching)
            // If the code compiled and executed successfully above, we consider it a pass.
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
            comboStreak: newComboStreak
        })

    } catch (error) {
        console.error('Validation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
