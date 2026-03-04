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
        title: "Syntax Glitch: Missing Terminator",
        description: "An encrypted module failed to compile. We believe a junior operative missed a critical character. Fix the code to restore functionality.",
        briefing: "Debug missions test your ability to read compiler errors. Find the missing semicolon in the provided code so it outputs 'Module Restored'.",
        type: "debug",
        goal: "Fix the syntax error so the program compiles.",
        startingCode: "#include <stdio.h>\n\nint main() {\n    printf(\"Module Restored\")\n    return 0;\n}",
        language: "C",
        auraReward: 50,
        teachingContent: JSON.stringify([
            {
                title: "Debugging Semicolons",
                content: "In C, every statement must end with a semicolon (;). Missing them causes cascade compiler errors on the next line."
            }
        ]),
        mcqContent: JSON.stringify([]),
        validationRules: JSON.stringify({
            requiredKeywords: ["printf", "Module Restored"],
            testCases: [
                { input: "", output: "Module Restored" }
            ],
            description: "Fix the code to output 'Module Restored'."
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
