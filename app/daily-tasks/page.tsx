import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { DailyTasksClient } from "@/components/daily-tasks/DailyTasksClient"
import { dailyQuestions } from "@/src/data/missionsData"
import type { DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"

async function getDailyChallengeQuestion(): Promise<DailyChallengeQuestion | null> {
    const now = Date.now()
    let question: DailyChallengeQuestion | null = null

    try {
        const count = await db.dailyQuestion.count()
        if (count > 0) {
            const index = Math.floor(now / 86400000) % count
            const dailyQuestion = await db.dailyQuestion.findFirst({
                skip: index,
                orderBy: { id: "asc" },
                select: { id: true, question: true, options: true },
            })

            if (dailyQuestion) {
                let options: unknown = []
                try {
                    options = JSON.parse(dailyQuestion.options)
                } catch (error) {
                    console.error("Failed to parse daily question options:", error)
                }

                if (Array.isArray(options) && options.every((opt) => typeof opt === "string")) {
                    question = {
                        id: dailyQuestion.id,
                        question: dailyQuestion.question,
                        options,
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch daily question from DB:", error)
    }

    if (!question && dailyQuestions.length > 0) {
        const index = Math.floor(now / 86400000) % dailyQuestions.length
        const fallbackQ = dailyQuestions[index]
        question = {
            id: fallbackQ.id,
            question: fallbackQ.question,
            options: fallbackQ.options,
        }
    }

    return question
}

export default async function DailyTasksPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [user, dailyQuestion] = await Promise.all([
        safeDbQuery(
            () => db.user.findUnique({
                where: { id: session.user.id },
                select: { auraPoints: true, auraLevel: true, name: true, email: true, comboStreak: true },
            }),
            null,
            "DailyTasksPage.user"
        ),
        safeDbQuery(
            () => getDailyChallengeQuestion(),
            null,
            "DailyTasksPage.dailyQuestion"
        )
    ])

    return (
        <DailyTasksClient
            initialQuestion={dailyQuestion}
            user={user}
        />
    )
}
