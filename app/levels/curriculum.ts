export interface LevelNode {
    id: string
    order: number
    title: string
    description: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    auraReward: number
    isReal: boolean
    track: "ALPHA" | "BETA" | "GAMMA"
    realId?: string
}

export interface TrackMeta {
    id: "ALPHA" | "BETA" | "GAMMA"
    label: string
    name: string
    code: string
    clearance: string
    accent: "emerald" | "cyan" | "amber"
    text: string
    bar: string
    ring: string
    border: string
}

export const TRACKS: Record<"ALPHA" | "BETA" | "GAMMA", TrackMeta> = {
    ALPHA: {
        id: "ALPHA",
        label: "Beginner",
        name: "Sector Alpha",
        code: "SECTOR_ALPHA",
        clearance: "LEVEL 1 // UNRESTRICTED",
        accent: "emerald",
        text: "text-emerald-400",
        bar: "bg-emerald-500",
        ring: "border-emerald-500/30",
        border: "hover:border-emerald-500/30",
    },
    BETA: {
        id: "BETA",
        label: "Intermediate",
        name: "Sector Beta",
        code: "SECTOR_BETA",
        clearance: "LEVEL 2 // RESTRICTED",
        accent: "cyan",
        text: "text-cyan-400",
        bar: "bg-cyan-500",
        ring: "border-cyan-500/30",
        border: "hover:border-cyan-500/30",
    },
    GAMMA: {
        id: "GAMMA",
        label: "Expert",
        name: "Sector Gamma",
        code: "SECTOR_GAMMA",
        clearance: "LEVEL 3 // CLASSIFIED",
        accent: "amber",
        text: "text-amber-400",
        bar: "bg-amber-500",
        ring: "border-amber-500/30",
        border: "hover:border-amber-500/30",
    },
}

export const BEGINNER_CURRICULUM: LevelNode[] = [
    { id: "beg-1", order: 1, title: "The System Access", description: "Infiltrate target servers by mastering C printf syntax and standard formatted system outputs.", difficulty: "EASY", auraReward: 100, isReal: true, track: "ALPHA" },
    { id: "beg-2", order: 2, title: "Variable Infiltration", description: "Capture and declare local variables (int, float, char) and read terminal inputs using scanf.", difficulty: "EASY", auraReward: 100, isReal: true, track: "ALPHA" },
    { id: "beg-3", order: 3, title: "Control Flow Lockdown", description: "Override complex decision pathways using composite nested conditional controls and relational branches.", difficulty: "EASY", auraReward: 214, isReal: true, track: "ALPHA" },
    { id: "beg-4", order: 4, title: "Loop Protocol", description: "Decrypt transmission packages continuously using iterative for, while, and do-while loop constructs.", difficulty: "EASY", auraReward: 258, isReal: true, track: "ALPHA" },
    { id: "beg-5", order: 5, title: "Function Assembly", description: "Verify modular sub-systems and inject operational code parameters using reusable C functions.", difficulty: "EASY", auraReward: 300, isReal: true, track: "ALPHA" },
    { id: "beg-6", order: 6, title: "Arithmetic Protocol", description: "Perform terminal computations by executing operations using standard arithmetic precedence rules.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-7", order: 7, title: "Operative Decisions", description: "Construct structural pathways using standard conditional decision blocks (if, else if, else).", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-8", order: 8, title: "Secure Logic Gates", description: "Evaluate complex conditions by chaining binary logical parameters using &&, ||, and ! operators.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-9", order: 9, title: "Switching Frequencies", description: "Optimize conditional flow structures with multiple routing paths using switch-case statements.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-10", order: 10, title: "Iterative Extraction", description: "Infiltrate and extract data logs continuously using basic pre-test while loops.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-11", order: 11, title: "Loop Encryption", description: "Develop counter-controlled iteration routines using optimized C for-loop parameters.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-12", order: 12, title: "Breakout Protocols", description: "Exert absolute authority over looping execution using structured break and continue signals.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-13", order: 13, title: "Nested Surveillance", description: "Process complex multi-dimensional data grids by executing loop operations inside loop frames.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-14", order: 14, title: "Agent Signature", description: "Encapsulate executable actions into isolated, modular parameters using void functions.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-15", order: 15, title: "Data Return Payload", description: "Develop standalone functional subroutines that process inputs and yield exact return parameters.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-16", order: 16, title: "Scope & Lifetime", description: "Manage system memory scope and stack boundaries by regulating local vs global variable definitions.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-17", order: 17, title: "Array Grid Infiltration", description: "Store, access, and parse linear data streams sequentially using C single-dimensional arrays.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-18", order: 18, title: "Operative Strings", description: "Store and process null-terminated character buffers (\\0) using fundamental string properties.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-19", order: 19, title: "Pointer Intel Retrieval", description: "Read exact heap addresses directly using pointers, reference (&), and dereference (*) operators.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
    { id: "beg-20", order: 20, title: "Secure Memory Allocator", description: "Provision dynamic memory structures on the database heap securely using malloc and free calls.", difficulty: "EASY", auraReward: 110, isReal: true, track: "ALPHA" },
]

export const INTERMEDIATE_CURRICULUM: LevelNode[] = [
    { id: "int-1", order: 21, title: "Advanced Control Logic", description: "Analyze complex firewalls using composite nested decision controls and relational branches.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-2", order: 22, title: "Loop Optimization Protocol", description: "Process transmission packages continuously using optimized iterative loop constructs.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-3", order: 23, title: "Pointer Arithmetic", description: "Shift through byte indices directly by applying arithmetic parameters to active memory pointers.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-4", order: 24, title: "Struct Blueprinting", description: "Model composite operative files and complex system entities using C structures (struct).", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-5", order: 25, title: "Formatted Intel Report", description: "Synthesize structured output strings using sprintf and formatted stream builders.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-6", order: 26, title: "Dynamic Grid Buffer", description: "Create elastic, expandable run-time arrays dynamically using dynamic realloc parameters.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-7", order: 27, title: "Recursive Signal Decryptor", description: "Decrypt deeply nested transmissions by invoking functions recursively with strict base cases.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-8", order: 28, title: "Memory Infiltration", description: "Audit buffer bounds and intercept corrupted heap variables before memory leakage triggers.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-9", order: 29, title: "Recursion Master", description: "Synthesize exponential computations using classic recursive definitions and memorized state.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-10", order: 30, title: "Bitwise Masking Protocol", description: "Secure terminal switches and toggles by executing bitwise AND, OR, and XOR masks.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-11", order: 31, title: "String Manipulation", description: "Decode and reverse null-terminated buffers using custom character-level operators.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-12", order: 32, title: "Matrix Transposition", description: "Rebuild two-dimensional data grids by transposing rows and columns in-place.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-13", order: 33, title: "Enum Protocol", description: "Route terminal states using typed enumerations and switch dispatch tables.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-14", order: 34, title: "Callback Compass", description: "Redirect executable behavior at runtime using function pointer callbacks.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-15", order: 35, title: "Linked List Insertion", description: "Splice dynamic node structures into ordered chains using pointer linking.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-16", order: 36, title: "Stack Protocol", description: "Implement last-in-first-out memory discipline using an array-backed stack.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-17", order: 37, title: "Queue Protocol", description: "Implement first-in-first-out dispatch using a circular array queue.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-18", order: 38, title: "String Tokenization", description: "Segment raw intelligence streams into atomic words by delimiters.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-19", order: 39, title: "Sorting Protocol", description: "Arrange out-of-order data packets into ascending sequences using bubble sort.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
    { id: "int-20", order: 40, title: "Binary Search Protocol", description: "Locate encrypted keys inside sorted arrays using logarithmic search division.", difficulty: "MEDIUM", auraReward: 120, isReal: true, track: "BETA" },
]

export const EXPERT_CURRICULUM: LevelNode[] = [
    { id: "exp-1", order: 41, title: "Deep Function Injection", description: "Verify modular sub-systems and inject operational compiler instructions directly.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-2", order: 42, title: "Buffer Overflow Audit", description: "Exploit, audit, and patch classic memory vulnerabilities inside unsecured system inputs.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-3", order: 43, title: "Macro Inline Optimization", description: "Compile-time constant substitution and inline expansion for zero-overhead arithmetic.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-4", order: 44, title: "XOR Cipher Decryption", description: "Break and rebuild single-byte XOR-encrypted transmissions with key recovery.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-5", order: 45, title: "Linked List Reverse", description: "Reverse a doubly-linked operative chain by rewiring node pointers end-to-end.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-6", order: 46, title: "Dynamic 2D Matrix", description: "Allocate a pointer-to-pointer grid and compute diagonal trace sums.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-7", order: 47, title: "Recursive Digit Decay", description: "Reduce integer payloads to a single digit using recursive summing.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-8", order: 48, title: "Bit Mastery", description: "Manipulate raw bit fields to compute parity and bit-reversal transforms.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-9", order: 49, title: "Selection Sort Mastery", description: "Execute quadratic-time selection sorting on hostile integer arrays.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-10", order: 50, title: "Run-Length Encoding", description: "Compress repetitive data streams into compact run-length tokens.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-11", order: 51, title: "Custom Hash Function", description: "Construct a minimal collision-resistant string hash for keyed lookups.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-12", order: 52, title: "Tower of Hanoi", description: "Solve recursive disk-transfer puzzles with explicit move logging.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-13", order: 53, title: "Callback Matrix", description: "Apply function-pointer callbacks across every cell of a 2D grid.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-14", order: 54, title: "Nested Struct Vault", description: "Compose layered structure hierarchies modeling agents, missions, and intel.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-15", order: 55, title: "Memory Arena", description: "Provision and audit an array of struct instances on the heap with cleanup.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-16", order: 56, title: "Circular Buffer", description: "Build a fixed-capacity ring buffer that overwrites the oldest payload.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-17", order: 57, title: "Matrix Multiply", description: "Multiply two 3x3 operand matrices and emit the product grid.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-18", order: 58, title: "Substring Search", description: "Implement a manual needle-in-haystack string matcher without libc helpers.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-19", order: 59, title: "Palindrome Protocol", description: "Verify mirrored secret phrases against left-right reversal checks.", difficulty: "HARD", auraReward: 150, isReal: true, track: "GAMMA" },
    { id: "exp-20", order: 60, title: "The Final Infiltration", description: "Combine structs, arrays, and logic into a full agency intelligence report.", difficulty: "HARD", auraReward: 200, isReal: true, track: "GAMMA" },
]
