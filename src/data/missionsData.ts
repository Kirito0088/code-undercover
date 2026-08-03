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
        difficulty: "EASY",
        aura: 258,
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
        difficulty: "EASY",
        aura: 300,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Functions in C",
                content: [
                    "A function is a reusable block of code",
                    "Declared as: returnType name(parameters) { body }",
                    "Parameters receive input values from the caller",
                    "return sends a value back to the caller",
                    "Prototypes let you call a function before its definition",
                ],
            },
            {
                title: "Building a Modular Sub-system",
                content: [
                    "int add(int a, int b) { return a + b; }",
                    "Function with parameters computes a result",
                    "main() orchestrates and prints the outcome",
                    "Breaking logic into functions = maintainable code",
                ],
            },
            {
                title: "The Intel",
                content: [
                    "Mission 05 requires an add function",
                    "The function must take two integers and return their sum",
                    "main() reads two integers and prints the total",
                    "Real programs are built from many small functions",
                ],
            },
        ]),
        goal: "Write a C program with a function int add(int a, int b) that returns the sum of two integers. Read two integers in main(), call the function, and print 'Sum: X' where X is the total.",
        startingCode: "#include <stdio.h>\n\n// Agent, define your add function here.\n\nint main() {\n    int a, b;\n    scanf(\"%d %d\", &a, &b);\n    // Call add() and print the result as \"Sum: X\"\n    return 0;\n}",
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is the return type of a function that returns a whole number?",
                options: ["void", "float", "int", "char"],
                correctIndex: 2
            },
            {
                id: 2,
                question: "Which keyword is used to send a value back from a function?",
                options: ["break", "return", "continue", "exit"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "add", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, define your add function here"],
            minLength: 90,
            testCases: [
                { input: "4 6", output: "Sum: 10" },
                { input: "12 30", output: "Sum: 42" },
                { input: "-5 8", output: "Sum: 3" }
            ],
            description: "Your code must define an int add(int, int) function and print 'Sum: X'."
        })
    },
    {
        id: 6,
        title: "Arithmetic Protocol",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Arithmetic Operators",
                content: [
                    "+ addition, - subtraction, * multiplication, / division, % modulo",
                    "Operator precedence: * / % before + -",
                    "Parentheses ( ) override precedence",
                    "Integer division truncates: 7 / 2 == 3",
                ],
            },
            {
                title: "Reading Two Operands",
                content: [
                    "scanf(\"%d %d\", &a, &b) reads two integers",
                    "Compose expressions using the operators",
                    "Print the computed total to the terminal",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is the result of 17 % 5?",
                options: ["3", "2", "5", "12"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 60,
            testCases: [
                { input: "8 5", output: "Sum: 13" },
                { input: "20 22", output: "Sum: 42" }
            ],
            description: "Read two integers and print 'Sum: X' where X is their sum."
        })
    },
    {
        id: 7,
        title: "Operative Decisions",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Conditional Statements",
                content: [
                    "if (condition) { ... } executes when condition is true",
                    "else if chains multiple exclusive paths",
                    "else catches every other case",
                    "Comparison operators: < > <= >= == !=",
                ],
            },
            {
                title: "Grading a Marks Payload",
                content: [
                    "Score >= 90 → Grade A",
                    "Score >= 75 → Grade B",
                    "Score >= 60 → Grade C",
                    "Otherwise → Grade F",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which operator checks equality in C?",
                options: ["=", "==", "!=", "==="],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["if", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 80,
            testCases: [
                { input: "92", output: "Grade A" },
                { input: "80", output: "Grade B" },
                { input: "65", output: "Grade C" },
                { input: "40", output: "Grade F" }
            ],
            description: "Read a score and print 'Grade A', 'Grade B', 'Grade C', or 'Grade F' using the rubric."
        })
    },
    {
        id: 8,
        title: "Secure Logic Gates",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Logical Operators",
                content: [
                    "&& logical AND — true only if both sides true",
                    "|| logical OR — true if either side true",
                    "! logical NOT — flips the truth value",
                    "Combine conditions to express complex rules",
                ],
            },
            {
                title: "Leap Year Rule",
                content: [
                    "Divisible by 400 → leap year",
                    "Divisible by 100 but not 400 → not leap year",
                    "Divisible by 4 but not 100 → leap year",
                    "Otherwise → not a leap year",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What does (true && false) evaluate to?",
                options: ["true", "false", "1", "undefined"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["%", "&&", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 80,
            testCases: [
                { input: "2000", output: "Leap Year" },
                { input: "1900", output: "Not Leap Year" },
                { input: "2024", output: "Leap Year" },
                { input: "2023", output: "Not Leap Year" }
            ],
            description: "Read a year and print exactly 'Leap Year' or 'Not Leap Year'."
        })
    },
    {
        id: 9,
        title: "Switching Frequencies",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "switch Statement",
                content: [
                    "switch (expr) routes on a value",
                    "case labels match constant values",
                    "break exits the switch after a match",
                    "default handles unmatched values",
                    "Cleaner than long if/else chains for fixed sets",
                ],
            },
            {
                title: "Routing a Signal Code",
                content: [
                    "Input 1 → print 'One'",
                    "Input 2 → print 'Two'",
                    "Input 3 → print 'Three'",
                    "Anything else → print 'Unknown Signal'",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which keyword prevents fall-through in a switch?",
                options: ["return", "break", "continue", "exit"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["switch", "case", "break", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "1", output: "One" },
                { input: "2", output: "Two" },
                { input: "3", output: "Three" },
                { input: "9", output: "Unknown Signal" }
            ],
            description: "Use a switch to print 'One', 'Two', 'Three', or 'Unknown Signal' based on the input."
        })
    },
    {
        id: 10,
        title: "Iterative Extraction",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "while Loop",
                content: [
                    "while (condition) { body }",
                    "Repeats as long as condition is true",
                    "Condition checked before each iteration",
                    "Update the loop variable to avoid infinite loops",
                ],
            },
            {
                title: "Summing Natural Numbers",
                content: [
                    "Read n from the user",
                    "Loop from 1 to n accumulating a running total",
                    "Print the final sum",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "When is the while loop condition evaluated?",
                options: ["After each iteration", "Before each iteration", "Only once", "Never"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["while", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 70,
            testCases: [
                { input: "5", output: "Sum: 15" },
                { input: "10", output: "Sum: 55" }
            ],
            description: "Read n and print 'Sum: X' where X is the sum of 1..n using a while loop."
        })
    },
    {
        id: 11,
        title: "Loop Encryption",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "for Loop Counting",
                content: [
                    "for (init; condition; update) — three-part control",
                    "init runs once, condition checked each pass, update after body",
                    "Common to use i++ to increment a counter",
                    "Output sequences by printing inside the loop",
                ],
            },
            {
                title: "Emit a Sequence",
                content: [
                    "Read n from the user",
                    "Print numbers from 1 to n separated by spaces",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "How many times does 'for(int i=0; i<3; i++)' run?",
                options: ["2", "3", "4", "Infinite"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["for", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 70,
            testCases: [
                { input: "3", output: "1 2 3" },
                { input: "5", output: "1 2 3 4 5" }
            ],
            description: "Read n and print the numbers 1 to n space-separated."
        })
    },
    {
        id: 12,
        title: "Breakout Protocols",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "break and continue",
                content: [
                    "break terminates the loop immediately",
                    "continue skips to the next iteration",
                    "Useful for early-exit conditions and filtering",
                ],
            },
            {
                title: "Sum Until Zero",
                content: [
                    "Keep reading integers and summing them",
                    "break the loop when the input is 0",
                    "Print the accumulated total",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What does 'continue' do inside a loop?",
                options: ["Ends the loop", "Skips to next iteration", "Restarts the program", "Exits the function"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["break", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 70,
            testCases: [
                { input: "5 10 0", output: "Sum: 15" },
                { input: "1 2 3 4 0", output: "Sum: 10" }
            ],
            description: "Read integers until 0 is entered, summing as you go. Print 'Sum: X'."
        })
    },
    {
        id: 13,
        title: "Nested Surveillance",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Nested Loops",
                content: [
                    "A loop inside another loop is a nested loop",
                    "Inner loop completes fully for each outer iteration",
                    "Classic use: multiplication tables and grids",
                ],
            },
            {
                title: "Multiplication Table",
                content: [
                    "Read n from the user",
                    "Print rows n x 1 to n x 10",
                    "Format each line as 'n x i = result'",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "If outer loop runs 3 times and inner runs 4 times, how many total inner iterations?",
                options: ["7", "12", "4", "34"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["for", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 80,
            testCases: [
                { input: "2", output: "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20" }
            ],
            description: "Read n and print its multiplication table from 1 to 10."
        })
    },
    {
        id: 14,
        title: "Agent Signature",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "void Functions",
                content: [
                    "void functions perform an action but return nothing",
                    "No return value needed — just side effects",
                    "Common for printing, logging, and setup routines",
                ],
            },
            {
                title: "A Greeting Routine",
                content: [
                    "Define void greet() that prints a greeting",
                    "Call it from main()",
                    "The program's flow becomes easier to read",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What does a void function return?",
                options: ["0", "Nothing", "true", "NULL"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["void", "greet", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 70,
            requiredOutput: "Hello Agent, ready for duty",
            description: "Define a void greet() function and call it from main(). Output 'Hello Agent, ready for duty'."
        })
    },
    {
        id: 15,
        title: "Data Return Payload",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Return Values",
                content: [
                    "Functions can compute and return a value",
                    "int max(int a, int b) returns the larger number",
                    "The caller captures the result in a variable",
                ],
            },
            {
                title: "Maximum of Two",
                content: [
                    "Read two integers in main()",
                    "Call a function that returns the maximum",
                    "Print 'Max: X'",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which symbol returns a value in C?",
                options: ["return", "break", "goto", "yield"],
                correctIndex: 0
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "max", "return", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "3 9", output: "Max: 9" },
                { input: "14 7", output: "Max: 14" }
            ],
            description: "Define a max function, read two integers, and print 'Max: X'."
        })
    },
    {
        id: 16,
        title: "Scope & Lifetime",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Local vs Global Scope",
                content: [
                    "Variables declared inside a function are local",
                    "Global variables are declared outside all functions",
                    "Local variables die when the block ends",
                    "Globals live for the whole program",
                ],
            },
            {
                title: "Static Counter",
                content: [
                    "A static variable inside a function keeps its value between calls",
                    "Great for persistent counters",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Where is a global variable declared?",
                options: ["Inside main", "Outside all functions", "Inside a loop", "In a header only"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["static", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 60,
            requiredOutput: "Count: 1 Count: 2",
            description: "Use a static counter in a function called twice from main(). Output 'Count: 1 Count: 2'."
        })
    },
    {
        id: 17,
        title: "Array Grid Infiltration",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Arrays",
                content: [
                    "An array stores multiple values of the same type",
                    "int arr[5] reserves 5 integers",
                    "Indexing starts at 0: arr[0], arr[1], ...",
                    "Loop over arrays using their length",
                ],
            },
            {
                title: "Summing an Array",
                content: [
                    "Read n, then n integers into an array",
                    "Loop over the array accumulating a sum",
                    "Print the total",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is the index of the first element of an array?",
                options: ["1", "0", "-1", "2"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "[", "scanf", "for", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "4\n1 2 3 4", output: "Sum: 10" },
                { input: "3\n5 10 15", output: "Sum: 30" }
            ],
            description: "Read n then n integers into an array, then print 'Sum: X'."
        })
    },
    {
        id: 18,
        title: "Operative Strings",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Strings in C",
                content: [
                    "A string is a char array ending in the null character '\\0'",
                    "char name[20] can hold up to 19 characters + '\\0'",
                    "Strings are read with scanf(\"%s\", str) — no & needed",
                    "Traverse a string until you hit '\\0'",
                ],
            },
            {
                title: "Counting Vowels",
                content: [
                    "Read a string",
                    "Loop over each character checking a/e/i/o/u",
                    "Print the vowel count",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which character marks the end of a C string?",
                options: ["\\n", "\\0", "\\t", "' '"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["char", "%s", "scanf", "\\0", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "agent", output: "Vowels: 2" },
                { input: "spy", output: "Vowels: 0" }
            ],
            description: "Read a string and print 'Vowels: X' where X is the count of vowels (a,e,i,o,u)."
        })
    },
    {
        id: 19,
        title: "Pointer Intel Retrieval",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Pointers",
                content: [
                    "A pointer stores the memory address of a variable",
                    "&x gives the address of x",
                    "*ptr dereferences: reads the value at that address",
                    "int *p declares a pointer to an integer",
                ],
            },
            {
                title: "Swapping via Pointers",
                content: [
                    "Pass addresses to a swap function",
                    "Exchange values through dereferenced pointers",
                    "The caller sees the changed values",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which operator returns the address of a variable?",
                options: ["*", "&", "#", "%"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "*", "&", "swap", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "5 3", output: "A: 3 B: 5" },
                { input: "10 20", output: "A: 20 B: 10" }
            ],
            description: "Read two integers, swap them using pointers, and print 'A: X B: Y'."
        })
    },
    {
        id: 20,
        title: "Secure Memory Allocator",
        difficulty: "EASY",
        aura: 110,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Dynamic Memory",
                content: [
                    "malloc(size) allocates bytes on the heap",
                    "Always check the returned pointer for NULL",
                    "free(ptr) releases the memory when done",
                    "Set ptr = NULL after free to avoid dangling pointers",
                ],
            },
            {
                title: "Allocate One Integer",
                content: [
                    "int *ptr = malloc(sizeof(int))",
                    "Assign 42 through the pointer: *ptr = 42",
                    "Print the value, then free it",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which header is required for malloc and free?",
                options: ["stdio.h", "stdlib.h", "string.h", "math.h"],
                correctIndex: 1
            },
            {
                id: 2,
                question: "Why check if malloc returns NULL?",
                options: ["Style only", "Memory may be unavailable", "To print it", "NULL is always returned"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["malloc", "free", "sizeof", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            requiredOutput: "42",
            description: "Allocate one integer with malloc, set it to 42, print it, then free the memory. Output '42'."
        })
    },
    {
        id: 21,
        title: "Advanced Control Logic",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Nested Conditionals",
                content: [
                    "Conditionals can be nested inside other conditionals",
                    "Nested logic expresses multi-level decision trees",
                    "Keep nesting shallow for readability",
                ],
            },
            {
                title: "Largest of Three",
                content: [
                    "Compare three integers with nested if/else",
                    "Print the largest value",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is the largest of 7, 12, 5?",
                options: ["7", "12", "5", "24"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["if", "else", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "3 9 5", output: "Max: 9" },
                { input: "10 2 8", output: "Max: 10" }
            ],
            description: "Read three integers and print 'Max: X' for the largest."
        })
    },
    {
        id: 22,
        title: "Loop Optimization Protocol",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Primality Testing",
                content: [
                    "A prime has exactly two divisors: 1 and itself",
                    "Check divisibility from 2 up to n/2",
                    "Optimize: only test up to sqrt(n)",
                ],
            },
            {
                title: "Reading a Key",
                content: [
                    "Read an integer n",
                    "Loop to test divisors",
                    "Print 'Prime' or 'Not Prime'",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which of these is a prime number?",
                options: ["9", "15", "17", "21"],
                correctIndex: 2
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["for", "%", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "7", output: "Prime" },
                { input: "9", output: "Not Prime" },
                { input: "2", output: "Prime" },
                { input: "1", output: "Not Prime" }
            ],
            description: "Read an integer and print exactly 'Prime' or 'Not Prime'."
        })
    },
    {
        id: 23,
        title: "Pointer Arithmetic",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Pointer Arithmetic",
                content: [
                    "ptr + 1 points to the next element of the array",
                    "Pointer increments scale by the element size",
                    "Iterate arrays with a pointer instead of an index",
                ],
            },
            {
                title: "Sum with a Pointer",
                content: [
                    "int *p = arr; points at the first element",
                    "p[i] is equivalent to *(p + i)",
                    "Accumulate the total across the array",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "If int *p = arr, what does *(p + 2) access?",
                options: ["arr[2]", "arr[3]", "p[3]", "the address of arr"],
                correctIndex: 0
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "*", "[", "scanf", "for", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "4\n1 2 3 4", output: "Sum: 10" },
                { input: "3\n7 8 9", output: "Sum: 24" }
            ],
            description: "Read n then n integers, and sum them using pointer arithmetic. Print 'Sum: X'."
        })
    },
    {
        id: 24,
        title: "Struct Blueprinting",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Structures",
                content: [
                    "A struct groups related fields into one type",
                    "struct Agent { char name[20]; int id; };",
                    "Access fields with the dot operator: agent.name",
                    "Structs model real-world entities",
                ],
            },
            {
                title: "Model an Agent",
                content: [
                    "Create a struct for an operative",
                    "Initialize its fields",
                    "Print them in a formatted report",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which operator accesses a struct field?",
                options: ["->", ".", "::", "&"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["struct", "char", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            requiredOutput: "Agent: Platypus ID: 007",
            description: "Define a struct with a name and id, initialize it to 'Platypus' / 007, and print 'Agent: Platypus ID: 007'."
        })
    },
    {
        id: 25,
        title: "Formatted Intel Report",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "sprintf",
                content: [
                    "sprintf(buf, format, args) writes formatted text into a buffer",
                    "Instead of printing, it stores a string",
                    "Useful for composing reports before output",
                ],
            },
            {
                title: "Compose a Report",
                content: [
                    "Read a codename and a clearance level",
                    "Compose 'Codename: X | Clearance: Y' with sprintf",
                    "Print the composed buffer",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What does sprintf do?",
                options: [
                    "Reads from the keyboard",
                    "Formats text into a buffer",
                    "Allocates memory",
                    "Compares two strings"
                ],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["sprintf", "char", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "Fox 5", output: "Codename: Fox | Clearance: 5" },
                { input: "Owl 2", output: "Codename: Owl | Clearance: 2" }
            ],
            description: "Read a codename string and a clearance integer, compose a report with sprintf, and print it."
        })
    },
    {
        id: 26,
        title: "Dynamic Grid Buffer",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Dynamic Arrays",
                content: [
                    "malloc(n * sizeof(type)) creates an array at runtime",
                    "Size decided at runtime, not compile time",
                    "Always free() the array after use",
                    "Use a variable to track its length",
                ],
            },
            {
                title: "Dynamic Sum",
                content: [
                    "Read n, then allocate an array of n integers",
                    "Fill it, compute the sum, print, then free",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "How do you allocate an array of 10 integers?",
                options: ["malloc(10)", "malloc(10 * sizeof(int))", "malloc(int)", "calloc(10, 1)"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["malloc", "free", "sizeof", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "4\n2 4 6 8", output: "Sum: 20" },
                { input: "3\n1 1 1", output: "Sum: 3" }
            ],
            description: "Allocate an array of n integers with malloc, sum them, print 'Sum: X', then free."
        })
    },
    {
        id: 27,
        title: "Recursive Signal Decryptor",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Recursion",
                content: [
                    "A recursive function calls itself",
                    "Every recursion needs a base case to stop",
                    "The problem is reduced toward the base case",
                ],
            },
            {
                title: "Factorial",
                content: [
                    "factorial(0) = 1 (base case)",
                    "factorial(n) = n * factorial(n-1)",
                    "Classic first recursion exercise",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is 5! (5 factorial)?",
                options: ["120", "25", "100", "60"],
                correctIndex: 0
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "factorial", "return", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "5", output: "Factorial: 120" },
                { input: "0", output: "Factorial: 1" },
                { input: "6", output: "Factorial: 720" }
            ],
            description: "Write a recursive factorial function and print 'Factorial: X'."
        })
    },
    {
        id: 28,
        title: "Memory Infiltration",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Memory Safety",
                content: [
                    "Never dereference an unchecked pointer",
                    "malloc can fail and return NULL",
                    "Always guard with if (ptr != NULL)",
                    "Free memory exactly once",
                ],
            },
            {
                title: "Safe Allocation",
                content: [
                    "Attempt to allocate a block",
                    "If NULL → print a failure message",
                    "If allocated → print success and free",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What value does malloc return on failure?",
                options: ["0", "NULL", "-1", "undefined"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["malloc", "if", "NULL", "free", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            requiredOutput: "Memory Allocated",
            description: "Allocate memory with malloc, check for NULL, print 'Memory Allocated' on success, and free it."
        })
    },
    {
        id: 29,
        title: "Recursion Master",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Fibonacci Sequence",
                content: [
                    "fib(0) = 0, fib(1) = 1 (base cases)",
                    "fib(n) = fib(n-1) + fib(n-2)",
                    "Recursion mirrors the mathematical definition",
                ],
            },
            {
                title: "Computing Fibonacci",
                content: [
                    "Read n from the user",
                    "Compute fib(n) recursively",
                    "Print the result",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is fib(6)?",
                options: ["5", "8", "13", "6"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "fib", "return", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "6", output: "Fibonacci: 8" },
                { input: "10", output: "Fibonacci: 55" }
            ],
            description: "Write a recursive fibonacci function and print 'Fibonacci: X'."
        })
    },
    {
        id: 30,
        title: "Bitwise Masking Protocol",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Bitwise Operators",
                content: [
                    "& AND, | OR, ^ XOR, ~ NOT, << left shift, >> right shift",
                    "x & 1 tests the lowest bit (is it odd?)",
                    "Bits are read right-to-left, position 0 = 1",
                ],
            },
            {
                title: "Counting Set Bits",
                content: [
                    "For each bit, test x & 1 then shift right",
                    "Count how many bits are 1",
                    "Print the count",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What does (13 & 1) evaluate to?",
                options: ["0", "1", "13", "2"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["&", ">>", "scanf", "printf", "while"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "13", output: "Set Bits: 3" },
                { input: "255", output: "Set Bits: 8" },
                { input: "0", output: "Set Bits: 0" }
            ],
            description: "Read an integer and print 'Set Bits: X' counting its binary 1-bits."
        })
    },
    {
        id: 31,
        title: "String Manipulation",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "String Reversal",
                content: [
                    "Reversing a string swaps characters from both ends",
                    "Track the length with a manual loop or strlen",
                    "Loop while left < right, swapping pairs",
                ],
            },
            {
                title: "Reversing in Place",
                content: [
                    "Read a string into a buffer",
                    "Reverse the characters in place",
                    "Print the reversed string",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is the reverse of 'code'?",
                options: ["edoc", "deco", "doc", "code"],
                correctIndex: 0
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["char", "for", "[", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "code", output: "Reversed: edoc" },
                { input: "spy", output: "Reversed: yps" }
            ],
            description: "Read a string and print 'Reversed: X' with its characters reversed."
        })
    },
    {
        id: 32,
        title: "Matrix Transposition",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "2D Arrays",
                content: [
                    "int m[3][3] is a 3x3 grid",
                    "m[row][col] accesses a single cell",
                    "Nested loops iterate the whole grid",
                ],
            },
            {
                title: "Transpose a Grid",
                content: [
                    "Read a 2x2 matrix",
                    "Swap m[0][1] and m[1][0]",
                    "Print the transposed matrix",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is the transpose of [[1,2],[3,4]]?",
                options: ["[[1,3],[2,4]]", "[[1,2],[3,4]]", "[[4,3],[2,1]]", "[[4,2],[3,1]]"],
                correctIndex: 0
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "[", "for", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "1 2\n3 4", output: "1 3\n2 4" }
            ],
            description: "Read a 2x2 matrix (4 integers) and print its transpose as two space-separated rows."
        })
    },
    {
        id: 33,
        title: "Enum Protocol",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Enumerations",
                content: [
                    "enum defines a set of named constants",
                    "enum Day { MON, TUE, WED, THU, FRI, SAT, SUN };",
                    "Constants start at 0 by default",
                    "Switch on enum values for clean dispatch",
                ],
            },
            {
                title: "Dispatch a Day Code",
                content: [
                    "Read an integer 0-6",
                    "Cast it to the enum and switch",
                    "Print the day name",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "In enum { A, B, C }, what value does B have?",
                options: ["0", "1", "2", "3"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["enum", "switch", "case", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 110,
            testCases: [
                { input: "0", output: "Monday" },
                { input: "3", output: "Thursday" },
                { input: "6", output: "Sunday" }
            ],
            description: "Read an integer 0-6 and print the corresponding weekday (0=Monday ... 6=Sunday) using an enum + switch."
        })
    },
    {
        id: 34,
        title: "Callback Compass",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Function Pointers",
                content: [
                    "A function pointer stores a function's address",
                    "int (*op)(int, int) = add;",
                    "Call through the pointer: op(a, b)",
                    "Enables runtime behavior selection",
                ],
            },
            {
                title: "Selecting an Operation",
                content: [
                    "Define add and subtract functions",
                    "Point op at one of them",
                    "Invoke through the pointer and print",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What do function pointers enable?",
                options: ["Larger variables", "Runtime behavior selection", "Faster memory", "None of these"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "(*op)", "add", "sub", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            requiredOutput: "Result: 8",
            description: "Define add() and sub() functions, select via a function pointer, compute 5+3, and print 'Result: 8'."
        })
    },
    {
        id: 35,
        title: "Linked List Insertion",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Linked Lists",
                content: [
                    "A node holds data and a pointer to the next node",
                    "struct Node { int data; struct Node *next; };",
                    "Lists grow dynamically without pre-sized arrays",
                    "Insertion rewires pointers",
                ],
            },
            {
                title: "Counting Nodes",
                content: [
                    "Build a small linked list",
                    "Traverse with a while loop counting nodes",
                    "Print the total count",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What does the 'next' pointer of the last node point to?",
                options: ["Itself", "NULL", "The head", "Uninitialized"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["struct", "Node", "malloc", "next", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 120,
            requiredOutput: "Nodes: 3",
            description: "Create a linked list with 3 nodes (data 1,2,3), traverse it, and print 'Nodes: 3'."
        })
    },
    {
        id: 36,
        title: "Stack Protocol",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Stacks",
                content: [
                    "Last-In-First-Out (LIFO) data structure",
                    "push adds to the top, pop removes from the top",
                    "top tracks the current position",
                    "Underflow: popping an empty stack",
                ],
            },
            {
                title: "Array Stack",
                content: [
                    "Push 10 and 20, then pop once",
                    "The remaining top is 10",
                    "Print the top value",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "If you push 1 then 2 then pop, what do you get?",
                options: ["1", "2", "undefined", "0"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "top", "push", "pop", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 110,
            requiredOutput: "Top: 10",
            description: "Implement an array-backed stack. Push 10 and 20, pop once, and print 'Top: 10'."
        })
    },
    {
        id: 37,
        title: "Queue Protocol",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Queues",
                content: [
                    "First-In-First-Out (FIFO) data structure",
                    "enqueue adds to the rear, dequeue removes from the front",
                    "Circular arrays reuse freed slots",
                    "front and rear indices track the bounds",
                ],
            },
            {
                title: "Circular Queue",
                content: [
                    "Enqueue 5 and 7",
                    "Dequeue once",
                    "Print the new front",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Enqueue 5 then 7, dequeue once — what is the new front?",
                options: ["5", "7", "empty", "12"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "front", "rear", "enqueue", "dequeue", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 120,
            requiredOutput: "Front: 7",
            description: "Implement a circular queue. Enqueue 5 and 7, dequeue once, and print 'Front: 7'."
        })
    },
    {
        id: 38,
        title: "String Tokenization",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Tokenizing Input",
                content: [
                    "Split text into tokens by spaces",
                    "Track whether we are inside a word",
                    "Count transitions from space to letter",
                    "Classic parsing technique",
                ],
            },
            {
                title: "Counting Words",
                content: [
                    "Read a sentence",
                    "Count space-separated words",
                    "Print the word count",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "How many words are in 'red fox jumps'?",
                options: ["2", "3", "4", "5"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["char", "for", " ", "printf", "fgets"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "red fox jumps", output: "Words: 3" },
                { input: "spy network", output: "Words: 2" }
            ],
            description: "Read a sentence with fgets and print 'Words: X' counting the space-separated words."
        })
    },
    {
        id: 39,
        title: "Sorting Protocol",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Bubble Sort",
                content: [
                    "Repeatedly swap adjacent out-of-order pairs",
                    "Larger values bubble to the end each pass",
                    "After n-1 passes the array is sorted",
                    "O(n^2) but simple and instructive",
                ],
            },
            {
                title: "Sort the Payload",
                content: [
                    "Read n then n integers",
                    "Sort them ascending with bubble sort",
                    "Print the sorted sequence",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "In one bubble-sort pass over [5,2], what happens?",
                options: ["Nothing", "5 and 2 swap", "They double", "2 moves before 5"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["for", "int", "[", "scanf", "printf", "if"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 120,
            testCases: [
                { input: "4\n4 3 2 1", output: "1 2 3 4" },
                { input: "3\n9 5 7", output: "5 7 9" }
            ],
            description: "Read n then n integers, bubble-sort them ascending, and print the sorted list space-separated."
        })
    },
    {
        id: 40,
        title: "Binary Search Protocol",
        difficulty: "MEDIUM",
        aura: 120,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Binary Search",
                content: [
                    "Works only on sorted arrays",
                    "Repeatedly halve the search range",
                    "Compare the middle against the target",
                    "O(log n) — vastly faster than linear",
                ],
            },
            {
                title: "Locate a Key",
                content: [
                    "Search the sorted array [2,4,6,8,10]",
                    "Report the 0-based index of the target",
                    "Print 'Found at: X' or 'Not Found'",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What precondition does binary search require?",
                options: ["Unsorted data", "Sorted data", "Strings only", "No precondition"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "while", "mid", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 110,
            testCases: [
                { input: "6", output: "Found at: 2" },
                { input: "11", output: "Not Found" }
            ],
            description: "Binary-search the sorted array [2,4,6,8,10] for the input. Print 'Found at: X' (0-based) or 'Not Found'."
        })
    },
    {
        id: 41,
        title: "Deep Function Injection",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Recursive Exponentiation",
                content: [
                    "base^exp with recursion: pow(b,0)=1",
                    "pow(b,e) = b * pow(b,e-1)",
                    "Careful: very deep recursion can overflow the stack",
                ],
            },
            {
                title: "Computing Powers",
                content: [
                    "Read base and exponent",
                    "Compute base^exponent recursively",
                    "Print the result",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is 2^10?",
                options: ["512", "1024", "2048", "100"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "pow", "return", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 110,
            testCases: [
                { input: "2 10", output: "Power: 1024" },
                { input: "3 4", output: "Power: 81" }
            ],
            description: "Write a recursive power function and print 'Power: X' for base^exp."
        })
    },
    {
        id: 42,
        title: "Buffer Overflow Audit",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Buffer Safety",
                content: [
                    "gets() is dangerous — never use it",
                    "fgets(buf, size, stdin) limits what is read",
                    "Always leave room for the null terminator",
                    "Read the integer with scanf, then drain the newline",
                ],
            },
            {
                title: "Secure Read",
                content: [
                    "Read a string with fgets into a bounded buffer",
                    "Trim the trailing newline",
                    "Report the string length",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Why is gets() unsafe?",
                options: [
                    "It is too slow",
                    "It can overflow the buffer",
                    "It only reads numbers",
                    "It crashes always"
                ],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["fgets", "char", "sizeof", "strlen", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 110,
            testCases: [
                { input: "agent", output: "Length: 5" },
                { input: "undercover", output: "Length: 10" }
            ],
            description: "Read a string safely with fgets, trim the newline, and print 'Length: X'."
        })
    },
    {
        id: 43,
        title: "Macro Inline Optimization",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Preprocessor Macros",
                content: [
                    "#define substitutes text at compile time",
                    "#define SQUARE(x) ((x) * (x))",
                    "Parenthesize arguments to avoid precedence bugs",
                    "No runtime cost — pure compile-time expansion",
                ],
            },
            {
                title: "Squaring with a Macro",
                content: [
                    "Define SQUARE(x) and CUBE(x)",
                    "Compute the square of an input",
                    "Print the result",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Why parenthesize macro arguments like ((x)*(x))?",
                options: ["Style only", "To avoid precedence bugs", "To slow it down", "Macros can't be parenthesized"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["#define", "SQUARE", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "9", output: "Square: 81" },
                { input: "12", output: "Square: 144" }
            ],
            description: "Define a SQUARE macro, read an integer, and print 'Square: X'."
        })
    },
    {
        id: 44,
        title: "XOR Cipher Decryption",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "XOR Ciphers",
                content: [
                    "XOR is reversible: (a ^ k) ^ k == a",
                    "Encrypt with c = plaintext ^ key",
                    "Decrypt with plaintext = c ^ key",
                    "The foundation of many real ciphers",
                ],
            },
            {
                title: "Decrypt a Byte",
                content: [
                    "Read a cipher value",
                    "XOR it with the key 42",
                    "Print the decrypted value",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is (100 ^ 42) ^ 42?",
                options: ["42", "100", "58", "0"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["^", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 70,
            testCases: [
                { input: "78", output: "Decrypted: 100" },
                { input: "0", output: "Decrypted: 42" }
            ],
            description: "Read a cipher integer, XOR it with key 42, and print 'Decrypted: X'."
        })
    },
    {
        id: 45,
        title: "Linked List Reverse",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Reversing a List",
                content: [
                    "Reverse pointer direction between consecutive nodes",
                    "Track prev, current, and next as you walk",
                    "The old tail becomes the new head",
                    "Rewiring pointers is the heart of list manipulation",
                ],
            },
            {
                title: "Reverse a Chain",
                content: [
                    "Build a 3-node list 1->2->3",
                    "Reverse the links",
                    "Print the new head's data",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "After reversing 1->2->3, what is the new head?",
                options: ["1", "2", "3", "NULL"],
                correctIndex: 2
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["struct", "Node", "reverse", "malloc", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 130,
            requiredOutput: "Head: 3",
            description: "Build list 1->2->3, reverse it, and print 'Head: 3' (the new head's data)."
        })
    },
    {
        id: 46,
        title: "Dynamic 2D Matrix",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Pointer-to-Pointer Grids",
                content: [
                    "int **m allocates an array of row pointers",
                    "Each row is malloc'd separately",
                    "m[row][col] accesses a cell",
                    "Free every row, then free the row array",
                ],
            },
            {
                title: "Diagonal Trace",
                content: [
                    "Allocate a 3x3 matrix",
                    "Sum the main diagonal (row == col)",
                    "Print the trace, then free everything",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "How do you free a dynamic 2D matrix?",
                options: [
                    "free(m) only",
                    "Free each row, then free(m)",
                    "It frees itself",
                    "free(m[0]) only"
                ],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "**", "malloc", "for", "free", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 130,
            requiredOutput: "Trace: 15",
            description: "Allocate a 3x3 matrix [[1,2,3],[4,5,6],[7,8,9]], sum the main diagonal, print 'Trace: 15', and free."
        })
    },
    {
        id: 47,
        title: "Recursive Digit Decay",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Digital Root",
                content: [
                    "Repeatedly sum the digits until one digit remains",
                    "38 -> 3+8=11 -> 1+1=2",
                    "Also computable as 1 + (n-1) % 9",
                ],
            },
            {
                title: "Reduce to a Single Digit",
                content: [
                    "Read an integer",
                    "Compute its digital root recursively",
                    "Print the result",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "What is the digital root of 38?",
                options: ["11", "2", "3", "8"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "scanf", "printf", "%", "/"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "38", output: "Root: 2" },
                { input: "987", output: "Root: 6" }
            ],
            description: "Read an integer and print 'Root: X' — its digital root (single digit)."
        })
    },
    {
        id: 48,
        title: "Bit Mastery",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Bit Reversal",
                content: [
                    "Reverse the bit order of a byte",
                    "Extract bits from the right and build left-to-right",
                    "result = (result << 1) | (n & 1)",
                ],
            },
            {
                title: "Reverse an 8-bit Pattern",
                content: [
                    "Read a value 0-255",
                    "Reverse its 8 bits",
                    "Print the reversed value",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Reversing bits of 1 (00000001) gives?",
                options: ["1", "128", "255", "0"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["<<", "|", "&", ">>", "scanf", "printf", "for"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "1", output: "Reversed: 128" },
                { input: "255", output: "Reversed: 255" },
                { input: "10", output: "Reversed: 80" }
            ],
            description: "Read an 8-bit value (0-255) and print 'Reversed: X' with its bits reversed."
        })
    },
    {
        id: 49,
        title: "Selection Sort Mastery",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Selection Sort",
                content: [
                    "Find the smallest element and place it first",
                    "Repeat for the remaining unsorted portion",
                    "Uses fewer swaps than bubble sort",
                    "Also O(n^2) but a different strategy",
                ],
            },
            {
                title: "Sort the Data",
                content: [
                    "Read n then n integers",
                    "Selection-sort ascending",
                    "Print the sorted sequence",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Selection sort repeatedly selects the ___ element.",
                options: ["largest only", "minimum from unsorted part", "random", "middle"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["for", "int", "[", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 120,
            testCases: [
                { input: "5\n5 4 3 2 1", output: "1 2 3 4 5" },
                { input: "4\n7 1 9 3", output: "1 3 7 9" }
            ],
            description: "Read n then n integers, selection-sort ascending, and print the sorted list."
        })
    },
    {
        id: 50,
        title: "Run-Length Encoding",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Run-Length Encoding",
                content: [
                    "Compress runs of identical characters",
                    "'aaabbc' -> '3a2b1c'",
                    "Store count followed by the character",
                    "Great for repetitive data streams",
                ],
            },
            {
                title: "Encode a Stream",
                content: [
                    "Read a string",
                    "Walk through counting consecutive repeats",
                    "Print count+char tokens",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "The RLE of 'hhhhi' is?",
                options: ["4h1i", "h4i1", "3h1i", "4hi"],
                correctIndex: 0
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["char", "for", "while", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "aaabbc", output: "3a2b1c" },
                { input: "hhhhi", output: "4h1i" }
            ],
            description: "Read a string and print its run-length encoding as count+char tokens."
        })
    },
    {
        id: 51,
        title: "Custom Hash Function",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Hashing",
                content: [
                    "A hash maps arbitrary data to a fixed-size value",
                    "Sum characters and take modulo a prime",
                    "hash = (hash + c) % 97",
                    "Good hashes spread values evenly",
                ],
            },
            {
                title: "Hash a Codename",
                content: [
                    "Read a string",
                    "Accumulate character values with modulo",
                    "Print the hash",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Why modulo a prime in hashing?",
                options: ["Faster loops", "Better distribution", "Smaller strings", "It is mandatory"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["char", "for", "%", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 90,
            testCases: [
                { input: "cat", output: "Hash: 67" },
                { input: "dog", output: "Hash: 63" }
            ],
            description: "Read a string and print 'Hash: X' = sum of character codes modulo 97."
        })
    },
    {
        id: 52,
        title: "Tower of Hanoi",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Tower of Hanoi",
                content: [
                    "Move disks from peg A to peg C using peg B",
                    "Never place a larger disk on a smaller one",
                    "Recursive solution: move n-1, move 1, move n-1",
                    "Total moves = 2^n - 1",
                ],
            },
            {
                title: "Logging Moves",
                content: [
                    "For 3 disks, print each move",
                    "Format: 'Move disk N from X to Y'",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "How many moves solve Hanoi with 3 disks?",
                options: ["5", "7", "8", "6"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["void", "hanoi", "return", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "3", output: "Move disk 1 from A to C\nMove disk 2 from A to B\nMove disk 1 from C to B\nMove disk 3 from A to C\nMove disk 1 from B to A\nMove disk 2 from B to C\nMove disk 1 from A to C" }
            ],
            description: "Solve Tower of Hanoi for n=3 disks, printing each move from peg A to C via B."
        })
    },
    {
        id: 53,
        title: "Callback Matrix",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Applying Callbacks",
                content: [
                    "Pass a function pointer to a processing routine",
                    "The routine applies it to every element",
                    "Decouples the traversal from the operation",
                ],
            },
            {
                title: "Square Every Cell",
                content: [
                    "Define a square function",
                    "Apply it to each element of a 2x2 grid",
                    "Print the transformed grid",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Applying square() to [[1,2],[3,4]] yields?",
                options: ["[[1,4],[9,16]]", "[[1,2],[3,4]]", "[[2,4],[6,8]]", "[[1,4],[9,8]]"],
                correctIndex: 0
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "(*fn)", "apply", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 110,
            requiredOutput: "1 4\n9 16",
            description: "Apply a square callback to the 2x2 grid [[1,2],[3,4]] and print '1 4\\n9 16'."
        })
    },
    {
        id: 54,
        title: "Nested Struct Vault",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Nested Structures",
                content: [
                    "Structs can contain other structs",
                    "Access nested fields with chained dots",
                    "agent.info.codename",
                    "Models layered real-world data",
                ],
            },
            {
                title: "Model an Operative",
                content: [
                    "struct Info { char codename[20]; int clearance; };",
                    "struct Agent { struct Info info; int id; };",
                    "Populate and print the nested fields",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "How do you access a nested struct field?",
                options: ["agent->info", "agent.info.codename", "agent::codename", "agent.codename.info"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["struct", "char", "codename", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 110,
            requiredOutput: "Codename: Wolf Clearance: 7",
            description: "Define a nested struct with codename 'Wolf' and clearance 7. Print 'Codename: Wolf Clearance: 7'."
        })
    },
    {
        id: 55,
        title: "Memory Arena",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Struct Arrays on the Heap",
                content: [
                    "Allocate an array of structs with malloc",
                    "ptr[i].field accesses elements",
                    "Each element holds independent data",
                    "Free the whole array at once",
                ],
            },
            {
                title: "Provision Agents",
                content: [
                    "Create an array of 3 agent structs",
                    "Assign ids 1, 2, 3",
                    "Print the last id, then free",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "To allocate 3 struct Agent, you call?",
                options: ["malloc(3)", "malloc(3 * sizeof(struct Agent))", "malloc(sizeof(Agent))", "calloc(3, 0)"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["struct", "malloc", "sizeof", "->", "free", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 120,
            requiredOutput: "Last Agent: 3",
            description: "Allocate an array of 3 agent structs with ids 1,2,3. Print 'Last Agent: 3' and free."
        })
    },
    {
        id: 56,
        title: "Circular Buffer",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Ring Buffers",
                content: [
                    "A fixed-capacity buffer that wraps around",
                    "Write index advances with modulo",
                    "Overflow overwrites the oldest slot",
                    "Used in audio, IO, and telemetry",
                ],
            },
            {
                title: "Wrap Around",
                content: [
                    "Capacity 3, write 1,2,3,4",
                    "The 4 overwrites the 1",
                    "Read back the buffer contents",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Capacity-3 buffer holding 1,2,3 — writing 4 does what?",
                options: ["Drops 4", "Overwrites 1", "Overwrites 3", "Doubles capacity"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["int", "%", "buffer", "write", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 120,
            requiredOutput: "Buffer: 4 2 3",
            description: "Capacity-3 ring buffer. Write 1,2,3,4 (4 overwrites 1). Print 'Buffer: 4 2 3'."
        })
    },
    {
        id: 57,
        title: "Matrix Multiply",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Matrix Multiplication",
                content: [
                    "Each cell is the dot product of a row and column",
                    "result[i][j] = sum over k of a[i][k]*b[k][j]",
                    "Requires triple-nested loops",
                ],
            },
            {
                title: "Multiply 2x2 Grids",
                content: [
                    "Read two 2x2 matrices",
                    "Compute the product",
                    "Print the result matrix",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "To multiply two 2x2 matrices you need how many nested loops?",
                options: ["2", "3", "4", "1"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["for", "int", "[", "scanf", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 130,
            testCases: [
                { input: "1 2\n3 4\n1 0\n0 1", output: "1 2\n3 4" }
            ],
            description: "Read two 2x2 matrices and print their product."
        })
    },
    {
        id: 58,
        title: "Substring Search",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Manual String Search",
                content: [
                    "Slide the needle across the haystack",
                    "Compare character-by-character at each offset",
                    "Return the first matching index or -1",
                    "No strstr — implement it yourself",
                ],
            },
            {
                title: "Find the Needle",
                content: [
                    "Search 'hello world' for the input word",
                    "Print the 0-based index or 'Not Found'",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Where does 'lo' first appear in 'hello'?",
                options: ["1", "2", "3", "0"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["char", "for", "haystack", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 110,
            testCases: [
                { input: "hello", output: "Found at: 0" },
                { input: "world", output: "Found at: 6" },
                { input: "zzz", output: "Not Found" }
            ],
            description: "Search 'hello world' for the input substring (manual matching). Print 'Found at: X' or 'Not Found'."
        })
    },
    {
        id: 59,
        title: "Palindrome Protocol",
        difficulty: "HARD",
        aura: 150,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "Palindromes",
                content: [
                    "A palindrome reads the same forwards and backwards",
                    "Compare characters from both ends inward",
                    "Stop early on any mismatch",
                ],
            },
            {
                title: "Verify a Secret Phrase",
                content: [
                    "Read a word",
                    "Check if it is a palindrome",
                    "Print 'Palindrome' or 'Not Palindrome'",
                ],
            },
        ]),
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "Which of these is a palindrome?",
                options: ["agent", "radar", "undercover", "code"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["char", "for", "while", "[", "printf"],
            forbiddenPatterns: ["// Agent, write your code here"],
            minLength: 100,
            testCases: [
                { input: "radar", output: "Palindrome" },
                { input: "code", output: "Not Palindrome" },
                { input: "level", output: "Palindrome" }
            ],
            description: "Read a word and print exactly 'Palindrome' or 'Not Palindrome'."
        })
    },
    {
        id: 60,
        title: "The Final Infiltration",
        difficulty: "HARD",
        aura: 200,
        language: "C",
        isLocked: true,
        teachingContent: JSON.stringify([
            {
                title: "The Final Infiltration",
                content: [
                    "This mission combines structs, arrays, and logic",
                    "Model an agent with an id and a score",
                    "Aggregate a team and print a report",
                    "You are cleared for the field, Agent.",
                ],
            },
            {
                title: "Build the Report",
                content: [
                    "struct Agent { int id; int score; };",
                    "Create a team of 3 agents",
                    "Compute and print the highest score",
                ],
            },
        ]),
        goal: "Define a struct Agent { int id; int score; }. Create an array of 3 agents, assign scores, and print the highest score as 'Top Score: X'.",
        startingCode: "#include <stdio.h>\n\nstruct Agent {\n    int id;\n    int score;\n};\n\nint main() {\n    // Agent, assemble your team and find the top score.\n    return 0;\n}",
        mcqContent: JSON.stringify([
            {
                id: 1,
                question: "To find the maximum score you compare each element against?",
                options: ["A fixed constant", "A running max variable", "The first only", "The array length"],
                correctIndex: 1
            }
        ]),
        validationRules: JSON.stringify({
            requiredKeywords: ["struct", "Agent", "score", "printf"],
            forbiddenPatterns: ["// Agent, assemble your team and find the top score"],
            minLength: 110,
            requiredOutput: "Top Score: 95",
            description: "Create an array of 3 agents (scores 85, 95, 70), print the highest as 'Top Score: 95'."
        })
    },
];

// This stores the static textual UI content for missions. Next.js can hot reload these values.
export const missionDetails: Record<number, { description: string; briefing: string }> = {
    1: {
        description: "Learn how to use the printf function in C to display output on the screen. In this task, students will learn how to include the standard input/output library and use printf to print a message to the terminal. The expected output from the program will be: \"Hello Agent \"",
        briefing: "Learn how to use the printf function in C to display output on the screen. In this task, students will learn how to include the standard input/output library and use printf to print a message to the terminal. The expected output from the program will be: \"Hello Agent \"",
    },
    2: {
        description: "An enemy agent has scrambled the variable declarations in our communication module. Data types are mismatched and values are corrupted. Restore order by demonstrating mastery of C data types and variable declarations.",
        briefing: "I have to show chief, that how capable I am. I have to track the ID of Agent platypus. Using scanf(\"%d\", &id) I can do this.",
    },
    3: {
        description: "The agency's security gate system has malfunctioned. The conditional logic controlling access doors is broken — some doors stay open when they should be locked. Fix the control flow to restore proper gate operation.",
        briefing: "IMPRESSIVE!! The agency has been waiting for someone like you. Register now by Entering printing the name of you and enter the batch code 9870— Agent Platypus needs a partner on the field ",
    },
    4: {
        description: "You are a secret agent trying to access a classified system. The system password is 'agent007'. You have maximum 3 attempts. Use a loop to allow repeated password attempts. If the password is correct, print 'Access Granted'. If incorrect, print 'Wrong Password'. After 3 failed attempts, print 'System Locked'.",
        briefing: "Agent, a classified terminal has been discovered at the enemy base. The password is 'agent007' — but the system only allows 3 attempts before permanent lockdown. Write a loop-based access protocol: read the password each attempt, print 'Access Granted' if correct (and break), 'Wrong Password' if wrong, and 'System Locked' after 3 failures.",
    },
    5: {
        description: "The agency's codebase has become a monolithic mess — thousands of lines in a single file with duplicated logic everywhere. Refactor the system by extracting reusable functions with proper signatures and return types.",
        briefing: "Learn to declare and define functions in C. Understand parameter passing (by value vs by reference), return types, function prototypes, and recursive functions. Write modular, reusable code.",
    },
    6: {
        description: "The encryption module needs arithmetic verification. Use C arithmetic operators to compute a checksum for the transmission.",
        briefing: "Agent, the cipher requires a checksum. Read two operands and broadcast their sum. Print 'Sum: X'.",
    },
    7: {
        description: "HQ needs a grading system for new recruits. Build conditional logic that classifies scores into letter grades.",
        briefing: "Read a recruit's score and route it through conditional branches. Print the correct letter grade.",
    },
    8: {
        description: "Calendar protocols require correct leap-year detection. Combine logical operators to evaluate the standard leap-year rule.",
        briefing: "The year database is corrupt. Read a year and verify it against the leap-year rule. Print 'Leap Year' or 'Not Leap Year'.",
    },
    9: {
        description: "The radio module routes signal codes through a switch board. Replace the tangled if/else chains with a clean switch statement.",
        briefing: "Route the incoming signal code through a switch. Map 1→'One', 2→'Two', 3→'Three', else 'Unknown Signal'.",
    },
    10: {
        description: "Extract sequential intelligence from a stream of natural numbers. Use a while loop to accumulate a running total.",
        briefing: "Read n and sum the natural numbers from 1 to n with a while loop. Print 'Sum: X'.",
    },
    11: {
        description: "The transmitter needs a sequenced burst. Use a for loop to emit the number line 1..n.",
        briefing: "Read n and emit the sequence 1 2 3 ... n, space-separated, using a for loop.",
    },
    12: {
        description: "The feed parser must stop safely at the end-of-stream marker. Use break to halt accumulation at zero.",
        briefing: "Read integers and sum them, breaking on 0. Print 'Sum: X'.",
    },
    13: {
        description: "Surveillance grids need a multiplication table overlay. Use nested loops to render a table for any input.",
        briefing: "Read n and print its multiplication table from 1 to 10 using nested loops.",
    },
    14: {
        description: "Every agent needs a signature routine. Build a void function that broadcasts a standard greeting.",
        briefing: "Define void greet() and call it from main(). Output 'Hello Agent, ready for duty'.",
    },
    15: {
        description: "Field reports need a max function. Build a reusable routine that returns the larger of two values.",
        briefing: "Define a max function, read two integers, and print 'Max: X'.",
    },
    16: {
        description: "Scope discipline prevents data leaks. Demonstrate static variable persistence inside a function.",
        briefing: "Use a static counter in a function called twice from main(). Output 'Count: 1 Count: 2'.",
    },
    17: {
        description: "Intercept a linear data stream and aggregate it. Store values in an array and compute the total.",
        briefing: "Read n then n integers into an array, sum them, and print 'Sum: X'.",
    },
    18: {
        description: "Analyze intercepted text for vowel density. Traverse a string and count its vowels.",
        briefing: "Read a string and print 'Vowels: X' counting a, e, i, o, u.",
    },
    19: {
        description: "A pointer is your surgical instrument. Swap two values through dereferenced pointers.",
        briefing: "Read two integers, swap them using pointers, and print 'A: X B: Y'.",
    },
    20: {
        description: "The heap is a controlled environment. Allocate, assign, verify, and release a single integer.",
        briefing: "Allocate one int with malloc, set it to 42, print it, and free it. Output '42'.",
    },
    21: {
        description: "Multi-layer decisions require nested logic. Determine the largest of three operatives' scores.",
        briefing: "Read three integers and print 'Max: X' for the largest.",
    },
    22: {
        description: "Prime keys are the backbone of encryption. Optimize a primality check with an efficient loop.",
        briefing: "Read an integer and print exactly 'Prime' or 'Not Prime'.",
    },
    23: {
        description: "Walk memory without an index. Traverse an array using pointer arithmetic.",
        briefing: "Read n then n integers, sum them using pointers, and print 'Sum: X'.",
    },
    24: {
        description: "Model the operatives with structures. Group related fields into a single blueprinted type.",
        briefing: "Define a struct with name and id, initialize to 'Platypus' / 007, print 'Agent: Platypus ID: 007'.",
    },
    25: {
        description: "Compose formatted intelligence without printing directly. Use sprintf to build a report buffer.",
        briefing: "Read a codename and clearance, compose with sprintf, and print the report.",
    },
    26: {
        description: "The heap can grow to fit the payload. Allocate an array at runtime and aggregate it.",
        briefing: "Allocate an array of n ints with malloc, sum them, print 'Sum: X', then free.",
    },
    27: {
        description: "Recursion unwraps nested signals. Compute a factorial with a recursive function.",
        briefing: "Write a recursive factorial and print 'Factorial: X'.",
    },
    28: {
        description: "The heap is hostile to the unprepared. Audit allocations with NULL guards.",
        briefing: "Allocate with malloc, check NULL, print 'Memory Allocated' on success, then free.",
    },
    29: {
        description: "The Fibonacci sequence powers the signal generator. Master recursion with a classic definition.",
        briefing: "Write a recursive fibonacci and print 'Fibonacci: X'.",
    },
    30: {
        description: "Bit fields hide secrets in plain sight. Count the set bits of an intercepted key.",
        briefing: "Read an integer and print 'Set Bits: X' counting binary 1-bits.",
    },
    31: {
        description: "Reversing a buffer is a core manipulation skill. Rewrite a string in place.",
        briefing: "Read a string and print 'Reversed: X'.",
    },
    32: {
        description: "Rebuild a 2D grid by transposing rows and columns. Master nested array access.",
        briefing: "Read a 2x2 matrix and print its transpose.",
    },
    33: {
        description: "Enumeration gives names to states. Route a day code through a typed enum + switch.",
        briefing: "Read 0-6 and print the weekday (0=Monday ... 6=Sunday) via enum + switch.",
    },
    34: {
        description: "Function pointers let behavior be chosen at runtime. Wire a callback compass.",
        briefing: "Define add/sub, select via function pointer, compute 5+3, print 'Result: 8'.",
    },
    35: {
        description: "Linked lists chain data without fixed sizes. Insert nodes and count the chain.",
        briefing: "Build a 3-node list (1,2,3), traverse it, print 'Nodes: 3'.",
    },
    36: {
        description: "LIFO discipline is a systems staple. Implement an array-backed stack.",
        briefing: "Push 10 and 20, pop once, print 'Top: 10'.",
    },
    37: {
        description: "FIFO dispatch keeps streams fair. Implement a circular queue.",
        briefing: "Enqueue 5 and 7, dequeue once, print 'Front: 7'.",
    },
    38: {
        description: "Tokenize a raw intelligence stream. Count the words in a sentence.",
        briefing: "Read a sentence with fgets and print 'Words: X'.",
    },
    39: {
        description: "Order is a weapon. Bubble-sort an out-of-order payload.",
        briefing: "Read n then n ints, bubble-sort ascending, print the list.",
    },
    40: {
        description: "Logarithmic search beats linear brute force. Binary-search a sorted array.",
        briefing: "Binary-search [2,4,6,8,10] for the input. Print 'Found at: X' or 'Not Found'.",
    },
    41: {
        description: "Inject exponential computing power. Write a recursive exponentiation routine.",
        briefing: "Read base and exponent, compute recursively, print 'Power: X'.",
    },
    42: {
        description: "Legacy input routines are a liability. Audit and patch unsafe buffer reads.",
        briefing: "Read a string safely with fgets, trim the newline, print 'Length: X'.",
    },
    43: {
        description: "Compile-time constants cost nothing at runtime. Optimize with macros.",
        briefing: "Define SQUARE(x), read an int, print 'Square: X'.",
    },
    44: {
        description: "XOR ciphers are reversible and everywhere. Decrypt an intercepted byte.",
        briefing: "Read a cipher integer, XOR with key 42, print 'Decrypted: X'.",
    },
    45: {
        description: "Rewire the chain end-to-end. Reverse a linked list's pointers.",
        briefing: "Build 1->2->3, reverse it, print 'Head: 3'.",
    },
    46: {
        description: "Pointer-to-pointer grids scale to any size. Allocate and audit a dynamic matrix.",
        briefing: "Allocate a 3x3 matrix, sum the main diagonal, print 'Trace: 15', and free.",
    },
    47: {
        description: "Decay large payloads to a single digit. Compute the digital root.",
        briefing: "Read an integer and print 'Root: X' — its digital root.",
    },
    48: {
        description: "Master raw bit manipulation. Reverse the bit order of a byte.",
        briefing: "Read a value 0-255 and print 'Reversed: X' with bits reversed.",
    },
    49: {
        description: "Selection sorting minimizes swaps. Master quadratic selection sort.",
        briefing: "Read n then n ints, selection-sort ascending, print the list.",
    },
    50: {
        description: "Compress repetitive streams. Encode runs of identical characters.",
        briefing: "Read a string and print its RLE as count+char tokens.",
    },
    51: {
        description: "Design a minimal hash for keyed lookups. Hash a codename with modulo arithmetic.",
        briefing: "Read a string and print 'Hash: X' = sum of codes modulo 97.",
    },
    52: {
        description: "The classic recursion puzzle. Log every move of Tower of Hanoi.",
        briefing: "Solve Hanoi for n=3, printing each move from A to C via B.",
    },
    53: {
        description: "Decouple traversal from operation. Apply a callback across a grid.",
        briefing: "Apply a square callback to [[1,2],[3,4]] and print '1 4\\n9 16'.",
    },
    54: {
        description: "Layer your data with nested structs. Model an operative's full dossier.",
        briefing: "Define a nested struct with codename 'Wolf' / clearance 7. Print 'Codename: Wolf Clearance: 7'.",
    },
    55: {
        description: "Provision many agents at once. Allocate and audit a struct array on the heap.",
        briefing: "Allocate an array of 3 agents (ids 1,2,3), print 'Last Agent: 3', and free.",
    },
    56: {
        description: "Ring buffers wrap around and overwrite the oldest data. Build a capacity-3 buffer.",
        briefing: "Write 1,2,3,4 into a capacity-3 ring (4 overwrites 1). Print 'Buffer: 4 2 3'.",
    },
    57: {
        description: "Triple-nested loops power matrix products. Multiply two 2x2 grids.",
        briefing: "Read two 2x2 matrices and print their product.",
    },
    58: {
        description: "No libc shortcuts allowed. Implement substring search by hand.",
        briefing: "Search 'hello world' for the input. Print 'Found at: X' or 'Not Found'.",
    },
    59: {
        description: "Mirrored phrases verify identity. Check a word against its reversal.",
        briefing: "Read a word and print exactly 'Palindrome' or 'Not Palindrome'.",
    },
    60: {
        description: "The final mission unites structs, arrays, and logic into a complete intelligence report.",
        briefing: "Define struct Agent { int id; int score; }, create a team of 3 (scores 85, 95, 70), and print 'Top Score: 95'.",
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
    1: { id: 1, title: "The System Access", requiredOutput: "Hello Agent" },
    2: { id: 2, title: "Variable Infiltration", testCases: [
        { input: "7", expectedOutput: "You entered: 7" },
        { input: "42", expectedOutput: "You entered: 42" },
    ] },
    3: { id: 3, title: "Control Flow Lockdown", testCases: [
        { input: "4", expectedOutput: "Even" },
        { input: "5", expectedOutput: "Odd" },
        { input: "0", expectedOutput: "Even" },
        { input: "-3", expectedOutput: "Odd" },
    ] },
    4: { id: 4, title: "Loop Protocol", testCases: [
        { input: "agent007", expectedOutput: "Access Granted" },
        { input: "wrong\nwrong\nwrong", expectedOutput: "Wrong Password\nWrong Password\nSystem Locked" },
        { input: "wrong\nagent007", expectedOutput: "Wrong Password\nAccess Granted" },
    ] },
    5: { id: 5, title: "Function Assembly", testCases: [
        { input: "4 6", expectedOutput: "Sum: 10" },
        { input: "12 30", expectedOutput: "Sum: 42" },
        { input: "-5 8", expectedOutput: "Sum: 3" },
    ] },
    6: { id: 6, title: "Arithmetic Protocol", testCases: [
        { input: "8 5", expectedOutput: "Sum: 13" },
        { input: "20 22", expectedOutput: "Sum: 42" },
    ] },
    7: { id: 7, title: "Operative Decisions", testCases: [
        { input: "92", expectedOutput: "Grade A" },
        { input: "80", expectedOutput: "Grade B" },
        { input: "65", expectedOutput: "Grade C" },
        { input: "40", expectedOutput: "Grade F" },
    ] },
    8: { id: 8, title: "Secure Logic Gates", testCases: [
        { input: "2000", expectedOutput: "Leap Year" },
        { input: "1900", expectedOutput: "Not Leap Year" },
        { input: "2024", expectedOutput: "Leap Year" },
        { input: "2023", expectedOutput: "Not Leap Year" },
    ] },
    9: { id: 9, title: "Switching Frequencies", testCases: [
        { input: "1", expectedOutput: "One" },
        { input: "2", expectedOutput: "Two" },
        { input: "3", expectedOutput: "Three" },
        { input: "9", expectedOutput: "Unknown Signal" },
    ] },
    10: { id: 10, title: "Iterative Extraction", testCases: [
        { input: "5", expectedOutput: "Sum: 15" },
        { input: "10", expectedOutput: "Sum: 55" },
    ] },
    11: { id: 11, title: "Loop Encryption", testCases: [
        { input: "3", expectedOutput: "1 2 3" },
        { input: "5", expectedOutput: "1 2 3 4 5" },
    ] },
    12: { id: 12, title: "Breakout Protocols", testCases: [
        { input: "5 10 0", expectedOutput: "Sum: 15" },
        { input: "1 2 3 4 0", expectedOutput: "Sum: 10" },
    ] },
    13: { id: 13, title: "Nested Surveillance", testCases: [
        { input: "2", expectedOutput: "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20" },
    ] },
    14: { id: 14, title: "Agent Signature", requiredOutput: "Hello Agent, ready for duty" },
    15: { id: 15, title: "Data Return Payload", testCases: [
        { input: "3 9", expectedOutput: "Max: 9" },
        { input: "14 7", expectedOutput: "Max: 14" },
    ] },
    16: { id: 16, title: "Scope & Lifetime", requiredOutput: "Count: 1 Count: 2" },
    17: { id: 17, title: "Array Grid Infiltration", testCases: [
        { input: "4\n1 2 3 4", expectedOutput: "Sum: 10" },
        { input: "3\n5 10 15", expectedOutput: "Sum: 30" },
    ] },
    18: { id: 18, title: "Operative Strings", testCases: [
        { input: "agent", expectedOutput: "Vowels: 2" },
        { input: "spy", expectedOutput: "Vowels: 0" },
    ] },
    19: { id: 19, title: "Pointer Intel Retrieval", testCases: [
        { input: "5 3", expectedOutput: "A: 3 B: 5" },
        { input: "10 20", expectedOutput: "A: 20 B: 10" },
    ] },
    20: { id: 20, title: "Secure Memory Allocator", requiredOutput: "42" },
    21: { id: 21, title: "Advanced Control Logic", testCases: [
        { input: "3 9 5", expectedOutput: "Max: 9" },
        { input: "10 2 8", expectedOutput: "Max: 10" },
    ] },
    22: { id: 22, title: "Loop Optimization Protocol", testCases: [
        { input: "7", expectedOutput: "Prime" },
        { input: "9", expectedOutput: "Not Prime" },
        { input: "2", expectedOutput: "Prime" },
        { input: "1", expectedOutput: "Not Prime" },
    ] },
    23: { id: 23, title: "Pointer Arithmetic", testCases: [
        { input: "4\n1 2 3 4", expectedOutput: "Sum: 10" },
        { input: "3\n7 8 9", expectedOutput: "Sum: 24" },
    ] },
    24: { id: 24, title: "Struct Blueprinting", requiredOutput: "Agent: Platypus ID: 007" },
    25: { id: 25, title: "Formatted Intel Report", testCases: [
        { input: "Fox 5", expectedOutput: "Codename: Fox | Clearance: 5" },
        { input: "Owl 2", expectedOutput: "Codename: Owl | Clearance: 2" },
    ] },
    26: { id: 26, title: "Dynamic Grid Buffer", testCases: [
        { input: "4\n2 4 6 8", expectedOutput: "Sum: 20" },
        { input: "3\n1 1 1", expectedOutput: "Sum: 3" },
    ] },
    27: { id: 27, title: "Recursive Signal Decryptor", testCases: [
        { input: "5", expectedOutput: "Factorial: 120" },
        { input: "0", expectedOutput: "Factorial: 1" },
        { input: "6", expectedOutput: "Factorial: 720" },
    ] },
    28: { id: 28, title: "Memory Infiltration", requiredOutput: "Memory Allocated" },
    29: { id: 29, title: "Recursion Master", testCases: [
        { input: "6", expectedOutput: "Fibonacci: 8" },
        { input: "10", expectedOutput: "Fibonacci: 55" },
    ] },
    30: { id: 30, title: "Bitwise Masking Protocol", testCases: [
        { input: "13", expectedOutput: "Set Bits: 3" },
        { input: "255", expectedOutput: "Set Bits: 8" },
        { input: "0", expectedOutput: "Set Bits: 0" },
    ] },
    31: { id: 31, title: "String Manipulation", testCases: [
        { input: "code", expectedOutput: "Reversed: edoc" },
        { input: "spy", expectedOutput: "Reversed: yps" },
    ] },
    32: { id: 32, title: "Matrix Transposition", testCases: [
        { input: "1 2\n3 4", expectedOutput: "1 3\n2 4" },
    ] },
    33: { id: 33, title: "Enum Protocol", testCases: [
        { input: "0", expectedOutput: "Monday" },
        { input: "3", expectedOutput: "Thursday" },
        { input: "6", expectedOutput: "Sunday" },
    ] },
    34: { id: 34, title: "Callback Compass", requiredOutput: "Result: 8" },
    35: { id: 35, title: "Linked List Insertion", requiredOutput: "Nodes: 3" },
    36: { id: 36, title: "Stack Protocol", requiredOutput: "Top: 10" },
    37: { id: 37, title: "Queue Protocol", requiredOutput: "Front: 7" },
    38: { id: 38, title: "String Tokenization", testCases: [
        { input: "red fox jumps", expectedOutput: "Words: 3" },
        { input: "spy network", expectedOutput: "Words: 2" },
    ] },
    39: { id: 39, title: "Sorting Protocol", testCases: [
        { input: "4\n4 3 2 1", expectedOutput: "1 2 3 4" },
        { input: "3\n9 5 7", expectedOutput: "5 7 9" },
    ] },
    40: { id: 40, title: "Binary Search Protocol", testCases: [
        { input: "6", expectedOutput: "Found at: 2" },
        { input: "11", expectedOutput: "Not Found" },
    ] },
    41: { id: 41, title: "Deep Function Injection", testCases: [
        { input: "2 10", expectedOutput: "Power: 1024" },
        { input: "3 4", expectedOutput: "Power: 81" },
    ] },
    42: { id: 42, title: "Buffer Overflow Audit", testCases: [
        { input: "agent", expectedOutput: "Length: 5" },
        { input: "undercover", expectedOutput: "Length: 10" },
    ] },
    43: { id: 43, title: "Macro Inline Optimization", testCases: [
        { input: "9", expectedOutput: "Square: 81" },
        { input: "12", expectedOutput: "Square: 144" },
    ] },
    44: { id: 44, title: "XOR Cipher Decryption", testCases: [
        { input: "78", expectedOutput: "Decrypted: 100" },
        { input: "0", expectedOutput: "Decrypted: 42" },
    ] },
    45: { id: 45, title: "Linked List Reverse", requiredOutput: "Head: 3" },
    46: { id: 46, title: "Dynamic 2D Matrix", requiredOutput: "Trace: 15" },
    47: { id: 47, title: "Recursive Digit Decay", testCases: [
        { input: "38", expectedOutput: "Root: 2" },
        { input: "987", expectedOutput: "Root: 6" },
    ] },
    48: { id: 48, title: "Bit Mastery", testCases: [
        { input: "1", expectedOutput: "Reversed: 128" },
        { input: "255", expectedOutput: "Reversed: 255" },
        { input: "10", expectedOutput: "Reversed: 80" },
    ] },
    49: { id: 49, title: "Selection Sort Mastery", testCases: [
        { input: "5\n5 4 3 2 1", expectedOutput: "1 2 3 4 5" },
        { input: "4\n7 1 9 3", expectedOutput: "1 3 7 9" },
    ] },
    50: { id: 50, title: "Run-Length Encoding", testCases: [
        { input: "aaabbc", expectedOutput: "3a2b1c" },
        { input: "hhhhi", expectedOutput: "4h1i" },
    ] },
    51: { id: 51, title: "Custom Hash Function", testCases: [
        { input: "cat", expectedOutput: "Hash: 67" },
        { input: "dog", expectedOutput: "Hash: 63" },
    ] },
    52: { id: 52, title: "Tower of Hanoi", testCases: [
        { input: "3", expectedOutput: "Move disk 1 from A to C\nMove disk 2 from A to B\nMove disk 1 from C to B\nMove disk 3 from A to C\nMove disk 1 from B to A\nMove disk 2 from B to C\nMove disk 1 from A to C" },
    ] },
    53: { id: 53, title: "Callback Matrix", requiredOutput: "1 4\n9 16" },
    54: { id: 54, title: "Nested Struct Vault", requiredOutput: "Codename: Wolf Clearance: 7" },
    55: { id: 55, title: "Memory Arena", requiredOutput: "Last Agent: 3" },
    56: { id: 56, title: "Circular Buffer", requiredOutput: "Buffer: 4 2 3" },
    57: { id: 57, title: "Matrix Multiply", testCases: [
        { input: "1 2\n3 4\n1 0\n0 1", expectedOutput: "1 2\n3 4" },
    ] },
    58: { id: 58, title: "Substring Search", testCases: [
        { input: "hello", expectedOutput: "Found at: 0" },
        { input: "world", expectedOutput: "Found at: 6" },
        { input: "zzz", expectedOutput: "Not Found" },
    ] },
    59: { id: 59, title: "Palindrome Protocol", testCases: [
        { input: "radar", expectedOutput: "Palindrome" },
        { input: "code", expectedOutput: "Not Palindrome" },
        { input: "level", expectedOutput: "Palindrome" },
    ] },
    60: { id: 60, title: "The Final Infiltration", requiredOutput: "Top Score: 95" },
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
    },
    {
        id: "dq-3",
        question: "What does the unary & operator do in C?",
        options: [
            "Dereferences a pointer",
            "Returns the address of a variable",
            "Multiplies by two",
            "Declares a reference"
        ],
        correctAnswer: "Returns the address of a variable",
        explanation: "&x evaluates to the memory address where x is stored — essential for scanf and pointer setup."
    },
    {
        id: "dq-4",
        question: "Which loop is guaranteed to run its body at least once?",
        options: [
            "for loop",
            "while loop",
            "do-while loop",
            "infinite loop"
        ],
        correctAnswer: "do-while loop",
        explanation: "do-while checks the condition after the body executes, so the body always runs at least once."
    },
    {
        id: "dq-5",
        question: "What is the time complexity of binary search on a sorted array?",
        options: [
            "O(n)",
            "O(log n)",
            "O(n log n)",
            "O(1)"
        ],
        correctAnswer: "O(log n)",
        explanation: "Each step halves the search space, giving logarithmic growth in comparisons."
    },
];
