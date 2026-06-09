export interface MissionData {
    id: number;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    aura: number;
    language: string;
    isLocked: boolean;
    teachingContent: string;
    mcqContent?: string;
    validationRules?: string;
    startingCode?: string;
    goal?: string;
}

export const missions: MissionData[] = [
    {
        id: 1,
        title: "The System Access",
        difficulty: "EASY",
        aura: 100,
        language: "C",
        isLocked: false,
        teachingContent: JSON.stringify([
            {
                title: "The System Access",
                content: [
                    "printf() function used to displays output or content on screen",
                    " it is defined in <stdio.h> header file",
                    "Uses %d %f %c %s format specifiers",
                    "\n and \t control formatting ",
                    "\n is used to print a new line",
                    "\t is used to print a tab",
                ],
            },
            {
                title: "printf() Function",
                content: [
                    "printf() is your broadcast tool",
                    "Without it agents can't communicate results",
                    "Mastering specifiers = clean intelligence reports",
                ],
            },
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
        id: 2,
        title: "Variable Infiltration",
        difficulty: "EASY",
        aura: 100,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "scanf() Function",
                content: [
                    "scanf() reads keyboard input into variables",
                    "Uses & before variables for memory address",
                    "Format specifiers: %d int, %f float, %c char",
                    "Defined in <stdio.h>",
                ],
            },
            {
                title: "The Vulnerability",
                content: [
                    "No input size checking → buffer overflow",
                    "%s unsafe → stops at space, overwrites memory",
                    "Wrong type input breaks the program",
                    "Leftover \\n in buffer affects next input",
                ],
            },
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
        id: 3,
        title: "Control Flow Lockdown",
        // All missions are EASY — they map to BEGINNER_CURRICULUM in LevelsClient.
        // If difficulty tiers are added in future, update LevelsClient curriculum maps first.
        difficulty: "EASY",
        aura: 214,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "printf() + scanf() Combined",
                content: [
                    "printf() = program's voice, scanf() = program's ears",
                    "Together they form two-way communication",
                    "Always printf() before scanf() to prompt user",
                ],
            },
            {
                title: "Writing an Interactive Program",
                content: [
                    "Step 1: printf() to ask for input",
                    "Step 2: scanf() with correct specifier to read",
                    "Step 3: printf() to display result back",
                ],
            },
            {
                title: "The Intel",
                content: [
                    "printf() + scanf() = fully interactive agent terminal",
                    "A program without input is a one-way broadcast",
                    "Always validate scanf() input before acting on it",
                ],
            },
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
        id: 4,
        title: "Loop Protocol",
        // All missions are EASY — they map to BEGINNER_CURRICULUM in LevelsClient.
        difficulty: "EASY",
        aura: 250,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Loops in C",
                content: [
                    "Loops let you repeat a block of code multiple times",
                    "for loop: for(init; condition; update) { ... }",
                    "while loop: while(condition) { ... }",
                    "do-while: do { ... } while(condition); — runs at least once",
                    "Use break to exit a loop early",
                    "Use continue to skip to the next iteration",
                ],
            },
            {
                title: "The for Loop",
                content: [
                    "for(int i = 0; i < 5; i++) — runs 5 times",
                    "init: runs once before the loop starts",
                    "condition: checked before each iteration",
                    "update: runs after each iteration",
                    "Perfect when you know the exact number of repeats",
                ],
            },
            {
                title: "The while Loop",
                content: [
                    "while(condition) — repeats as long as condition is true",
                    "Useful when you don't know how many times to loop",
                    "Always update the condition variable to avoid infinite loops",
                    "A while loop may never execute if the condition is false initially",
                ],
            },
            {
                title: "String Comparison",
                content: [
                    "strcmp(str1, str2) compares two strings",
                    "Returns 0 if both strings are equal",
                    "Defined in <string.h> header file",
                    "Use fgets() or scanf() to read string input from the user",
                ],
            },
            {
                title: "Mission Intel",
                content: [
                    "Loops + conditionals = powerful access control systems",
                    "A password checker is a real-world loop use case",
                    "After limited attempts, the system must lock down",
                    "This is exactly how secure login systems work",
                ],
            },
        ]),
        goal: "Write a C program that uses a loop to allow 3 password attempts. Password: 'agent007'. Print 'Access Granted' on correct input, 'Wrong Password' on incorrect, and 'System Locked' after 3 failures.",
        startingCode: "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    // Agent, write your access protocol here.\n    // Password: \"agent007\"\n    // Max attempts: 3\n    \n    return 0;\n}",
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
    },
    {
        id: 5,
        title: "Function Assembly",
        // All missions are EASY — they map to BEGINNER_CURRICULUM in LevelsClient.
        difficulty: "EASY",
        aura: 350,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Coming Soon",
                content: [
                    "Classified until Mission 04 is complete",
                    "Final assembly protocol is restricted",
                    "Stand by Agent",
                ],
            },
        ]),
    },
];

// This stores the static textual UI content for missions. Next.js can hot reload these values.
export const missionDetails: Record<number, { description: string; briefing: string }> = {
    // ==========================================
    // LEVEL 1: The System Access
    // ==========================================
    1: {
        description: "Learn how to use the printf function in C to display output on the screen. In this task, students will learn how to include the standard input/output library and use printf to print a message to the terminal. The expected output from the program will be: \"Hello Agent \"",
        briefing: "Learn how to use the printf function in C to display output on the screen. In this task, students will learn how to include the standard input/output library and use printf to print a message to the terminal. The expected output from the program will be: \"Hello Agent \"",
    },

    // ==========================================
    // LEVEL 2: Variable Infiltration
    // ==========================================
    2: {
        description: "An enemy agent has scrambled the variable declarations in our communication module. Data types are mismatched and values are corrupted. Restore order by demonstrating mastery of C data types and variable declarations.",
        briefing: "I have to show chief, that how capable I am. I have to track the ID of Agent platypus. Using scanf(\"%d\", &id) I can do this.",
    },

    // ==========================================
    // LEVEL 3: Control Flow Lockdown
    // ==========================================
    3: {
        description: "The agency's security gate system has malfunctioned. The conditional logic controlling access doors is broken — some doors stay open when they should be locked. Fix the control flow to restore proper gate operation.",
        briefing: "IMPRESSIVE!! The agency has been waiting for someone like you. Register now by Entering printing the name of you and enter the batch code 9870— Agent Platypus needs a partner on the field ",
    },

    // ==========================================
    // LEVEL 4: Loop Protocol
    // ==========================================
    4: {
        description: "You are a secret agent trying to access a classified system. The system password is 'agent007'. You have maximum 3 attempts. Use a loop to allow repeated password attempts. If the password is correct, print 'Access Granted'. If incorrect, print 'Wrong Password'. After 3 failed attempts, print 'System Locked'.",
        briefing: "Agent, a classified terminal has been discovered at the enemy base. The password is 'agent007' — but the system only allows 3 attempts before permanent lockdown. Write a loop-based access protocol: read the password each attempt, print 'Access Granted' if correct (and break), 'Wrong Password' if wrong, and 'System Locked' after 3 failures.",
    },

    // ==========================================
    // LEVEL 5: Function Assembly
    // ==========================================
    5: {
        description: "The agency's codebase has become a monolithic mess — thousands of lines in a single file with duplicated logic everywhere. Refactor the system by extracting reusable functions with proper signatures and return types.",
        briefing: "Learn to declare and define functions in C. Understand parameter passing (by value vs by reference), return types, function prototypes, and recursive functions. Write modular, reusable code.",
    },
};

export interface SecureTestCase {
    input: string;
    expectedOutput: string;
}

export interface SecureMissionValidation {
    id: number;
    title: string;
    requiredOutput?: string;
    testCases?: SecureTestCase[];
}

export const secureMissionValidations: Record<number, SecureMissionValidation> = {
    1: {
        id: 1,
        title: "The System Access",
        requiredOutput: "Hello Agent",
    },
    2: {
        id: 2,
        title: "Variable Infiltration",
        testCases: [
            { input: "7", expectedOutput: "You entered: 7" },
            { input: "42", expectedOutput: "You entered: 42" },
        ],
    },
    3: {
        id: 3,
        title: "Control Flow Lockdown",
        testCases: [
            { input: "4", expectedOutput: "Even" },
            { input: "5", expectedOutput: "Odd" },
            { input: "0", expectedOutput: "Even" },
            { input: "-3", expectedOutput: "Odd" },
        ],
    },
    4: {
        id: 4,
        title: "Loop Protocol",
        testCases: [
            { input: "agent007", expectedOutput: "Access Granted" },
            { input: "wrong\nwrong\nwrong", expectedOutput: "Wrong Password\nWrong Password\nSystem Locked" },
            { input: "wrong\nagent007", expectedOutput: "Wrong Password\nAccess Granted" },
        ],
    },
};

export interface DailyQuestionData {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export const dailyQuestions: DailyQuestionData[] = [
    {
        id: "dq-1",
        question: "What is the correct way to allocate memory for an integer array of size 10 in C?",
        options: [
            "int *arr = malloc(10);",
            "int *arr = malloc(10 * sizeof(int));",
            "int arr = malloc(10);",
            "int *arr = calloc(10);"
        ],
        correctAnswer: "int *arr = malloc(10 * sizeof(int));",
        explanation: "malloc requires the total number of bytes. 10 integers * the size of an integer in bytes."
    },
    {
        id: "dq-2",
        question: "Which format specifier is used to print a double in C?",
        options: [
            "%d",
            "%f",
            "%lf",
            "%s"
        ],
        correctAnswer: "%lf",
        explanation: "%lf stands for 'long float', which is the historical C designation for double precision floats in scanf/printf."
    }
];


