import { db } from "@/lib/db"

export class UserService {
    static async getUserById(userId: string) {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    xp: true,
                    level: true,
                    createdAt: true,
                },
            })
            return user
        } catch (error) {
            console.error("[UserService] Error fetching user:", error)
            return null
        }
    }

    static async getUserProgress(userId: string) {
        try {
            const completedCount = await db.userMission.count({
                where: { userId, status: "COMPLETED" },
            })
            const totalMissions = await db.mission.count()
            return { completedCount, totalMissions }
        } catch (error) {
            console.error("[UserService] Error fetching progress:", error)
            return { completedCount: 0, totalMissions: 0 }
        }
    }
}
