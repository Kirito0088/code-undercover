import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canAccessMission, getMissionById } from "@/services/mission.service"
import { db, safeDbQuery } from "@/lib/db"
import { MissionWorkspace } from "@/components/mission/MissionWorkspace"
import { MissionRecord, UserMissionRecord } from "@/types"

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    // Guard: Must be ACTIVE or COMPLETED
    const hasAccess = await safeDbQuery(
        () => canAccessMission(session.user.id, id),
        false,
        "MissionPage.access"
    )
    if (!hasAccess) {
        redirect("/dashboard")
    }

    const mission = await safeDbQuery(
        () => getMissionById(id),
        null,
        "MissionPage.mission"
    )
    if (!mission) {
        redirect("/dashboard")
    }

    // Auto-create UserMission record if it doesn't exist (prevents "solve twice" bug)
    const userMission = await safeDbQuery(
        () => db.userMission.upsert({
            where: { userId_missionId: { userId: session.user.id, missionId: id } },
            update: {},
            create: {
                userId: session.user.id,
                missionId: id,
                status: 'ACTIVE',
                startedAt: new Date(),
            }
        }),
        null,
        "MissionPage.userMission"
    )

    const userProfile = await safeDbQuery(
        () => db.user.findUnique({
            where: { id: session.user.id },
            select: { auraPoints: true, auraLevel: true, foxBadges: true }
        }),
        null,
        "MissionPage.userProfile"
    )

    return (
        <MissionWorkspace
            mission={mission as unknown as MissionRecord}
            userMission={userMission as unknown as UserMissionRecord}
            userProfile={userProfile || { auraPoints: 0, auraLevel: 1, foxBadges: 0 }}
        />
    )
}
