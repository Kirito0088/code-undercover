import { z } from "zod"

// POST /api/compiler/explain request body (T3).
// rootErrorMessage/brokenLineContent bounds match the Root Error contract
// from T2 (lib/gccDiagnostics.ts); errorType is an optional CompilerErrorType
// hint, used only for prompt context.
export const explainRequestSchema = z.object({
    rootErrorMessage: z.string().min(1).max(2000),
    brokenLineContent: z.string().max(1000),
    errorType: z.string().optional(),
})

export type ExplainRequest = z.infer<typeof explainRequestSchema>
