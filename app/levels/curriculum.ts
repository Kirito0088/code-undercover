import { Cpu, Coffee, Database } from "lucide-react"

export interface LevelNode {
    id: string
    order: number
    title: string
    description: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    auraReward: number
    isReal: boolean
    realId?: string
}

export const BEGINNER_CURRICULUM: LevelNode[] = [
    {
        id: "beg-1",
        order: 1,
        title: "The System Access",
        description: "Infiltrate target servers by mastering C printf syntax and standard formatted system outputs.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: true
    },
    {
        id: "beg-2",
        order: 2,
        title: "Variable Infiltration",
        description: "Capture and declare local variables (int, float, char) and read terminal inputs using scanf.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: true
    },
    {
        id: "beg-3",
        order: 3,
        title: "Control Flow Lockdown",
        description: "Override complex decision pathways using composite nested conditional controls and relational branches.",
        difficulty: "EASY",
        auraReward: 214,
        isReal: true
    },
    {
        id: "beg-4",
        order: 4,
        title: "Loop Protocol",
        description: "Decrypt transmission packages continuously using iterative for, while, and do-while loop constructs.",
        difficulty: "EASY",
        auraReward: 258,
        isReal: true
    },
    {
        id: "beg-5",
        order: 5,
        title: "Function Assembly",
        description: "Verify modular sub-systems and inject operational code parameters using reusable C functions.",
        difficulty: "EASY",
        auraReward: 300,
        isReal: true
    },
    {
        id: "beg-6",
        order: 6,
        title: "Data Cryptography",
        description: "Perform terminal computations by executing operations using standard arithmetic precedence rules.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-7",
        order: 7,
        title: "Operative Decisions",
        description: "Construct structural pathways using standard conditional decision blocks (if, else if, else).",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-8",
        order: 8,
        title: "Secure Logic Gates",
        description: "Evaluate complex conditions by chaining binary logical parameters using &&, ||, and ! operators.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-9",
        order: 9,
        title: "Switching Frequencies",
        description: "Optimize conditional flow structures with multiple routing paths using switch-case statements.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-10",
        order: 10,
        title: "Iterative Extraction",
        description: "Infiltrate and extract data logs continuously using basic pre-test while loops.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-11",
        order: 11,
        title: "Loop Encryption",
        description: "Develop counter-controlled iteration routines using optimized C for-loop parameters.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-12",
        order: 12,
        title: "Breakout Protocols",
        description: "Exert absolute authority over looping execution using structured break and continue signals.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-13",
        order: 13,
        title: "Nested Surveillance",
        description: "Process complex multi-dimensional data grids by executing loop operations inside loop frames.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-14",
        order: 14,
        title: "Agent Signature",
        description: "Encapsulate executable actions into isolated, modular parameters using void functions.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-15",
        order: 15,
        title: "Data Return Payload",
        description: "Develop standalone functional subroutines that process inputs and yield exact return parameters.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-16",
        order: 16,
        title: "Scope & Lifetime",
        description: "Manage system memory scope and stack boundaries by regulating local vs global variable definitions.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-17",
        order: 17,
        title: "Array Grid Infiltration",
        description: "Store, access, and parse linear data streams sequentially using C single-dimensional arrays.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-18",
        order: 18,
        title: "Operative Strings",
        description: "Store and process null-terminated character buffers (\\0) using fundamental string properties.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-19",
        order: 19,
        title: "Pointer Intel Retrieval",
        description: "Read exact heap addresses directly using pointers, reference (&), and dereference (*) operators.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    },
    {
        id: "beg-20",
        order: 20,
        title: "Secure Memory Allocator",
        description: "Provision dynamic memory structures on the database heap securely using malloc and free calls.",
        difficulty: "EASY",
        auraReward: 100,
        isReal: false
    }
]

export const INTERMEDIATE_CURRICULUM: LevelNode[] = [
    {
        id: "int-1",
        order: 1,
        title: "Advanced Control Logic",
        description: "Analyze complex firewalls using composite nested decision controls and relational branches.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-2",
        order: 2,
        title: "Loop Optimization Protocol",
        description: "Process transmission packages continuously using optimized iterative loop constructs.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-3",
        order: 3,
        title: "Pointer Arithmetic",
        description: "Shift through byte indices directly by applying arithmetic parameters to active memory pointers.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-4",
        order: 4,
        title: "Struct Blueprinting",
        description: "Model composite operative files and complex system entities using C structures (struct).",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-5",
        order: 5,
        title: "File Pointer Extraction",
        description: "Open, stream, append, and lock external system database logs using standard C FILE operators.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-6",
        order: 6,
        title: "Dynamic Grid Buffer",
        description: "Create elastic, expandable run-time arrays dynamically using dynamic realloc parameters.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-7",
        order: 7,
        title: "Recursive Signal Decryptor",
        description: "Decrypt deeply nested transmissions by invoking functions recursively with strict base cases.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-8",
        order: 8,
        title: "Memory Infiltration",
        description: "Audit buffer bounds and intercept corrupted heap variables before memory leakage triggers.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-9",
        order: 9,
        title: "Binary Tree Map",
        description: "Design sorted database structures in the heap using custom linked pointer binary trees.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    },
    {
        id: "int-10",
        order: 10,
        title: "Bitwise Masking Protocol",
        description: "Secure terminal switches and toggles by executing bitwise AND, OR, and XOR masks.",
        difficulty: "MEDIUM",
        isReal: false,
        auraReward: 120
    }
]

export const EXPERT_CURRICULUM: LevelNode[] = [
    {
        id: "exp-1",
        order: 1,
        title: "Deep Function Injection",
        description: "Verify modular sub-systems and inject operational compiler instructions directly.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-2",
        order: 2,
        title: "Buffer Overflow Audit",
        description: "Exploit, audit, and patch classic memory vulnerabilities inside unsecured system inputs.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-3",
        order: 3,
        title: "Custom Compiler Optimization",
        description: "Write assembly-compliant inline codes and optimize CPU register targeting configurations.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-4",
        order: 4,
        title: "Multithreaded Race Infiltration",
        description: "Synthesize parallel system threads using POSIX pthread locks and semaphores cleanly.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-5",
        order: 5,
        title: "Custom Garbage Collector",
        description: "Construct a custom reference-counting garbage collector to track heap block lifetimes.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-6",
        order: 6,
        title: "Socket Shell Hijack",
        description: "Establish encrypted low-level TCP/IP streams and execute secure network commands.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-7",
        order: 7,
        title: "Encrypted File Vault",
        description: "Implement custom AES-like block-cipher algorithms on binary data streams directly.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-8",
        order: 8,
        title: "Kernel Hooking Module",
        description: "Simulate low-level system call interception using custom function pointer vectors.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-9",
        order: 9,
        title: "Bare-Metal Operative Bootloader",
        description: "Configure system bios configurations, interrupts, and entry sequences in assembly.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    },
    {
        id: "exp-10",
        order: 10,
        title: "Quantum Key Decryption",
        description: "Execute mathematical simulations to cryptanalytically crack randomized master keys.",
        difficulty: "HARD",
        isReal: false,
        auraReward: 150
    }
]
