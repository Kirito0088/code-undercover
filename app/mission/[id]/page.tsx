import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canAccessMission, getMissionById } from "@/services/mission.service"
import { db, safeDbQuery } from "@/lib/db"
import { MissionWorkspace } from "@/components/mission/MissionWorkspace"
import { MissionRecord, UserMissionRecord } from "@/types"

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
    // params and session resolution are independent — fetch them concurrently
    const [{ id }, session] = await Promise.all([params, getServerSession(authOptions)])

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

    // Concurrent-safe getOrCreateUserMission to eliminate unique index race condition
    const getOrCreateUserMission = async () => {
        const existing = await db.userMission.findUnique({
            where: { userId_missionId: { userId: session.user.id, missionId: id } }
        })
        if (existing) return existing

        try {
            return await db.userMission.create({
                data: {
                    userId: session.user.id,
                    missionId: id,
                    status: 'ACTIVE',
                    startedAt: new Date(),
                }
            })
        } catch (err) {
            // Concurrent insert won — fetch it again
            return await db.userMission.findUnique({
                where: { userId_missionId: { userId: session.user.id, missionId: id } }
            })
        }
    }

    // Fetch userMission and userProfile concurrently
    const [userMission, userProfile] = await Promise.all([
        safeDbQuery(
            () => getOrCreateUserMission(),
            null,
            "MissionPage.userMission"
        ),
        safeDbQuery(
            () => db.user.findUnique({
                where: { id: session.user.id },
                select: { auraPoints: true, auraLevel: true, foxBadges: true }
            }),
            null,
            "MissionPage.userProfile"
        ),
    ])

    return (
        <MissionWorkspace
            mission={mission as unknown as MissionRecord}
            userMission={userMission as unknown as UserMissionRecord}
            userProfile={userProfile || { auraPoints: 0, auraLevel: 1, foxBadges: 0 }}
        />
    )
}
