import { db } from "./db"
import { computeErrorHash } from "./errorHash"
import { classifyCompilerError } from "./errorClassifier"
import { explainByErrorType } from "./compilerExplanation"
import { callOllama, FALLBACK_EXPLANATION } from "./ollama"
import type { CompilerDiagnostic } from "@/types"

// ─────────────────────────────────────────────────────────────────────────────
// Phase B seam: Root Error in, Explanation out. Never hangs, never 5xxs.
//
// Orchestration (OPEN-1 resolution: option (c), static map for known types,
// AI for unknown only):
//
//   classify(msg)
//     → KNOWN type:   return the static Platypus explanation (source: "static")
//     → 'unknown':    computeErrorHash → CompilerErrorCache.findUnique
//                        → HIT:  increment hitCount, return source: "cache"
//                        → MISS: callOllama()
//                                  → SUCCESS: persist row, return source: "generated"
//                                  → FAILURE: return FALLBACK_EXPLANATION, persist nothing
// ─────────────────────────────────────────────────────────────────────────────

export type ExplainSource = "static" | "cache" | "generated" | "fallback"

export interface ExplainResult {
    explanation: string
    directFix: string | null
    source: ExplainSource
}

const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = "P2002"

function isUniqueConstraintViolation(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION
    )
}

export async function explainError(
    rootErrorMessage: string,
    brokenLineContent: string,
    errorType?: string
): Promise<ExplainResult> {
    // Layer 1 (OPEN-1, zero cost): known error types never touch the cache
    // or the Oracle instance at all.
    const diagnostic: CompilerDiagnostic = {
        line: 0,
        column: 0,
        type: "error",
        message: rootErrorMessage,
        rawContext: brokenLineContent,
    }
    const classified = classifyCompilerError(diagnostic)

    if (classified.errorType !== "unknown") {
        return {
            explanation: explainByErrorType(classified.errorType),
            directFix: "",
            source: "static",
        }
    }

    // Layer 2: cache lookup, keyed on the ADR-002 normalized hash.
    const errorHash = computeErrorHash(rootErrorMessage, brokenLineContent)
    const cached = await db.compilerErrorCache.findUnique({ where: { errorHash } })

    if (cached) {
        await db.compilerErrorCache.update({
            where: { errorHash },
            data: { hitCount: { increment: 1 } },
        })
        return {
            explanation: cached.explanation,
            directFix: cached.directFix,
            source: "cache",
        }
    }

    // Layer 3: Oracle Ollama, exactly one attempt (ADR-004).
    const generated = await callOllama(rootErrorMessage, brokenLineContent, errorType)

    if (!generated) {
        return {
            explanation: FALLBACK_EXPLANATION.explanation,
            directFix: FALLBACK_EXPLANATION.direct_fix,
            source: "fallback",
        }
    }

    try {
        await db.compilerErrorCache.create({
            data: {
                errorHash,
                explanation: generated.explanation,
                directFix: generated.direct_fix,
                errorType: classified.errorType,
            },
        })
    } catch (error) {
        // Two concurrent identical misses race to insert the same
        // errorHash — the loser hits a unique-constraint violation, which
        // is expected and not an actual failure: the winner's row already
        // holds the same content this request would have written.
        if (!isUniqueConstraintViolation(error)) {
            throw error
        }
    }

    return {
        explanation: generated.explanation,
        directFix: generated.direct_fix,
        source: "generated",
    }
}
