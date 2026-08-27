import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { executeCode } from '@/lib/compiler'
import { detectInnovation, validateMissionOutput } from '@/lib/validation/missionValidator'
import { canAccessMission } from '@/services/mission.service'
import { staleSessionResponse } from '@/lib/session'
import { missionValidateLimiter } from '@/lib/rate-limit'
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


export async function POST(req: Request) {
    try {
        // Parse request body and authenticate in parallel
        const [session, body] = await Promise.all([
            getServerSession(authOptions),
            req.json(),
        ])

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rate = await missionValidateLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many attempts. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        const { missionId, code, input = "" } = body
        if (!missionId || typeof missionId !== 'string' || !code || typeof code !== 'string' || code.length > 10000) {
            return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
        }
        if (typeof input !== 'string' || input.length > 5000) {
            return NextResponse.json({ error: 'Input exceeds length limits' }, { status: 400 })
        }

        // 🔒 Access check — must happen before any DB writes or validation logic
        const hasAccess = await canAccessMission(session.user.id, missionId)
        if (!hasAccess) {
            return NextResponse.json({ error: 'You do not have access to this mission' }, { status: 403 })
        }

        // Mission and user first — the UserMission upsert below is keyed on both,
        // so running it alongside them (as this once did) let it trip its foreign
        // key before the guard could answer, turning a missing account into a 500.
        const [mission, user] = await Promise.all([
            db.mission.findUnique({ where: { id: missionId } }),
            db.user.findUnique({ where: { id: session.user.id } }),
        ])

        // A JWT outlives the row it names once an account is deleted or the
        // database is reseeded. That is a stale session, not a missing mission.
        if (!user) {
            return staleSessionResponse()
        }

        if (!mission) {
            return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
        }

        const userMission = await db.userMission.upsert({
            where: { userId_missionId: { userId: user.id, missionId } },
            update: {},
            create: {
                userId: user.id,
                missionId,
                status: 'ACTIVE',
                startedAt: new Date(),
            }
        })

        const isFirstTimeCompletion = userMission.status !== 'COMPLETED'

        // Fire-and-forget: increment attempt count (non-blocking)
        db.userMission.update({
            where: { id: userMission.id },
            data: { attemptCount: userMission.attemptCount + 1 }
        }).catch(e => console.error('[VALIDATE] attemptCount update failed:', e))

        const rules: ValidationRules = mission.validationRules
            ? JSON.parse(mission.validationRules)
            : {}

        let newComboStreak = user.comboStreak
        let comboBonusAura = 0

        // 1. Static Validation
        const syntaxCheck = validateCodeAgainstSyntaxRules(code, rules)

        if (!syntaxCheck.passed) {
            if (isFirstTimeCompletion) {
                // Combo Breaks
                await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
            }
            return NextResponse.json({
                success: false,
                stdout: "",
                stderr: "",
                validationErrors: syntaxCheck.failures,
                ruleDescription: rules.description,
                comboBonus: 0,
                comboStreak: isFirstTimeCompletion ? 0 : user.comboStreak
            })
        }

        // 2. Compile & Run — syntax check only, no output matching
        const runRes = await executeCode(code, input)
        const totalExecutionTimeMs = runRes.executionTimeMs || 0
        const finalStdout = runRes.output || ""

        if (!runRes.success) {
            // Compilation error, runtime crash, or compiler service issue
            const errorDetail = runRes.compilerError || runRes.errors || "Execution failed"

            // A judge outage is not the agent's fault. Report it as its own
            // state and leave the combo streak alone — breaking a streak over
            // an infrastructure failure punishes the wrong person.
            if (runRes.serviceUnavailable) {
                return NextResponse.json({
                    success: false,
                    serviceUnavailable: true,
                    stdout: "",
                    stderr: "",
                    validationErrors: [],
                    explanation: runRes.errors,
                    comboBonus: 0,
                    comboStreak: user.comboStreak
                })
            }

            if (isFirstTimeCompletion) {
                await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
            }

            const validationMsg = runRes.compilerError
                ? "Compilation failed. Fix your syntax errors."
                : runRes.errors || "Execution failed."

            return NextResponse.json({
                success: false,
                stdout: "",
                stderr: errorDetail,
                diagnostics: runRes.diagnostics,
                explanation: runRes.explanation,
                validationErrors: [validationMsg],
                comboBonus: 0,
                comboStreak: isFirstTimeCompletion ? 0 : user.comboStreak
            })
        }

        // Warnings that did not block the build. The compiler collects these,
        // but until now nothing forwarded them, so an agent whose program ran
        // never learned it had e.g. an uninitialised variable.
        const compilerWarnings = (runRes.diagnostics ?? []).filter(d => d.type !== 'error')

        // 3. Strict Output Validation against secure backend data
        const validationResult = validateMissionOutput(mission.order, input, finalStdout)

        if (!validationResult.isCorrect) {
            // Combo breaks on incorrect output
            if (isFirstTimeCompletion) {
                await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
            }

            return NextResponse.json({
                success: false,
                stdout: finalStdout,
                stderr: "",
                warnings: compilerWarnings,
                validationErrors: [validationResult.feedbackMessage || "Output validation failed. Please check your implementation."],
                comboBonus: 0,
                comboStreak: isFirstTimeCompletion ? 0 : user.comboStreak
            })
        }

        // Code compiled, executed, and output validated successfully — mission passes!

        // 3. Success! Calculate Rewards and Combos
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

        if (!userMission.innovationUnlocked) {
            const innovationResult = detectInnovation(code, mission.title)
            if (innovationResult.innovationUnlocked) {
                isInnovation = true
                innovationReason = innovationResult.innovationReason
            }
        }

        // Compute potential rewards as if it were a first-time completion
        const potentialRewards = {
            baseAura: mission.auraReward || AURA_MISSION_COMPLETE,
            executionAura: AURA_CORRECT_EXECUTION,
            firstAttemptBonus: userMission.attemptCount === 0 ? AURA_FIRST_ATTEMPT : 0,
            innovationAura: isInnovation ? AURA_FOX_INNOVATION : 0,
        }

        // Compute actual earned rewards gated by isFirstTimeCompletion
        const computedRewards = {
            baseAura: isFirstTimeCompletion ? potentialRewards.baseAura : 0,
            executionAura: isFirstTimeCompletion ? potentialRewards.executionAura : 0,
            firstAttemptBonus: isFirstTimeCompletion ? potentialRewards.firstAttemptBonus : 0,
            innovationAura: isFirstTimeCompletion ? potentialRewards.innovationAura : 0,
            foxBadgeIncrement: isInnovation ? 1 : 0,
        }

        let earnedAura =
            computedRewards.baseAura +
            computedRewards.executionAura +
            computedRewards.firstAttemptBonus +
            computedRewards.innovationAura

        if (isFirstTimeCompletion) {
            const hintPenalty = userMission.hintsUsed * AURA_HINT_PENALTY
            earnedAura = Math.max(10, earnedAura - hintPenalty)
        } else {
            earnedAura = 0
        }

        // 4. Database Updates in a Transaction
        await db.$transaction(async (tx) => {
            if (earnedAura > 0 || isInnovation || isFirstTimeCompletion || newComboStreak !== user.comboStreak) {
                const newAuraPoints = user.auraPoints + earnedAura
                const newAuraLevel = calculateAuraLevel(newAuraPoints)
                const newMaxCombo = Math.max(user.maxCombo, newComboStreak)

                await tx.user.update({
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

            await tx.userMission.update({
                where: { id: userMission.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    submittedCode: code,
                    innovationUnlocked: isInnovation ? true : undefined
                }
            })
        })

        // Calculate potential total would-have-earned aura for UI context
        const wouldHaveEarnedAura = isFirstTimeCompletion
            ? undefined
            : Math.max(10,
                potentialRewards.baseAura +
                potentialRewards.executionAura +
                potentialRewards.firstAttemptBonus +
                potentialRewards.innovationAura -
                (userMission.hintsUsed * AURA_HINT_PENALTY)
              )

        return NextResponse.json({
            success: true,
            stdout: finalStdout,
            stderr: "",
            warnings: compilerWarnings,
            validationErrors: [],
            earnedAura,
            innovationUnlocked: isInnovation,
            innovationReason,
            comboBonus: comboBonusAura,
            comboStreak: newComboStreak,
            executionTimeMs: totalExecutionTimeMs,
            isReplay: !isFirstTimeCompletion,
            wouldHaveEarnedAura
        })

    } catch (error) {
        console.error('Validation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
