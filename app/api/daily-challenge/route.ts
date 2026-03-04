import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { calculateAuraLevel } from "@/lib/aura"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch all questions
        const allQuestions = await db.dailyQuestion.findMany()
        if (allQuestions.length === 0) {
            return NextResponse.json({ success: false, error: "No daily questions generated yet." })
        }

        // Pick one at random
        const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)]

        return NextResponse.json({
            success: true,
            question: {
                id: randomQuestion.id,
                question: randomQuestion.question,
                options: JSON.parse(randomQuestion.options)
            }
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

        const question = await db.dailyQuestion.findUnique({ where: { id: questionId } })
        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 })
        }

        const isCorrect = question.correctAnswer === answer
        let auraReward = 0

        if (isCorrect) {
            auraReward = 20
            const user = await db.user.findUnique({ where: { id: session.user.id } })

            if (user) {
                const newAuraPoints = user.auraPoints + auraReward
                const newAuraLevel = calculateAuraLevel(newAuraPoints)
                await db.user.update({
                    where: { id: user.id },
                    data: {
                        auraPoints: newAuraPoints,
                        auraLevel: newAuraLevel
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            isCorrect,
            explanation: question.explanation,
            correctAnswer: question.correctAnswer,
            earnedAura: auraReward
        })

    } catch (error) {
        console.error("Daily Challenge POST Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
