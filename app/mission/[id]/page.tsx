import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canAccessMission, getMissionById } from "@/services/mission.service"
import { db } from "@/lib/db"
import { MissionWorkspace } from "@/components/mission/MissionWorkspace"
import { MissionRecord, UserMissionRecord } from "@/types"

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    // Guard: Must be ACTIVE or COMPLETED
    const hasAccess = await canAccessMission(session.user.id, id)
    if (!hasAccess) {
        redirect("/dashboard")
    }

    const mission = await getMissionById(id)
    if (!mission) {
        redirect("/dashboard")
    }

    const userMission = await db.userMission.findUnique({
        where: { userId_missionId: { userId: session.user.id, missionId: id } },
    })

    const userProfile = await db.user.findUnique({
        where: { id: session.user.id },
        select: { xp: true, level: true, foxBadges: true }
    })

    return (
        <MissionWorkspace
            mission={mission as unknown as MissionRecord}
            userMission={userMission as unknown as UserMissionRecord}
            userProfile={userProfile || { xp: 0, level: 1, foxBadges: 0 }}
        />
    )
}
