"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { MissionRecord } from "@/types"
import type { MissionClearInfo } from "../MissionWorkspace"
import { Play } from "lucide-react"

// ── Heavy library: code-split so it never enters the initial JS bundle ─────
const Editor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex-1 flex items-center justify-center bg-[#0A0A0F] text-[#3A3A52] font-mono text-xs">
            Loading editor...
        </div>
    ),
})

interface TerminalLine {
    type: "system" | "error" | "success" | "hint" | "finish" | "input-prompt"
    message: string
    rawContext?: string
    isDiagnostic?: boolean
    onSubmit?: (val: string) => void
}

interface EditorPanelProps {
    mission: MissionRecord
    setTerminalOutput: React.Dispatch<React.SetStateAction<TerminalLine[]>>
    attemptCount: number
    setAttemptCount: React.Dispatch<React.SetStateAction<number>>
    setInnovationUnlocked: (unlocked: boolean) => void
    setMissionCleared: (cleared: boolean) => void
    setClearInfo: (info: MissionClearInfo) => void
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
                { type: "error", message: "Your code is too short. Write a complete C program." },
            ])
            return
        }
        if (!/\bmain\s*\(/.test(trimmedCode)) {
            setTerminalOutput([
                { type: "error", message: "Missing main() function. Every C program needs an int main() { ... } entry point." },
            ])
            return
        }

        setIsRunning(true)
        setTerminalOutput([
            { type: "system", message: "> Compiling and executing…" },
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
                                    {
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
                                    },
                                ])
                            })
                    ),
                Promise.resolve([] as string[])
            )

            finalInput = collectedInputs.join("\n")
            setTerminalOutput((prev) => [
                ...prev,
                { type: "system", message: "> Running program…" },
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
                    { type: "system", message: "> Compilation successful." },
                ]

                // Build interactive-style terminal output
                const rawOutput = (result.stdout || "").trim()
                if (rawOutput) {
                    lines.push({ type: "system", message: "─── Program Output ───────────────────" })
                    lines.push({ type: "success", message: rawOutput })
                    lines.push({ type: "system", message: "──────────────────────────────────────" })
                }

                // Execution time
                if (result.executionTimeMs !== undefined) {
                    lines.push({ type: "system", message: `> Execution Time: ${result.executionTimeMs} ms` })
                }

                // Combo bonus
                if (result.comboStreak > 1 && result.comboBonus > 0) {
                    lines.push({
                        type: "success",
                        message: `> ⚡ LOGIC COMBO x${result.comboStreak} (+${result.comboBonus} Aura Bonus)`,
                    })
                }

                // Platypus success explanation in the terminal
                lines.push({
                    type: "hint",
                    message: `Excellent work, Agent.\n\nYour program compiled and executed successfully, producing the expected output.\n\nYour transmission module is now operational.\n\n+${result.earnedAura || result.auraEarned || 50} Aura Earned`
                })

                // Innovation detection
                if (result.innovationUnlocked) {
                    setInnovationUnlocked(true)
                    lines.push({
                        type: "success",
                        message: "> INNOVATION DETECTED: " + result.innovationReason,
                    })
                }

                // The Finish button line — rendered as a special type in the terminal
                lines.push({ type: "finish", message: "FINISH_MISSION" })

                setTerminalOutput(lines)

                // Store the clear info so the Finish button can trigger the popup
                setPendingClearInfo({
                    auraEarned: result.earnedAura || result.auraEarned || 50,
                    comboStreak: result.comboStreak || 0,
                    comboBonus: result.comboBonus || 0,
                })

                // NOTE: We do NOT call setMissionCleared(true) here anymore.
                // That only happens when the user clicks "Finish Mission" in the terminal.

            } else {
                // ── ERROR: Show diagnostics → Platypus → retry ───────────
                const errorLines: TerminalLine[] = [
                    { type: "system", message: "> Compilation or validation failed." },
                ]

                if (result.validationErrors && result.validationErrors.length > 0) {
                    for (const err of result.validationErrors) {
                        errorLines.push({ type: "error", message: "✗ " + err })
                    }
                }

                if (result.diagnostics && result.diagnostics.length > 0) {
                    // Only show the FIRST error diagnostic
                    const firstDiag = result.diagnostics.find(
                        (d: { type: string }) => d.type === "error"
                    ) ?? result.diagnostics[0]

                    errorLines.push({
                        type: "error",
                        message: `solution.c:${firstDiag.line}:${firstDiag.column}: ${firstDiag.type}: ${firstDiag.message}`,
                        rawContext: firstDiag.rawContext,
                        isDiagnostic: true
                    })
                } else if (result.stderr) {
                    errorLines.push({ type: "error", message: result.stderr })
                }

                if (result.explanation) {
                    errorLines.push({ type: "hint", message: result.explanation })
                }

                if (result.ruleDescription) {
                    errorLines.push({ type: "hint", message: "Mission requirement: " + result.ruleDescription })
                }

                errorLines.push({ type: "system", message: "Fix the issues above and try again." })
                setTerminalOutput(errorLines)
            }
        } catch {
            setTerminalOutput([
                { type: "error", message: "System failure connecting to compilation server." },
            ])
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#0A0A0F] rounded-xl overflow-hidden border border-[#22222E] shadow-2xl relative">
            {/* Neutral Window Header */}
            <div className="bg-[#111118] border-b border-[#22222E] flex items-end justify-between px-4 select-none flex-shrink-0 pt-2 h-12">
                <div className="flex items-end h-full">
                    <div className="hidden sm:flex gap-1.5 mr-6 mb-3">
                        <div className="size-3 rounded-full bg-gray-600/50"></div>
                        <div className="size-3 rounded-full bg-gray-600/50"></div>
                        <div className="size-3 rounded-full bg-gray-600/50"></div>
                    </div>
                    <div className="bg-[#0A0A0F] text-[#F1F1F5] text-xs font-mono py-2 px-3 sm:px-6 border border-[#22222E] border-b-0 translate-y-[1px] rounded-t-md">
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
                            <span className="animate-pulse">Running...</span>
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
                        hover: { enabled: false },
                        // ────────────────────────────────────────────────────────
                    }}
                />
            </div>
        </div>
    )
}
