import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { getDailyChallengeQuestion } from "@/lib/daily-challenge"
import { DailyTasksClient } from "@/components/daily-tasks/DailyTasksClient"

export default async function DailyChallengesPage() {
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
            "DailyChallengesPage.user"
        ),
        safeDbQuery(
            () => getDailyChallengeQuestion(),
            null,
            "DailyChallengesPage.dailyQuestion"
        ),
    ])

    return (
        <DailyTasksClient
            initialQuestion={dailyQuestion}
            user={user}
        />
    )
}
