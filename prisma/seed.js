/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const missions = [
    {
        order: 1,
        title: "First Transmission",
        description: "The agency needs you to establish communications. Write a C program that prints the secret access phrase to the console.",
        briefing: "Learn the fundamentals of output in C. Understand how to use the printf function and include the standard input/output library.",
        difficulty: "EASY",
        language: "C",
        auraReward: 100,
        teachingContent: JSON.stringify([
            {
                title: "The printf() Function",
                content: "In C, printf() is used to print text to the screen. It is part of the standard I/O library (stdio.h). Example: printf(\"Hello, World!\\n\");"
            }
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which library is required to use printf?",
                options: ["math.h", "stdio.h", "stdlib.h", "conio.h"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["printf", "Hello Agent"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 50,
            requiredOutput: "Hello Agent",
            description: "Your code must include the printf function and output exactly 'Hello Agent'."
        })
    },
    {
        order: 2,
        title: "Input Intercept",
        description: "An incoming numerical code needs to be intercepted and verified. Read an integer from user input and print it back securely.",
        briefing: "Learn how to read user input using scanf in C. You will need to declare an integer variable and pass its address to scanf using the & operator.",
        difficulty: "EASY",
        language: "C",
        auraReward: 100,
        teachingContent: JSON.stringify([
            {
                title: "The scanf() Function",
                content: "scanf() reads input from the user. To read an integer, use the %d format specifier and provide the address of the variable using the & symbol. Example: scanf(\"%d\", &myVariable);"
            }
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Why do we use the & symbol in scanf for variables like integers?",
                options: [
                    "To print the variable",
                    "To declare the variable",
                    "To provide the memory address of the variable",
                    "Because it is required by printf"
                ],
                correctIndex: 2
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["scanf", "%d", "printf", "&"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 60,
            testCases: [
                { input: "7", output: "You entered: 7" },
                { input: "42", output: "You entered: 42" }
            ],
            description: "Your code must declare an integer, read it using scanf, and output 'You entered: X', where X is the input."
        })
    },
    {
        order: 3,
        title: "Signal Analyzer",
        description: "The intercepted signals are encrypted based on parity. Write a module that reads a numerical signal and determines whether it is Even or Odd.",
        briefing: "Introduce conditional logic. Use the modulo operator (%) to check if a number is divisible by 2, and use an if-else statement to determine parity.",
        difficulty: "EASY",
        language: "C",
        auraReward: 100,
        teachingContent: JSON.stringify([
            {
                title: "If-Else Statements & Modulo",
                content: "Use the modulo operator (%) to find remainders. If a number % 2 equals 0, it is even. Use an if() statement to handle the true case, and else() to handle the false case."
            }
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What does the expression (7 % 2) evaluate to?",
                options: ["0", "1", "3", "2"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["if", "else", "scanf", "printf", "%"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 80,
            testCases: [
                { input: "4", output: "Even" },
                { input: "5", output: "Odd" },
                { input: "0", output: "Even" },
                { input: "-3", output: "Odd" }
            ],
            description: "Your code must read an integer and output exactly 'Even' or 'Odd'."
        })
    },
    {
        order: 4,
        title: "Loop Protocol",
        description: "You are a secret agent trying to access a classified system. The system password is 'agent007'. You have maximum 3 attempts. Use a loop to allow repeated password attempts. If the password is correct, print 'Access Granted'. If incorrect, print 'Wrong Password'. After 3 failed attempts, print 'System Locked'.",
        briefing: "Agent, a classified terminal has been discovered at the enemy base. The password is 'agent007' — but the system only allows 3 attempts before permanent lockdown. Write a loop-based access protocol: read the password each attempt, print 'Access Granted' if correct (and break), 'Wrong Password' if wrong, and 'System Locked' after 3 failures.",
        difficulty: "MEDIUM",
        language: "C",
        goal: "Write a C program that uses a loop to allow 3 password attempts. Password: 'agent007'. Print 'Access Granted' on correct input, 'Wrong Password' on incorrect, and 'System Locked' after 3 failures.",
        startingCode: "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    // Agent, write your access protocol here.\n    // Password: \"agent007\"\n    // Max attempts: 3\n    \n    return 0;\n}",
        auraReward: 250,
        teachingContent: JSON.stringify([
            {
                title: "Loops in C",
                content: "Loops let you repeat a block of code. for loop: for(init; condition; update) { ... }. while loop: while(condition) { ... }. do-while: do { ... } while(condition); — runs at least once. Use break to exit early, continue to skip an iteration."
            },
            {
                title: "String Comparison",
                content: "strcmp(str1, str2) from <string.h> compares two strings. Returns 0 if equal. Use scanf(\"%s\", variable) to read a string (no & needed for char arrays)."
            }
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which loop guarantees at least one execution?",
                options: ["for loop", "while loop", "do-while loop", "infinite loop"],
                correctIndex: 2
            },
            {
                id: 2,
                question: "What does strcmp() return when two strings are equal?",
                options: ["1", "-1", "0", "true"],
                correctIndex: 2
            },
            {
                id: 3,
                question: "Which keyword immediately exits a loop?",
                options: ["return", "exit", "continue", "break"],
                correctIndex: 3
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["for", "strcmp"],
            forbiddenPatterns: ["// Agent, write your access protocol here"],
            minLength: 100,
            description: "Your code must use a for/while loop with strcmp() to check the password 'agent007'. Print 'Access Granted', 'Wrong Password', or 'System Locked'."
        })
    }
]

async function main() {
    console.log("[SEED] Starting mission seeding...")

    for (const mission of missions) {
        await prisma.mission.upsert({
            where: { order: mission.order },
            update: mission,
            create: mission,
        })
        console.log("[SEED] Mission #" + mission.order + ': "' + mission.title + '" seeded.')
    }

    const questions = [
        {
            question: "What is the correct way to allocate memory for an integer array of size 10 in C?",
            options: JSON.stringify([
                "int *arr = malloc(10);",
                "int *arr = malloc(10 * sizeof(int));",
                "int arr = malloc(10);",
                "int *arr = calloc(10);"
            ]),
            correctAnswer: "int *arr = malloc(10 * sizeof(int));",
            explanation: "malloc requires the total number of bytes. 10 integers * the size of an integer in bytes."
        },
        {
            question: "Which format specifier is used to print a double in C?",
            options: JSON.stringify([
                "%d",
                "%f",
                "%lf",
                "%s"
            ]),
            correctAnswer: "%lf",
            explanation: "%lf stands for 'long float', which is the historical C designation for double precision floats in scanf/printf."
        }
    ]

    for (const q of questions) {
        await prisma.dailyQuestion.create({
            data: q
        })
    }
    console.log("[SEED] Daily questions seeded.")

    console.log("[SEED] Done. " + missions.length + " missions seeded.")
}

main()
    .catch(function (e) {
        console.error("[SEED] Error:", e)
        process.exit(1)
    })
    .finally(async function () {
        await prisma.$disconnect()
    })
export {}
