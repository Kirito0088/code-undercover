"use client"

import { useState } from "react"
import { MissionRecord } from "@/types"
import type { MissionClearInfo } from "../MissionWorkspace"
import { Play } from "lucide-react"
import Editor from "@monaco-editor/react"

interface TerminalLine {
    type: "system" | "error" | "success" | "hint" | "finish"
    message: string
    rawContext?: string
    isDiagnostic?: boolean
}

interface EditorPanelProps {
    mission: MissionRecord
    setTerminalOutput: React.Dispatch<React.SetStateAction<TerminalLine[]>>
    attemptCount: number
    setAttemptCount: (count: number) => void
    setInnovationUnlocked: (unlocked: boolean) => void
    setMissionCleared: (cleared: boolean) => void
    setClearInfo: (info: MissionClearInfo) => void
    setPendingClearInfo: (info: MissionClearInfo | null) => void
}

export function EditorPanel({
    mission,
    setTerminalOutput,
    attemptCount,
    setAttemptCount,
    setInnovationUnlocked,
    setPendingClearInfo,
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
        setIsRunning(true)
        setTerminalOutput([
            { type: "system", message: "> Compiling and executing..." },
        ])

        setAttemptCount(attemptCount + 1)

        try {
            const response = await fetch("/api/missions/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id, code }),
            })

            const result = await response.json()

            if (result.success) {
                // ── SUCCESS: Show output → Platypus → Finish button ──────
                const lines: TerminalLine[] = [
                    { type: "system", message: "> Compilation successful." },
                ]

                // Show program output
                if (result.stdout && result.stdout.trim()) {
                    lines.push({ type: "system", message: "─── Program Output ───────────────────" })
                    lines.push({ type: "success", message: result.stdout.trim() })
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
        <div className="flex flex-col h-full bg-[#0d1117] rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
            {/* Neutral Window Header */}
            <div className="bg-[#161b22] border-b border-gray-800 flex items-end justify-between px-4 select-none flex-shrink-0 pt-2 h-12">
                <div className="flex items-end h-full">
                    <div className="flex gap-1.5 mr-6 mb-3">
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                    </div>
                    <div className="bg-[#0d1117] text-gray-300 text-xs font-mono py-2 px-6 border border-gray-800 border-b-0 translate-y-[1px]">
                        solution.c
                    </div>
                </div>

                <div className="mb-1.5">
                    <button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(22,163,74,0.3)]"
                    >
                        {isRunning ? (
                            <span className="animate-pulse">RUNNING...</span>
                        ) : (
                            <>
                                <Play className="h-3 w-3" fill="currentColor" />
                                RUN CODE
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
