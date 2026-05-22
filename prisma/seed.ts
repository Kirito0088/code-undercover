/* eslint-disable @typescript-eslint/no-require-imports */
export { }
const { PrismaClient } = require("@prisma/client")
import { missions as missionData, missionDetails as descriptions } from "../src/data/missionsData"

const prisma = new PrismaClient()


const missions = missionData.map((m) => ({
    order: m.id,
    title: m.title,
    description: descriptions[m.id]?.description ?? "",
    briefing: descriptions[m.id]?.briefing ?? "",
    difficulty: m.difficulty,
    language: m.language,
    auraReward: m.aura,
    teachingContent: m.teachingContent,
}))

async function main() {
    console.log("[SEED] Starting mission seeding...")

    for (const mission of missions) {
        await prisma.mission.upsert({
            where: { order: mission.order },
            update: mission,
            create: mission,
        })
        console.log(`[SEED] Mission #${mission.order}: "${mission.title}" seeded.`)
        // Small delay to avoid MongoDB write conflicts (P2034)
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`[SEED] Done. ${missions.length} missions seeded.`)
}

main()
    .catch((e) => {
        console.error("[SEED] Error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
export { }
