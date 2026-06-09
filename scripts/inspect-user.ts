/**
 * Parameterized user inspection utility.
 * Replaces the old debug-users.ts hardcoded dump.
 * 
 * Usage: npx tsx scripts/inspect-user.ts <userId or email>
 * 
 * Examples:
 *   npx tsx scripts/inspect-user.ts abc-123-uuid
 *   npx tsx scripts/inspect-user.ts user@example.com
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function inspectUser(identifier: string) {
    // Try finding by ID first, then by email
    let user = await prisma.user.findUnique({
        where: { id: identifier },
        include: {
            userMissions: {
                include: { mission: { select: { id: true, order: true, title: true, difficulty: true } } },
                orderBy: { mission: { order: "asc" } },
            },
        },
    })

    if (!user) {
        user = await prisma.user.findUnique({
            where: { email: identifier },
            include: {
                userMissions: {
                    include: { mission: { select: { id: true, order: true, title: true, difficulty: true } } },
                    orderBy: { mission: { order: "asc" } },
                },
            },
        })
    }

    if (!user) {
        console.log(`❌ User not found: "${identifier}"`)
        console.log("\nTip: pass a user ID (UUID) or email address as the argument.")
        return
    }

    console.log("═══════════════════════════════════════")
    console.log(`  User: ${user.name || "(no name)"}`)
    console.log(`  Email: ${user.email || "(no email)"}`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Aura: ${user.auraPoints} pts (Level ${user.auraLevel})`)
    console.log(`  Combo: ${user.comboStreak} current / ${user.maxCombo} max`)
    console.log(`  Fox Badges: ${user.foxBadges}`)
    console.log(`  Missions Completed: ${user.missionsCompleted}`)
    console.log("═══════════════════════════════════════")

    if (user.userMissions.length === 0) {
        console.log("  (No mission records)")
    } else {
        console.log("\n  Mission Progress:")
        for (const um of user.userMissions) {
            const statusIcon = um.status === "COMPLETED" ? "✅"
                : um.status === "ACTIVE" ? "🔵"
                : "🔒"
            console.log(
                `    ${statusIcon} #${um.mission.order} ${um.mission.title} ` +
                `[${um.status}] ` +
                `(attempts: ${um.attemptCount}, hints: ${um.hintsUsed})`
            )
        }
    }
    console.log("")
}

const identifier = process.argv[2]
if (!identifier) {
    console.log("Usage: npx tsx scripts/inspect-user.ts <userId or email>")
    console.log("\nTo list all users:")
    console.log("  npx tsx scripts/inspect-user.ts --list")
    process.exit(1)
}

if (identifier === "--list") {
    prisma.user.findMany({
        select: { id: true, name: true, email: true, auraPoints: true, missionsCompleted: true },
        orderBy: { createdAt: "desc" },
        take: 50
    }).then(users => {
        console.log(`\nFound ${users.length} users:\n`)
        for (const u of users) {
            console.log(`  ${u.email || "(no email)"} — ${u.name || "(no name)"} — ${u.auraPoints} AP — ${u.missionsCompleted} missions — ID: ${u.id}`)
        }
    }).finally(() => prisma.$disconnect())
} else {
    inspectUser(identifier).finally(() => prisma.$disconnect())
}
