"use client"

import { useEffect, useState } from "react"

function getTimeUntilMidnight() {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const diff = midnight.getTime() - now.getTime()

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff / 1000 / 60) % 60)
    const seconds = Math.floor((diff / 1000) % 60)

    return {
        h: hours.toString().padStart(2, "0"),
        m: minutes.toString().padStart(2, "0"),
        s: seconds.toString().padStart(2, "0"),
    }
}

const INITIAL_TIME = { h: "00", m: "00", s: "00" }

export default function DailyResetCountdown() {
    const [time, setTime] = useState(INITIAL_TIME)

    useEffect(() => {
        setTime(getTimeUntilMidnight())
        const timer = setInterval(() => setTime(getTimeUntilMidnight()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flex flex-col items-start sm:items-end gap-1.5 select-none">
            <span className="text-[9px] font-mono tracking-widest text-[#5E6B65] uppercase">
                Daily Task Resets In
            </span>
            <div className="flex items-center gap-1">
                <span className="bg-[#0A0C0B] border border-white/[.06] px-2 py-1 rounded text-xs font-mono font-bold text-emerald-400 shadow-inner">{time.h}</span>
                <span className="text-[#5E6B65] font-bold mx-0.5">:</span>
                <span className="bg-[#0A0C0B] border border-white/[.06] px-2 py-1 rounded text-xs font-mono font-bold text-emerald-400 shadow-inner">{time.m}</span>
                <span className="text-[#5E6B65] font-bold mx-0.5">:</span>
                <span className="bg-[#0A0C0B] border border-white/[.06] px-2 py-1 rounded text-xs font-mono font-bold text-emerald-400 shadow-inner animate-pulse">{time.s}</span>
            </div>
        </div>
    )
}
