"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { MissionRecord } from "@/types"
import type { MissionClearInfo, TerminalLine } from "../MissionWorkspace"
import { Play } from "lucide-react"

// Auto-incrementing id for stable React list keys in TerminalPanel
let lineId = 0
const mkLine = <T extends object>(fields: T): T & { id: string } => ({ ...fields, id: String(++lineId) })

/** The filename the agent sees in the editor tab; GCC compiles under its own. */
const SOURCE_FILENAME = "solution.c"

/** How many diagnostics of one severity to render before collapsing the rest. */
const MAX_DIAGNOSTICS_SHOWN = 3

type RawDiagnostic = {
    line: number
    column: number
    type: "error" | "warning" | "note"
    message: string
    rawContext?: string
}

/**
 * Build a structured diagnostic line. `message` stays human-readable as a
 * fallback, but the terminal renders from `diagnostic` — it used to re-derive
 * severity by splitting the string on "error:", which mislabelled warnings.
 */
const mkDiagnosticLine = (d: RawDiagnostic): TerminalLine =>
    mkLine({
        type: (d.type === "error" ? "error" : "system") as TerminalLine["type"],
        message: `${SOURCE_FILENAME}:${d.line}:${d.column}: ${d.type}: ${d.message}`,
        rawContext: d.rawContext,
        isDiagnostic: true,
        diagnostic: {
            severity: d.type,
            file: SOURCE_FILENAME,
            line: d.line,
            column: d.column,
            text: d.message,
        },
    })

/**
 * Server-side stand-ins for a real diagnostic. When we have parsed diagnostics
 * to show, these add nothing but a red line above the actual explanation.
 */
const GENERIC_VALIDATION_MESSAGES = new Set([
    "Compilation failed. Fix your syntax errors.",
    "Execution failed.",
])

// ── Heavy library: code-split so it never enters the initial JS bundle ─────
const Editor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex-1 flex items-center justify-center bg-[#07080A] text-[#4A5D4A] font-mono text-xs">
            Loading editor&hellip;
        </div>
    ),
})

interface EditorPanelProps {
    mission: MissionRecord
    setTerminalOutput: React.Dispatch<React.SetStateAction<TerminalLine[]>>
    attemptCount: number
    setAttemptCount: React.Dispatch<React.SetStateAction<number>>
    setInnovationUnlocked: (unlocked: boolean) => void
    setPendingClearInfo: (info: MissionClearInfo | null) => void
    onRunStarted?: () => void
}

export function EditorPanel({
    mission,
    setTerminalOutput,
    attemptCount,
    setAttemptCount,
    setInnovationUnlocked,
    setPendingClearInfo,
    onRunStarted,
}: EditorPanelProps) {
    const defaultCode = mission.startingCode || [
        "// Mission: " + mission.title,
        "// Language: " + mission.language,
        "",
        "#include <stdio.h>",
        "",
        "int main() {",
        "    // Agent, write your code here.",
        "    ",
        "    return 0;",
        "}",
    ].join("\n")

    const [code, setCode] = useState(defaultCode)
    const [isRunning, setIsRunning] = useState(false)

    const handleRunCode = async () => {
        // Quick client-side pre-check to avoid unnecessary roundtrips
        const trimmedCode = code.trim()
        if (trimmedCode.length < 10) {
            setTerminalOutput([
                mkLine({ type: "error" as const, message: "Your code is too short. Write a complete C program." }),
            ])
            return
        }
        if (!/\bmain\s*\(/.test(trimmedCode)) {
            setTerminalOutput([
                mkLine({ type: "error" as const, message: "Missing main() function. Every C program needs an int main() { ... } entry point." }),
            ])
            return
        }

        setIsRunning(true)
        setTerminalOutput([
            mkLine({ type: "system" as const, message: "> Compiling and executing…" }),
        ])
        onRunStarted?.()

        let finalInput = ""
        // Strip comments and string literals before counting actual scanf calls
        const strippedCode = code
            .replace(/\/\/.*$/gm, "")           // remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, "")   // remove multi-line comments
            .replace(/"(?:[^"\\]|\\.)*"/g, "")   // remove string literals
        const inputMatches = strippedCode.match(/\b(scanf|gets|getline)\s*\(/g)
        const inputCount = inputMatches ? inputMatches.length : 0

        // Each input prompt must be presented and resolved one at a time — the user
        // physically types and submits each value sequentially. We use a reduce-based
        // Promise chain (no for-loop) to keep that serial contract while satisfying
        // the async-await-in-loop lint rule.
        if (inputCount > 0) {
            const collectedInputs = await Array.from({ length: inputCount }).reduce<
                Promise<string[]>
            >(
                (chain, _, i) =>
                    chain.then(
                        (acc) =>
                            new Promise<string[]>((resolve) => {
                                setTerminalOutput((prev) => [
                                    ...prev,
                                    mkLine({
                                        type: "input-prompt" as const,
                                        message:
                                            inputCount > 1
                                                ? `scanf[${i + 1}/${inputCount}]: waiting for input…`
                                                : "waiting for input…",
                                        onSubmit: (v: string) => {
                                            setTerminalOutput((p) =>
                                                p.filter((l) => l.type !== "input-prompt")
                                            )
                                            resolve([...acc, v])
                                        },
                                    }),
                                ])
                            })
                    ),
                Promise.resolve([] as string[])
            )

            finalInput = collectedInputs.join("\n")
            setTerminalOutput((prev) => [
                ...prev,
                mkLine({ type: "system" as const, message: "> Running program…" }),
            ])
        }

        setAttemptCount(prev => prev + 1)

        try {
            const response = await fetch("/api/missions/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id, code, input: finalInput }),
            })

            const result = await response.json()

            if (result.success) {
                // ── SUCCESS: Show output → Platypus → Finish button ──────
                const lines: TerminalLine[] = [
                    mkLine({ type: "system" as const, message: "> Compilation successful." }),
                ]

                // Build interactive-style terminal output
                const rawOutput = (result.stdout || "").trim()
                if (rawOutput) {
                    lines.push(mkLine({ type: "system" as const, message: "─── Program Output ───────────────────" }))
                    lines.push(mkLine({ type: "success" as const, message: rawOutput }))
                    lines.push(mkLine({ type: "system" as const, message: "──────────────────────────────────────" }))
                }

                // Execution time
                if (result.executionTimeMs !== undefined) {
                    lines.push(mkLine({ type: "system" as const, message: `> Execution Time: ${result.executionTimeMs} ms` }))
                }

                // Compiler warnings. The program ran, so these are not failures —
                // but they are exactly the habits worth correcting early, and the
                // terminal used to discard them without a word.
                const warnings: RawDiagnostic[] = result.warnings ?? []
                if (warnings.length > 0) {
                    lines.push(mkLine({
                        type: "system" as const,
                        message: `> ${warnings.length} compiler warning${warnings.length === 1 ? "" : "s"} — your program ran, but read these:`,
                    }))
                    for (const w of warnings.slice(0, MAX_DIAGNOSTICS_SHOWN)) {
                        lines.push(mkDiagnosticLine(w))
                    }
                }

                // Combo bonus
                if (result.comboStreak > 1 && result.comboBonus > 0) {
                    lines.push(mkLine({
                        type: "success" as const,
                        message: `> ⚡ LOGIC COMBO x${result.comboStreak} (+${result.comboBonus} Aura Bonus)`,
                    }))
                }

                // Platypus success explanation in the terminal
                const earnedAuraVal = result.isReplay ? 0 : (result.earnedAura !== undefined ? result.earnedAura : 50)
                lines.push(mkLine({
                    type: "hint" as const,
                    message: result.isReplay
                        ? `Excellent work, Agent.\n\nYour program compiled and executed successfully, producing the expected output.\n\nYour transmission module is now operational.\n\n[Replay Completed — 0 Aura Earned]`
                        : `Excellent work, Agent.\n\nYour program compiled and executed successfully, producing the expected output.\n\nYour transmission module is now operational.\n\n+${earnedAuraVal} Aura Earned`
                }))

                // Innovation detection
                if (result.innovationUnlocked) {
                    setInnovationUnlocked(true)
                    lines.push(mkLine({
                        type: "success" as const,
                        message: "> INNOVATION DETECTED: " + result.innovationReason,
                    }))
                }

                // The Finish button line — rendered as a special type in the terminal
                lines.push(mkLine({ type: "finish" as const, message: "FINISH_MISSION" }))

                setTerminalOutput(lines)

                // Store the clear info so the Finish button can trigger the popup
                setPendingClearInfo({
                    auraEarned: earnedAuraVal,
                    comboStreak: result.comboStreak || 0,
                    comboBonus: result.comboBonus || 0,
                    isReplay: result.isReplay || false,
                    wouldHaveEarned: result.wouldHaveEarnedAura,
                })

                // NOTE: We do NOT call setMissionCleared(true) here anymore.
                // That only happens when the user clicks "Finish Mission" in the terminal.

            } else if (result.serviceUnavailable) {
                // ── The judge is down: say so plainly. Telling the agent to
                // "fix the issues above" when nothing was compiled sent them
                // hunting for a bug in code that was never even read.
                setTerminalOutput([
                    mkLine({ type: "error" as const, message: "> Code-execution service unavailable." }),
                    mkLine({
                        type: "hint" as const,
                        message: result.explanation
                            ?? "The code-execution service is not responding, so your code was never compiled. This is a platform problem, not a mistake in your program.",
                    }),
                    mkLine({ type: "system" as const, message: "Your streak is safe. Try running again in a moment." }),
                ])
            } else {
                // ── ERROR: Show diagnostics → Platypus → retry ───────────
                const errorLines: TerminalLine[] = [
                    mkLine({ type: "system" as const, message: "> Compilation or validation failed." }),
                ]

                const diagnostics: RawDiagnostic[] = result.diagnostics ?? []
                const errorDiagnostics = diagnostics.filter((d) => d.type === "error")
                const shown = (errorDiagnostics.length > 0 ? errorDiagnostics : diagnostics)
                    .slice(0, MAX_DIAGNOSTICS_SHOWN)

                if (result.validationErrors && result.validationErrors.length > 0) {
                    for (const err of result.validationErrors) {
                        // Suppress the server's placeholder text once we have a
                        // real diagnostic to print underneath it.
                        if (shown.length > 0 && GENERIC_VALIDATION_MESSAGES.has(err)) continue
                        errorLines.push(mkLine({ type: "error" as const, message: "✗ " + err }))
                    }
                }

                if (shown.length > 0) {
                    for (const d of shown) {
                        errorLines.push(mkDiagnosticLine(d))
                    }

                    // GCC cascades: one unclosed brace can invent a dozen follow-on
                    // errors. Say how many were held back and why, rather than
                    // silently dropping them as the old first-only render did.
                    const total = errorDiagnostics.length > 0 ? errorDiagnostics.length : diagnostics.length
                    if (total > shown.length) {
                        errorLines.push(mkLine({
                            type: "system" as const,
                            message: `> ${total - shown.length} more diagnostic${total - shown.length === 1 ? "" : "s"} hidden — later errors are usually knock-on effects of the first. Fix the ones above and run again.`,
                        }))
                    }
                } else if (result.stderr) {
                    errorLines.push(mkLine({ type: "error" as const, message: result.stderr }))
                }

                if (result.explanation) {
                    errorLines.push(mkLine({ type: "hint" as const, message: result.explanation }))
                }

                if (result.ruleDescription) {
                    errorLines.push(mkLine({ type: "hint" as const, message: "Mission requirement: " + result.ruleDescription }))
                }

                errorLines.push(mkLine({ type: "system" as const, message: "Fix the issues above and try again." }))
                setTerminalOutput(errorLines)
            }
        } catch {
            setTerminalOutput([
                mkLine({ type: "error" as const, message: "System failure connecting to compilation server." }),
            ])
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#07080A] rounded-xl overflow-hidden border border-[#1F261F] shadow-2xl relative">
            {/* Neutral Window Header */}
            <div className="bg-[#0D0E12] border-b border-[#1F261F] flex items-end justify-between px-4 select-none flex-shrink-0 pt-2 h-12">
                <div className="flex items-end h-full">
                    <div className="hidden sm:flex gap-1.5 mr-6 mb-3">
                        <div className="size-3 rounded-full bg-gray-600/50"></div>
                        <div className="size-3 rounded-full bg-gray-600/50"></div>
                        <div className="size-3 rounded-full bg-gray-600/50"></div>
                    </div>
                    <div className="bg-[#07080A] text-[#E2E8F0] text-xs font-mono py-2 px-3 sm:px-6 border border-[#1F261F] border-b-0 translate-y-[1px] rounded-t-md">
                        solution.c
                    </div>
                </div>

                <div className="mb-1.5">
                    <button
                        type="button"
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-4 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 border-none whitespace-nowrap flex-shrink-0"
                    >
                        {isRunning ? (
                            <span className="animate-pulse">Running&hellip;</span>
                        ) : (
                            <>
                                <Play className="size-3" fill="currentColor" />
                                Run Code
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative min-h-0 w-full overflow-hidden">
                <Editor
                    height="100%"
                    defaultLanguage="c"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        padding: { top: 16 },
                        // ── Autocomplete / IntelliSense disabled ────────────────
                        quickSuggestions: false,
                        suggestOnTriggerCharacters: false,
                        wordBasedSuggestions: "off",
                        acceptSuggestionOnEnter: "off",
                        snippetSuggestions: "none",
                        parameterHints: { enabled: false },
                        suggest: { showWords: false },
                        hover: { enabled: "off" },
                        // ────────────────────────────────────────────────────────
                    }}
                />
            </div>
        </div>
    )
}
