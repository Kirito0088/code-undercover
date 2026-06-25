/**
 * Parameterized user inspection utility.
 * Replaces the old debug-users.ts hardcoded dump.
 *
 * Usage: npx tsx scripts/inspect-user.ts <userId | email | username>
 *
 * Examples:
 *   npx tsx scripts/inspect-user.ts abc-123-uuid
 *   npx tsx scripts/inspect-user.ts user@example.com
 *   npx tsx scripts/inspect-user.ts agent_foxtrot
 *   npx tsx scripts/inspect-user.ts --list
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const userInclude = {
  userMissions: {
    include: {
      mission: {
        select: { id: true, order: true, title: true, difficulty: true },
      },
    },
    orderBy: { mission: { order: "asc" as const } },
  },
} satisfies Prisma.UserInclude;

async function inspectUser(identifier: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: identifier },
        { email: { equals: identifier, mode: "insensitive" } },
        { username: { equals: identifier, mode: "insensitive" } },
      ],
    },
    include: userInclude,
  });

  if (!user) {
    console.log(`\n❌ No agent found matching: "${identifier}"`);
    console.log("Tip: pass a user ID (UUID), email address, or codename.");
    return;
  }

  console.log("═══════════════════════════════════════");
  console.log(`  Agent: ${user.name ?? "(no name)"}`);
  console.log(`  Codename: ${user.username ?? "(no codename)"}`);
  console.log(`  Email: ${user.email ?? "(no email)"}`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Language: ${user.preferredLanguage}`);
  console.log(`  Aura: ${user.auraPoints} pts (Level ${user.auraLevel})`);
  console.log(`  Combo: ${user.comboStreak} current / ${user.maxCombo} max`);
  console.log(`  Fox Badges: ${user.foxBadges}`);
  console.log(`  Missions Completed: ${user.missionsCompleted}`);
  console.log("═══════════════════════════════════════");

  if (user.userMissions.length === 0) {
    console.log("  (No mission records)");
  } else {
    console.log("\n  Mission Progress:");
    for (const um of user.userMissions) {
      const statusIcon =
        um.status === "COMPLETED" ? "✅"
        : um.status === "ACTIVE"    ? "🔵"
        : "🔒";
      console.log(
        `    ${statusIcon} #${um.mission.order} ${um.mission.title} ` +
        `[${um.status}] ` +
        `(attempts: ${um.attemptCount}, hints: ${um.hintsUsed})`
      );
    }
  }

  console.log("");
}

async function main() {
  const identifier = process.argv[2]?.trim();

  if (!identifier) {
    console.log("Usage: npx tsx scripts/inspect-user.ts <userId | email | username>");
    console.log("\nTo list all users:");
    console.log("  npx tsx scripts/inspect-user.ts --list");
    process.exit(1);
  }

  if (identifier === "--list") {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        auraPoints: true,
        missionsCompleted: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    console.log(`\nFound ${users.length} users:\n`);
    for (const u of users) {
      console.log(
        `  ${u.email ?? "(no email)"} — ${u.username ?? "(no codename)"} — ` +
        `${u.name ?? "(no name)"} — ${u.auraPoints} AP — ` +
        `${u.missionsCompleted} missions — ID: ${u.id}`
      );
    }
  } else {
    await inspectUser(identifier);
  }
}

main()
  .catch((err) => {
    console.error("\n❌ Database error — could not complete lookup:");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
