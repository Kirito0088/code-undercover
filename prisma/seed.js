const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const missions = [
    {
        order: 1,
        title: "The Pointer Breach",
        description:
            "A critical vulnerability has been detected in the agency's authentication module. Dangling pointers are causing unauthorized memory access. Your mission: write a C program that correctly allocates, uses, and frees memory using pointers.",
        briefing:
            "Learn the fundamentals of pointers in C. Understand how to declare pointer variables, assign addresses, dereference values, and avoid common pitfalls like dangling and null pointer dereferences.",
        difficulty: "EASY",
        language: "C",
        xpReward: 100,
        teachingContent: JSON.stringify([
            {
                title: "Memory Direct Access",
                content: "Pointers allow direct manipulation of memory. When a pointer loses its reference to a valid memory address but the pointer itself still exists, it becomes a dangling pointer."
            },
            {
                title: "The Vulnerability",
                content: "In Code Undercover systems, dangling pointers lead to unauthorized access. Your mission is to secure the code by tracking valid memory references and setting pointers to NULL when freed."
            }
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What happens when a dangling pointer is dereferenced?",
                options: [
                    "It automatically returns NULL",
                    "It safely crashes the program",
                    "It accesses undefined memory, causing unpredictable behavior or vulnerabilities"
                ],
                correctIndex: 2
            },
            {
                id: 2,
                question: "Which keyword is used to allocate memory in C?",
                options: ["new", "malloc", "allocate", "create"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["malloc", "free", "printf", "NULL"],
            requiredPatterns: ["int *", "int*"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 120,
            description: "Your code must: allocate memory with malloc(), use a pointer, print output with printf(), free the memory, and set the pointer to NULL."
        })
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
        xpReward: 100,
        teachingContent: JSON.stringify([
            { title: "Data Types in C", content: "C has several built-in data types: int for integers, float and double for decimals, and char for single characters. Each occupies a different amount of memory." },
            { title: "The sizeof Operator", content: "Use sizeof() to determine the memory footprint of any variable or type. This is crucial for writing memory-safe code." }
        ]),
        mcqContent: JSON.stringify([
            { id: 1, question: "Which data type stores a single character in C?", options: ["string", "char", "letter", "text"], correctIndex: 1 },
            { id: 2, question: "What does sizeof(int) return?", options: ["The value of the int", "The memory size in bytes", "The address of the int", "The type name"], correctIndex: 1 }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "float", "char", "printf", "sizeof"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            description: "Your code must: declare int, float, and char variables, use printf to display them, and use sizeof to show their memory size."
        })
    },
    {
        order: 3,
        title: "Control Flow Lockdown",
        description:
            "The agency's security gate system has malfunctioned. The conditional logic controlling access doors is broken. Fix the control flow to restore proper gate operation.",
        briefing:
            "Implement if-else chains, switch statements, and ternary operators. Understand logical operators (&&, ||, !) and how C evaluates boolean expressions.",
        difficulty: "MEDIUM",
        language: "C",
        xpReward: 200,
        teachingContent: JSON.stringify([
            { title: "Conditional Branching", content: "if-else statements allow your program to make decisions. The condition inside if() is evaluated as true (non-zero) or false (zero)." },
            { title: "Switch Statements", content: "switch provides a clean alternative to long if-else chains when comparing a single variable against multiple values." }
        ]),
        mcqContent: JSON.stringify([
            { id: 1, question: "What value does C treat as 'false'?", options: ["1", "-1", "0", "NULL"], correctIndex: 2 },
            { id: 2, question: "Which operator means 'logical AND' in C?", options: ["&", "&&", "AND", "||"], correctIndex: 1 }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["if", "else", "switch", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 150,
            description: "Your code must: use if-else branching, implement a switch statement, and print results with printf."
        })
    },
    {
        order: 4,
        title: "Loop Protocol",
        description:
            "Our encryption module requires a precise iterative algorithm to encode messages. The current implementation runs indefinitely. Implement proper loop constructs to fix the encoder.",
        briefing:
            "Master for loops, while loops, and do-while loops. Understand loop control with break and continue. Implement nested loops for matrix operations.",
        difficulty: "MEDIUM",
        language: "C",
        xpReward: 250,
        teachingContent: JSON.stringify([
            { title: "Loop Constructs", content: "C provides three loop types: for (known iterations), while (condition-based), and do-while (runs at least once). Each has specific use cases." },
            { title: "Loop Control", content: "Use break to exit a loop early, and continue to skip to the next iteration. These are essential for writing efficient algorithms." }
        ]),
        mcqContent: JSON.stringify([
            { id: 1, question: "Which loop always executes at least once?", options: ["for", "while", "do-while", "foreach"], correctIndex: 2 },
            { id: 2, question: "What does 'break' do inside a loop?", options: ["Skips to next iteration", "Exits the loop", "Pauses the loop", "Restarts the loop"], correctIndex: 1 }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["for", "while", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 120,
            description: "Your code must: use a for loop, use a while loop, and print iterative output with printf."
        })
    },
    {
        order: 5,
        title: "Function Assembly",
        description:
            "The agency's codebase has become a monolithic mess. Refactor the system by extracting reusable functions with proper signatures and return types.",
        briefing:
            "Learn to declare and define functions in C. Understand parameter passing (by value vs by reference), return types, function prototypes, and recursive functions.",
        difficulty: "HARD",
        language: "C",
        xpReward: 350,
        teachingContent: JSON.stringify([
            { title: "Function Basics", content: "Functions in C have a return type, a name, parameters, and a body. They enable code reuse and modularity." },
            { title: "Pass by Reference", content: "C passes arguments by value by default. To modify the original variable, pass a pointer to it (pass by reference)." }
        ]),
        mcqContent: JSON.stringify([
            { id: 1, question: "What is a function prototype?", options: ["The function body", "A declaration before the function definition", "A recursive call", "A pointer to a function"], correctIndex: 1 },
            { id: 2, question: "How do you pass by reference in C?", options: ["Using &", "Using *", "Using pointers as parameters", "Using const"], correctIndex: 2 }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["return", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 180,
            requireCustomFunction: true,
            description: "Your code must: define at least one custom function (not main), call it from main, and use printf to display results."
        })
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
        console.log("[SEED] Mission #" + mission.order + ': "' + mission.title + '" seeded.')
    }

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
