import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db, safeDbQuery } from "@/lib/db"
import { calculateAuraLevel } from "@/lib/aura"
import { dailyQuestions } from "@/src/data/missionsData"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const dbQuestions = await safeDbQuery(
            () => db.dailyQuestion.findMany(),
            [],
            "daily-challenge.GET"
        )

        let selectedQuestion: { id: string; question: string; options: string[] } | null = null

        if (dbQuestions.length > 0) {
            const randomQuestion = dbQuestions[Math.floor(Math.random() * dbQuestions.length)]
            let options: string[] = []
            try {
                options = typeof randomQuestion.options === "string" 
                    ? JSON.parse(randomQuestion.options) 
                    : randomQuestion.options
            } catch (e) {
                console.error("Failed to parse daily question options", e)
            }

            if (options.length > 0) {
                selectedQuestion = {
                    id: randomQuestion.id,
                    question: randomQuestion.question,
                    options
                }
            }
        }

        // Fallback to static daily questions if DB is empty or offline
        if (!selectedQuestion && dailyQuestions.length > 0) {
            const fallbackQ = dailyQuestions[Math.floor(Math.random() * dailyQuestions.length)]
            selectedQuestion = {
                id: fallbackQ.id,
                question: fallbackQ.question,
                options: fallbackQ.options
            }
        }

        if (!selectedQuestion) {
            return NextResponse.json({ success: false, error: "No daily questions generated yet." })
        }

        return NextResponse.json({
            success: true,
            question: selectedQuestion
        })

    } catch (error) {
        console.error("Daily Challenge GET Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { questionId, answer } = await req.json()
        if (!questionId || !answer) {
            return NextResponse.json({ error: "Missing payload params" }, { status: 400 })
        }

        let questionData: { id: string; question: string; correctAnswer: string; explanation: string } | null = null

        // 1. Try DB safely
        const dbQuestion = await safeDbQuery(
            () => db.dailyQuestion.findUnique({ where: { id: questionId } }),
            null,
            "daily-challenge.POST"
        )

        if (dbQuestion) {
            questionData = {
                id: dbQuestion.id,
                question: dbQuestion.question,
                correctAnswer: dbQuestion.correctAnswer,
                explanation: dbQuestion.explanation
            }
        } else {
            // 2. Fallback to static questions
            const staticQ = dailyQuestions.find(q => q.id === questionId)
            if (staticQ) {
                questionData = {
                    id: staticQ.id,
                    question: staticQ.question,
                    correctAnswer: staticQ.correctAnswer,
                    explanation: staticQ.explanation
                }
            }
        }

        if (!questionData) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 })
        }

        const isCorrect = questionData.correctAnswer === answer
        let auraReward = 0

        if (isCorrect) {
            auraReward = 20
            const user = await safeDbQuery(
                () => db.user.findUnique({ where: { id: session.user.id } }),
                null,
                "daily-challenge.getUser"
            )

            if (user) {
                const newAuraPoints = user.auraPoints + auraReward
                const newAuraLevel = calculateAuraLevel(newAuraPoints)
                await safeDbQuery(
                    () => db.user.update({
                        where: { id: user.id },
                        data: {
                            auraPoints: newAuraPoints,
                            auraLevel: newAuraLevel
                        }
                    }),
                    null,
                    "daily-challenge.updateUser"
                )
            }
        }

        return NextResponse.json({
            success: true,
            isCorrect,
            explanation: questionData.explanation,
            correctAnswer: questionData.correctAnswer,
            earnedAura: auraReward
        })

    } catch (error) {
        console.error("Daily Challenge POST Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

