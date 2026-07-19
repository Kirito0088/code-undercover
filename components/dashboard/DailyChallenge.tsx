"use client"

import { useState, useSyncExternalStore } from "react"
import { CheckCircle, XCircle, Zap, Loader2 } from "lucide-react"

export interface DailyChallengeQuestion {
    id: string
    question: string
    options: string[]
}

interface DailyChallengeProps {
    initialQuestion: DailyChallengeQuestion | null
}

const DAILY_COMPLETION_KEY = "cu_daily_completed"
const DAILY_COMPLETION_EVENT = "cu_daily_completed_changed"

function getTodayKeyUTC() {
    return new Date().toISOString().split("T")[0]
}

function getDailyCompletionSnapshot() {
    if (typeof window === "undefined") return false
    return localStorage.getItem(DAILY_COMPLETION_KEY) === getTodayKeyUTC()
}

function subscribeToDailyCompletion(onStoreChange: () => void) {
    if (typeof window === "undefined") return () => {}

    const handleStorage = (event: StorageEvent) => {
        if (event.key === DAILY_COMPLETION_KEY) onStoreChange()
    }
    const handleLocalChange = () => onStoreChange()

    window.addEventListener("storage", handleStorage)
    window.addEventListener(DAILY_COMPLETION_EVENT, handleLocalChange)

    return () => {
        window.removeEventListener("storage", handleStorage)
        window.removeEventListener(DAILY_COMPLETION_EVENT, handleLocalChange)
    }
}

function uniqueOptions(options: string[]) {
    return Array.from(new Set(options))
}

export function DailyChallenge({ initialQuestion }: DailyChallengeProps) {
    const completedToday = useSyncExternalStore(
        subscribeToDailyCompletion,
        getDailyCompletionSnapshot,
        () => false
    )

    if (!initialQuestion) return null

    const DAILY_TRIGGER_EVENT = "cu_daily_modal_trigger"

    if (completedToday) {
        return (
            <div className="bg-[#1C1C24]/30 border border-[#323242]/50 rounded-xl p-5 flex items-center justify-between opacity-75 select-none">
                <div className="flex items-center gap-3">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-md">
                        Done
                    </span>
                    <span className="text-[#8B8BA7] text-sm font-medium">Daily Mission Completed • Streak Alive (x1)</span>
                </div>
                <span className="text-xs text-[#5C5C7A] font-mono">Locked</span>
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(DAILY_TRIGGER_EVENT))}
            className="w-full bg-[#1C1C24] hover:bg-[#22222B] border border-[#323242] hover:border-indigo-500/40 rounded-xl p-5 text-left flex items-center justify-between transition-all duration-300 group cursor-pointer select-none"
        >
            <div className="flex items-center gap-3">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2 py-0.5 rounded-md animate-pulse">
                    Active
                </span>
                <span className="text-[#F1F1F5] text-sm font-medium group-hover:text-indigo-400 transition-colors">
                    ⚡ Daily Challenge Available! Complete today&apos;s mission to earn +20 AP.
                </span>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono shrink-0">
                +20 AP
            </span>
        </button>
    )
}
