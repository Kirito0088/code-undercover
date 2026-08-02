"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Lock } from "lucide-react"
import type { Mission } from "./types"

// Real accept flow: POST /api/missions/accept, then redirect to /mission/[id]
// for the actual gameplay. There's no client-only "in progress" state — see
// the note on MissionState in types.ts. "Replay" (done rows) hits the same
// endpoint; the server still returns a redirect for already-completed missions.
function useMissionAction(mission: Mission) {
    const { push } = useRouter()
    const [loading, setLoading] = useState(false)

    const run = async () => {
        if (mission.state === "locked" || loading) return
        setLoading(true)
        try {
            const res = await fetch("/api/missions/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id }),
            })
            const data = await res.json()
            if (res.ok && data.redirect) {
                push(data.redirect)
                return
            }
        } catch {
            console.error("Failed to open mission")
        }
        setLoading(false)
    }

    return { run, loading }
}

function StatusPill({ state }: { state: Mission["state"] }) {
    if (state === "done") {
        return (
            <span className="inline-flex items-center gap-1.5 h-[21px] px-2 rounded-[6px] font-dash-mono text-[9.5px] font-medium tracking-[.1em] uppercase border border-dash-line-strong bg-dash-surface-3 text-dash-text-dim">
                Complete
            </span>
        )
    }
    if (state === "active") {
        return (
            <span className="inline-flex items-center gap-1.5 h-[21px] px-2 rounded-[6px] font-dash-mono text-[9.5px] font-medium tracking-[.1em] uppercase border border-dash-accent-mid bg-[var(--dash-accent-wash)] text-dash-accent">
                <span className="dash-pulse size-[5px] rounded-full bg-current" />
                Active
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 h-[21px] px-2 rounded-[6px] font-dash-mono text-[9.5px] font-medium tracking-[.1em] uppercase border border-dash-line text-dash-text-faint">
            Locked
        </span>
    )
}

function ActionCell({ mission, prevName }: { mission: Mission; prevName?: string }) {
    const { run, loading } = useMissionAction(mission)

    if (mission.state === "locked") {
        return (
            <span
                className="flex justify-end text-dash-text-faint"
                data-tip={prevName ? `Finish "${prevName}" first` : "Complete the previous mission first"}
            >
                <Lock className="size-[13px] stroke-[1.75]" />
            </span>
        )
    }

    if (mission.state === "done") {
        return (
            <button
                type="button"
                onClick={run}
                disabled={loading}
                className="h-7 px-3 rounded-[7px] text-xs font-semibold bg-dash-surface-3 text-dash-text-dim border border-dash-line-strong hover:bg-dash-surface-4 hover:text-dash-text active:translate-y-px transition-[background-color,color,transform] duration-100 disabled:opacity-60"
            >
                {loading ? "…" : "Replay"}
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] text-xs font-semibold bg-dash-accent text-dash-accent-ink hover:bg-dash-accent-hover active:translate-y-px transition-[background-color,transform] duration-100 disabled:opacity-60"
        >
            {!loading && <span className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-current" />}
            {loading ? "Loading…" : "Accept"}
        </button>
    )
}

export default function MissionTable({ missions }: { missions: Mission[] }) {
    return (
        <div className="border border-dash-line rounded-[14px] bg-dash-surface shadow-[inset_0_1px_0_rgba(255,255,255,.035)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[660px] border-collapse">
                    <thead>
                        <tr className="bg-dash-surface-2 border-b border-dash-line">
                            <th scope="col" className="font-dash-mono text-[9.5px] font-medium tracking-[.14em] uppercase text-dash-text-faint text-left px-4 py-2.5 w-[50px]">#</th>
                            <th scope="col" className="font-dash-mono text-[9.5px] font-medium tracking-[.14em] uppercase text-dash-text-faint text-left px-4 py-2.5">Mission</th>
                            <th scope="col" className="font-dash-mono text-[9.5px] font-medium tracking-[.14em] uppercase text-dash-text-faint text-left px-4 py-2.5">Status</th>
                            <th scope="col" className="font-dash-mono text-[9.5px] font-medium tracking-[.14em] uppercase text-dash-text-faint text-left px-4 py-2.5">Reward</th>
                            <th scope="col" className="font-dash-mono text-[9.5px] font-medium tracking-[.14em] uppercase text-dash-text-faint text-left px-4 py-2.5">Difficulty</th>
                            <th scope="col" className="font-dash-mono text-[9.5px] font-medium tracking-[.14em] uppercase text-dash-text-faint text-right px-4 py-2.5">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {missions.map((mission, i) => (
                            <tr
                                key={mission.id}
                                className={`dash-row-in border-b border-dash-line last:border-b-0 transition-colors ${
                                    mission.state === "locked" ? "cursor-not-allowed" : "hover:bg-dash-surface-2"
                                }`}
                                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                            >
                                <td className="font-dash-mono text-[11.5px] text-dash-text-faint px-4 py-2.5 align-middle">
                                    {String(mission.index).padStart(2, "0")}
                                </td>
                                <td className="px-4 py-2.5 align-middle">
                                    <div className={`font-medium text-[13px] tracking-[-.005em] ${mission.state === "locked" ? "text-dash-text-faint font-normal" : "text-dash-text"}`}>
                                        {mission.name}
                                    </div>
                                    <div className="text-[11px] text-dash-text-faint mt-0.5">{mission.hint}</div>
                                </td>
                                <td className="px-4 py-2.5 align-middle">
                                    <StatusPill state={mission.state} />
                                </td>
                                <td className={`font-dash-mono text-xs px-4 py-2.5 align-middle tabular-nums ${mission.state === "locked" ? "text-dash-text-faint" : "text-dash-orange"}`}>
                                    +{mission.ap} AP
                                </td>
                                <td className="font-dash-mono text-[11px] text-dash-text-dim tracking-[.05em] px-4 py-2.5 align-middle">
                                    {mission.difficulty}
                                </td>
                                <td className="px-4 py-2.5 align-middle text-right w-[118px]">
                                    <ActionCell mission={mission} prevName={missions[i - 1]?.name} />
                                </td>
                            </tr>
                        ))}
                        {missions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-dash-text-faint text-xs">
                                    No missions available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
