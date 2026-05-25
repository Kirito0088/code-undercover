"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"

const PRO_PERKS = [
    "Unlimited Infiltration Missions",
    "High-Performance compiler prioritization",
    "Detailed telemetry debug reports",
    "Elite rank badges & badge rewards",
    "Advanced C sandbox memory bounds",
] as const

export function SubscriptionTab() {
    const [showUpgradeNote, setShowUpgradeNote] = useState(false)
    const upgradeNoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (upgradeNoteTimeoutRef.current !== null) {
                clearTimeout(upgradeNoteTimeoutRef.current)
            }
        }
    }, [])

    const handleUpgradeClick = () => {
        setShowUpgradeNote(true)
        if (upgradeNoteTimeoutRef.current !== null) {
            clearTimeout(upgradeNoteTimeoutRef.current)
        }
        upgradeNoteTimeoutRef.current = setTimeout(() => {
            setShowUpgradeNote(false)
            upgradeNoteTimeoutRef.current = null
        }, 5000)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-[#F1F1F5] tracking-tight">Subscription Plan</h1>
                <p className="text-sm text-[#8B8BA7] mt-1">Manage your billing cycle and operational status limits.</p>
            </div>

            {/* Active Plan display card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Plan Status */}
                <div className="lg:col-span-2 rounded-2xl border border-[#323242] bg-[#14141A]/50 p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs text-[#8B8BA7] font-semibold uppercase tracking-wider">Current Tier</span>
                                <h3 className="text-2xl font-black text-indigo-400 tracking-tight mt-1">Agent Free / Recruit</h3>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                                Active
                            </span>
                        </div>

                        <p className="text-xs text-[#8B8BA7] leading-relaxed">
                            You are currently on the entry-level Recruit database tier. Complete tactical code infiltration missions, earn Aura Points, and level up your ranking to chameleon, eagle, or platypus.
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[#323242]/60 flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleUpgradeClick}
                            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(99,102,241,0.15)] flex items-center justify-center gap-2"
                        >
                            Upgrade to Agent Pro
                        </button>

                        <button
                            type="button"
                            disabled
                            className="px-5 py-3 rounded-xl border border-[#323242] text-[#5C5C7A] font-bold text-sm cursor-not-allowed opacity-50"
                        >
                            Billing Dashboard
                        </button>
                    </div>

                    {showUpgradeNote && (
                        <div className="mt-3 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-400 text-center font-semibold animate-in fade-in duration-200">
                            PRO Tier is coming soon! Enhanced sandboxes and extra C compiler challenges are in pipeline training.
                        </div>
                    )}
                </div>

                {/* Right: Compare Pro Perks */}
                <div className="rounded-2xl border border-[#323242] bg-[#14141A]/30 p-6 space-y-4">
                    <h4 className="text-xs font-bold text-[#F1F1F5] uppercase tracking-wider border-b border-[#323242] pb-3">PRO Operative Features</h4>

                    <ul className="space-y-3">
                        {PRO_PERKS.map((perk) => (
                            <li key={perk} className="flex gap-2.5 items-start text-xs text-[#8B8BA7]">
                                <Sparkles className="size-4.5 text-indigo-400 shrink-0 mt-0.5" />
                                <span>{perk}</span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    )
}
