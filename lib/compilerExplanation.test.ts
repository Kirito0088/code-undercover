import { describe, it, expect } from "vitest"
import { sanitizeString, parseGccDiagnostics } from "./compiler"
import { explainFirstDiagnostic, explainCompilerError, explainRuntimeFailure } from "./compilerExplanation"
import { classifyCompilerError } from "./errorClassifier"

/** Run raw judge output through the same path executeCode uses. */
function pipeline(raw: string) {
    const sanitized = sanitizeString(raw)
    const diagnostics = parseGccDiagnostics(sanitized)
    return { sanitized, diagnostics, explanation: explainFirstDiagnostic(diagnostics) }
}

describe("parseGccDiagnostics — source context alignment", () => {
    // Verbatim GCC 9.2.0 output from the Judge0 box, directed quotes included.
    const MISSING_SEMICOLON = [
        "main.c: In function ‘main’:",
        "main.c:5:20: error: expected ‘;’ before ‘return’",
        '    5 |     printf("hello")',
        "      |                    ^",
        "      |                    ;",
    ].join("\n")

    it("keeps the caret aligned with the source line", () => {
        const { diagnostics } = pipeline(MISSING_SEMICOLON)
        expect(diagnostics).toHaveLength(1)

        const [sourceLine, caretLine] = diagnostics[0].rawContext.split("\n")

        // The gutter '|' must sit at the same column on every context line, or
        // the caret points somewhere other than the offending token.
        expect(sourceLine.indexOf("|")).toBe(caretLine.indexOf("|"))
        // The ^ must land just past the ')' — the spot the ';' belongs.
        expect(caretLine.indexOf("^")).toBe(sourceLine.indexOf(")") + 1)
    })

    it("records position and severity from the diagnostic header", () => {
        const { diagnostics } = pipeline(MISSING_SEMICOLON)
        expect(diagnostics[0]).toMatchObject({ line: 5, column: 20, type: "error" })
    })

    it("classifies through GCC's directed quotes", () => {
        const { diagnostics } = pipeline(MISSING_SEMICOLON)
        expect(classifyCompilerError(diagnostics[0]).errorType).toBe("missing_semicolon")
    })

    it("sends the agent to the caret, not the token named in the message", () => {
        const { explanation } = pipeline(MISSING_SEMICOLON)
        expect(explanation).toContain("line 5")
        expect(explanation).toContain("column 20")
        expect(explanation).not.toContain("isn't quite right") // not the unknown fallback
    })

    it("drops the 'In function' preamble even when curly-quoted", () => {
        expect(pipeline(MISSING_SEMICOLON).sanitized).not.toContain("In function")
    })
})

describe("parseGccDiagnostics — linker failures", () => {
    const UNDEFINED_REFERENCE = [
        "/usr/bin/ld: /tmp/ccQ1r2.o: in function `main':",
        "main.c:(.text+0x1a): undefined reference to `greet'",
        "collect2: error: ld returned 1 exit status",
    ].join("\n")

    it("produces a diagnostic instead of falling through as raw text", () => {
        const { diagnostics } = pipeline(UNDEFINED_REFERENCE)
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0].type).toBe("error")
        expect(diagnostics[0].message).toContain("greet")
    })

    it("names the missing function in the explanation", () => {
        const { explanation } = pipeline(UNDEFINED_REFERENCE)
        expect(explanation).toContain("'greet'")
        expect(explanation).not.toContain("Read the output above")
    })

    it("strips the linker binary path but keeps the message", () => {
        const { sanitized } = pipeline(UNDEFINED_REFERENCE)
        expect(sanitized).not.toContain("/usr/bin/ld")
        expect(sanitized).toContain("undefined reference to `greet'")
    })

    it("reports a missing main as its own error type", () => {
        const raw = "/usr/bin/ld: in function `_start': undefined reference to `main'"
        const { diagnostics } = pipeline(raw)
        expect(classifyCompilerError(diagnostics[0]).errorType).toBe("no_main")
    })
})

describe("classifier — header attribution", () => {
    const implicit = (fn: string) =>
        classifyCompilerError({
            line: 3, column: 5, type: "warning", rawContext: "",
            message: `implicit declaration of function '${fn}' [-Wimplicit-function-declaration]`,
        })

    it("routes stdio, math, string and stdlib functions to the right header", () => {
        expect(implicit("printf").errorType).toBe("missing_stdio")
        expect(implicit("sqrt").errorType).toBe("missing_math")
        expect(implicit("strlen").errorType).toBe("missing_string_h")
        expect(implicit("malloc").errorType).toBe("missing_stdlib")
    })

    it("puts abs in stdlib.h, not math.h", () => {
        expect(implicit("abs").errorType).toBe("missing_stdlib")
    })

    it("matches function names on word boundaries", () => {
        // 'sin' is a substring of 'using' and 'gets' of 'fgets'; substring
        // matching sent both to the wrong header.
        expect(implicit("using_cache").errorType).toBe("implicit_function")
        expect(implicit("fgets").errorType).toBe("missing_stdio")
    })

    it("extracts the symbol so the explanation can name it", () => {
        expect(implicit("sqrt").symbol).toBe("sqrt")
    })
})

describe("explanations", () => {
    it("names the undeclared identifier and its line", () => {
        const text = explainCompilerError({
            line: 7, column: 9, type: "error", rawContext: "",
            message: "'counter' undeclared (first use in this function)",
        })
        expect(text).toContain("'counter'")
        expect(text).toContain("line 7")
    })

    it("falls back to the unknown explainer without throwing", () => {
        const text = explainCompilerError("something entirely unrecognised")
        expect(text).toContain("isn't quite right")
        expect(text).toContain("the error line") // line 0 → no bogus "line 0"
    })

    it("explains segfaults rather than echoing the signal name", () => {
        expect(explainRuntimeFailure("Runtime Error (SIGSEGV)")).toContain("segmentation fault")
        expect(explainRuntimeFailure("Runtime Error (SIGFPE)")).toContain("division")
    })

    it("returns undefined for an unrecognised runtime status", () => {
        expect(explainRuntimeFailure(undefined, "")).toBeUndefined()
    })
})

describe("missing header file", () => {
    it("names the header the preprocessor could not find", () => {
        const { diagnostics, explanation } = pipeline(
            "main.c:1:10: fatal error: studio.h: No such file or directory"
        )
        expect(diagnostics[0].type).toBe("error") // fatal error → error
        expect(explanation).toContain("studio.h")
    })
})

describe("directed quotes (real UTF-8 GCC output)", () => {
    it("classifies undeclared identifiers written with curly quotes", () => {
        const c = classifyCompilerError({
            line: 7, column: 5, type: "error", rawContext: "",
            message: "‘counter’ undeclared (first use in this function)",
        })
        expect(c.errorType).toBe("undeclared_identifier")
        expect(c.symbol).toBe("counter")
    })

    it("routes a curly-quoted implicit declaration to the right header", () => {
        const c = classifyCompilerError({
            line: 3, column: 5, type: "warning", rawContext: "",
            message: "implicit declaration of function ‘printf’",
        })
        expect(c.errorType).toBe("missing_stdio")
        expect(c.symbol).toBe("printf")
    })

    it("handles both ASCII and directed quotes identically", () => {
        const ascii = classifyCompilerError({
            line: 1, column: 1, type: "error", rawContext: "",
            message: "expected ';' before 'return'",
        })
        const curly = classifyCompilerError({
            line: 1, column: 1, type: "error", rawContext: "",
            message: "expected ‘;’ before ‘return’",
        })
        expect(curly.errorType).toBe(ascii.errorType)
        expect(curly.symbol).toBe(ascii.symbol)
    })
})
