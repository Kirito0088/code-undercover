"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { MissionRecord } from "@/types"
import type { MissionClearInfo, TerminalLine } from "../MissionWorkspace"
import { Play } from "lucide-react"

// Auto-incrementing id for stable React list keys in TerminalPanel
let lineId = 0
const mkLine = <T extends object>(fields: T): T & { id: string } => ({ ...fields, id: String(++lineId) })

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

            } else {
                // ── ERROR: Show diagnostics → Platypus → retry ───────────
                const errorLines: TerminalLine[] = [
                    mkLine({ type: "system" as const, message: "> Compilation or validation failed." }),
                ]

                if (result.validationErrors && result.validationErrors.length > 0) {
                    for (const err of result.validationErrors) {
                        errorLines.push(mkLine({ type: "error" as const, message: "✗ " + err }))
                    }
                }

                if (result.diagnostics && result.diagnostics.length > 0) {
                    // Only show the FIRST error diagnostic
                    const firstDiag = result.diagnostics.find(
                        (d: { type: string }) => d.type === "error"
                    ) ?? result.diagnostics[0]

                    errorLines.push(mkLine({
                        type: "error" as const,
                        message: `solution.c:${firstDiag.line}:${firstDiag.column}: ${firstDiag.type}: ${firstDiag.message}`,
                        rawContext: firstDiag.rawContext,
                        isDiagnostic: true
                    }))
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
