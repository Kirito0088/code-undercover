/* eslint-disable @typescript-eslint/no-require-imports */
export { }
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const missions = [
    {
        order: 1,
        title: "The System Access",
        description: "Learn how to use the printf function in C to display output on the screen. In this task, students will learn how to include the standard input/output library and use printf to print a message to the terminal. The expected output from the program will be: \"Hello Agent \"",
        briefing: "Learn how to use the printf function in C to display output on the screen. In this task, students will learn how to include the standard input/output library and use printf to print a message to the terminal. The expected output from the program will be: \"Hello Agent \"",
        difficulty: "EASY",
        language: "C",
        auraReward: 100,
    },
    {
        order: 2,
        title: "Variable Infiltration",
        description:
            "An enemy agent has scrambled the variable declarations in our communication module. Data types are mismatched and values are corrupted. Restore order by demonstrating mastery of C data types and variable declarations.",
        briefing:
            "Master C data types: int, float, double, char. Learn about variable scope, initialization, type casting, and the sizeof operator. Write clean declarations that the compiler respects.",
        difficulty: "EASY",
        language: "C",
        auraReward: 100,
    },
    {
        order: 3,
        title: "Control Flow Lockdown",
        description:
            "The agency's security gate system has malfunctioned. The conditional logic controlling access doors is broken — some doors stay open when they should be locked. Fix the control flow to restore proper gate operation.",
        briefing:
            "Implement if-else chains, switch statements, and ternary operators. Understand logical operators (&&, ||, !) and how C evaluates boolean expressions. Write decision-making code that handles edge cases.",
        difficulty: "MEDIUM",
        language: "C",
        auraReward: 200,
    },
    {
        order: 4,
        title: "Loop Protocol",
        description:
            "Our encryption module requires a precise iterative algorithm to encode messages. The current implementation runs indefinitely, consuming all system resources. Implement proper loop constructs to fix the encoder.",
        briefing:
            "Master for loops, while loops, and do-while loops. Understand loop control with break and continue. Implement nested loops for matrix operations. Avoid infinite loops and off-by-one errors.",
        difficulty: "MEDIUM",
        language: "C",
        auraReward: 250,
    },
    {
        order: 5,
        title: "Function Assembly",
        description:
            "The agency's codebase has become a monolithic mess — thousands of lines in a single file with duplicated logic everywhere. Refactor the system by extracting reusable functions with proper signatures and return types.",
        briefing:
            "Learn to declare and define functions in C. Understand parameter passing (by value vs by reference), return types, function prototypes, and recursive functions. Write modular, reusable code.",
        difficulty: "HARD",
        language: "C",
        auraReward: 350,
    },
]

async function main() {
    console.log("[SEED] Starting mission seeding...")

    for (const mission of missions) {
        await prisma.mission.upsert({
            where: { order: mission.order },
            update: mission,
            create: mission,
        })
        console.log(`[SEED] Mission #${mission.order}: "${mission.title}" seeded.`)
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
export {}
