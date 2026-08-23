"use client"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { dailyQuestions } from "@/src/data/missionsData"
import { DailyChallengeModal } from "@/components/dashboard/DailyChallengeModalLazy"
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
                    console.error("Failed to parse daily question options", error)
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

export default async function DailyChallengesPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const dailyChallengeQuestion = await safeDbQuery(
        () => getDailyChallengeQuestion(),
        null,
        "DailyChallengesPage.dailyChallenge"
    )

    return (
        <div className="flex-1 bg-[#07080A] py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold text-red-500 tracking-tight mb-6">
                    Daily Challenges
                </h1>

                {dailyChallengeQuestion ? (
                    <DailyChallengeModal initialQuestion={dailyChallengeQuestion} />
                ) : (
                    <div className="text-center py-20">
                        <div className="size-12 text-[#4A5D4A] mx-auto mb-4">?</div>
                        <p className="text-[#8F9F8F] text-sm">No daily challenge available today. Check back tomorrow.</p>
                    </div>
                )}
            </div>
        </div>
    )
}