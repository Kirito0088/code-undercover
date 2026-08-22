import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { type DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"
import { DailyChallengeModal } from "@/components/dashboard/DailyChallengeModalLazy"
import { ClearanceScene } from "@/components/skill/ClearanceScene"
import { getClearanceProgress } from "@/lib/clearance"

import { dailyQuestions } from "@/src/data/missionsData"

const globalForDailyChallenge = globalThis as unknown as {
    dailyChallenge: { question: DailyChallengeQuestion | null; expiresAt: number } | undefined
}

async function getDailyChallengeQuestion(): Promise<DailyChallengeQuestion | null> {
    const now = Date.now()
    if (globalForDailyChallenge.dailyChallenge && globalForDailyChallenge.dailyChallenge.expiresAt > now) {
        return globalForDailyChallenge.dailyChallenge.question
    }

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
                    console.error("Failed to parse daily challenge options", error)
                }

                if (Array.isArray(options) && options.every((option) => typeof option === "string")) {
                    question = {
                        id: dailyQuestion.id,
                        question: dailyQuestion.question,
                        options,
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch daily question from DB, using static fallback:", error)
    }

    // Fallback to static daily questions if DB is offline or unseeded
    if (!question && dailyQuestions.length > 0) {
        const index = Math.floor(now / 86400000) % dailyQuestions.length
        const fallbackQ = dailyQuestions[index]
        question = {
            id: fallbackQ.id,
            question: fallbackQ.question,
            options: fallbackQ.options,
        }
    }

    if (question) {
        const midnight = new Date()
        midnight.setHours(23, 59, 59, 999)
        globalForDailyChallenge.dailyChallenge = {
            question,
            expiresAt: midnight.getTime()
        }
    }

    return question
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [dailyChallengeQuestion, clearanceProgress] = await Promise.all([
        safeDbQuery(
            () => getDailyChallengeQuestion(),
            null,
            "DashboardPage.dailyChallenge"
        ),
        getClearanceProgress(session.user.id),
    ])

    return (
        <>
            <DailyChallengeModal initialQuestion={dailyChallengeQuestion} />
            <ClearanceScene progress={clearanceProgress} />
        </>
    )
}
