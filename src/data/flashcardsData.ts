export interface Flashcard {
    id: string;
    category: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    front: string;
    back: string;
    codeSnippet?: string;
    tags: string[];
    masteredWeight: number;
}

export const flashcardsData: Flashcard[] = [
    {
        id: "fc-1",
        category: "Pointers & Memory",
        difficulty: "EASY",
        front: "What does the dereference operator (*) do when used with a pointer variable?",
        back: "It accesses or modifies the value stored at the memory address held by the pointer.",
        codeSnippet: "int x = 42;\nint *ptr = &x;\nprintf(\"%d\", *ptr); // Outputs: 42",
        tags: ["Pointers", "Memory", "C Fundamentals"],
        masteredWeight: 1,
    },
    {
        id: "fc-2",
        category: "Pointers & Memory",
        difficulty: "MEDIUM",
        front: "What is the difference between malloc() and calloc() in C?",
        back: "malloc() allocates uninitialized memory containing garbage values. calloc() allocates memory and clears all bytes to zero.",
        codeSnippet: "// malloc: garbage values\nint *a = malloc(5 * sizeof(int));\n// calloc: zero-initialized\nint *b = calloc(5, sizeof(int));",
        tags: ["Memory Allocation", "stdlib", "C Safety"],
        masteredWeight: 1,
    },
    {
        id: "fc-3",
        category: "Strings",
        difficulty: "EASY",
        front: "How are strings represented in memory in the C programming language?",
        back: "As contiguous arrays of char elements terminated by a null byte '\\0' (ASCII code 0).",
        codeSnippet: "char name[] = \"Agent\";\n// Memory: ['A', 'g', 'e', 'n', 't', '\\0']",
        tags: ["Strings", "Memory", "Null Terminator"],
        masteredWeight: 1,
    },
    {
        id: "fc-4",
        category: "Control Flow",
        difficulty: "EASY",
        front: "What is the purpose of the 'break' statement inside a loop or switch case?",
        back: "It immediately terminates the enclosing loop or switch statement, transferring execution to the next statement outside.",
        codeSnippet: "for (int i = 0; i < 10; i++) {\n    if (i == 3) break; // Exits loop at i = 3\n}",
        tags: ["Control Flow", "Loops", "Keywords"],
        masteredWeight: 1,
    },
    {
        id: "fc-5",
        category: "Pointers & Memory",
        difficulty: "HARD",
        front: "What is a Segmentation Fault (SIGSEGV) and when does it occur?",
        back: "It occurs when a process attempts to access a restricted memory region, such as dereferencing a NULL pointer or writing to read-only memory.",
        codeSnippet: "int *ptr = NULL;\n*ptr = 10; // Segmentation Fault!",
        tags: ["Segfault", "Debugging", "Memory Protection"],
        masteredWeight: 1,
    },
    {
        id: "fc-6",
        category: "Data Structures",
        difficulty: "MEDIUM",
        front: "What is the difference between a struct and a union in C?",
        back: "In a struct, each member gets its own separate memory. In a union, all members share the exact same memory space.",
        codeSnippet: "union Data {\n    int i;   // 4 bytes\n    char c;  // shares same 4 bytes\n};",
        tags: ["Structs", "Unions", "Memory Overhead"],
        masteredWeight: 1,
    },
    {
        id: "fc-7",
        category: "Security & I/O",
        difficulty: "MEDIUM",
        front: "Why is gets() considered unsafe in C, and what should be used instead?",
        back: "gets() does not check buffer limits, causing buffer overflow vulnerabilities. Use fgets(buffer, size, stdin) instead.",
        codeSnippet: "char buf[16];\n// Safe replacement:\nfgets(buf, sizeof(buf), stdin);",
        tags: ["Security", "Buffer Overflow", "I/O"],
        masteredWeight: 1,
    },
    {
        id: "fc-8",
        category: "Advanced C",
        difficulty: "HARD",
        front: "What does the 'volatile' keyword tell the C compiler?",
        back: "It prevents compiler optimization on the variable, warning that its value can be modified unexpectedly by hardware or concurrent threads.",
        codeSnippet: "volatile int *hw_status = (int*)0x40001000;\nwhile (*hw_status == 0); // Won't be optimized away",
        tags: ["Volatile", "Keywords", "Embedded C"],
        masteredWeight: 1,
    }
];
