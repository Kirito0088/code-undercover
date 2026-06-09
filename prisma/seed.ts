/* eslint-disable @typescript-eslint/no-require-imports */
export { }
const { PrismaClient } = require("@prisma/client")
import { missions as missionData, missionDetails as descriptions, dailyQuestions } from "../src/data/missionsData"

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
    mcqContent: m.mcqContent ?? null,
    validationRules: m.validationRules ?? null,
    startingCode: m.startingCode ?? null,
    goal: m.goal ?? null,
}))

async function main() {
    console.log("[SEED] Starting mission seeding...")

    // Guard: all missions must be EASY until LevelsClient curriculum maps support tiers
    const nonEasyMissions = missions.filter(m => m.difficulty !== "EASY")
    if (nonEasyMissions.length > 0) {
        throw new Error(
            `Seed error: missions ${nonEasyMissions.map(m => m.order).join(", ")} have non-EASY difficulty. ` +
            `Update missionsData.ts or LevelsClient.tsx curriculum maps before seeding.`
        )
    }

    await Promise.all(
        missions.map(async (mission) => {
            await prisma.mission.upsert({
                where: { order: mission.order },
                update: mission,
                create: mission,
            })
            console.log(`[SEED] Mission #${mission.order}: "${mission.title}" seeded.`)
        })
    )

    console.log("[SEED] Seeding daily questions...")
    await Promise.all(
        dailyQuestions.map(async (q) => {
            const mapped = {
                id: q.id,
                question: q.question,
                options: JSON.stringify(q.options),
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
            }
            await prisma.dailyQuestion.upsert({
                where: { id: q.id },
                update: mapped,
                create: mapped,
            })
            console.log(`[SEED] Daily question: "${q.question.substring(0, 30)}..." seeded.`)
        })
    )

    console.log(`[SEED] Done. ${missions.length} missions and ${dailyQuestions.length} daily questions seeded.`)
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

