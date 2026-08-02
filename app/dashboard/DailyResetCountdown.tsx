"use client"

import { useEffect, useState } from "react"

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

// Daily tasks reset at 00:00 IST specifically, not the visitor's local midnight.
function getTimeUntilISTMidnight() {
    const now = new Date()
    const istNow = new Date(now.getTime() + IST_OFFSET_MS)
    const istMidnightUTC = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0)
    const nextMidnightUTC = istMidnightUTC - IST_OFFSET_MS
    const diff = Math.max(0, nextMidnightUTC - now.getTime())

    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff / 60000) % 60)
    const seconds = Math.floor((diff / 1000) % 60)

    return {
        h: hours.toString().padStart(2, "0"),
        m: minutes.toString().padStart(2, "0"),
        s: seconds.toString().padStart(2, "0"),
        underAnHour: diff < 3600000,
    }
}

export default function DailyResetCountdown() {
    const [time, setTime] = useState<ReturnType<typeof getTimeUntilISTMidnight> | null>(null)

    useEffect(() => {
        setTime(getTimeUntilISTMidnight())
        const timer = setInterval(() => setTime(getTimeUntilISTMidnight()), 1000)
        return () => clearInterval(timer)
    }, [])

    const digitClass = `font-dash-mono text-[23px] font-medium tabular-nums ${time?.underAnHour ? "text-dash-orange" : "text-dash-text"}`

    return (
        <div className="border-l border-dash-line pl-6 min-w-[158px]">
            <div className="font-dash-mono text-[9.5px] font-medium tracking-[.16em] uppercase text-dash-text-faint">
                Daily task resets in
            </div>
            <div className="mt-2">
                <span className={digitClass}>{time?.h ?? "--"}</span>
                <span className="text-dash-text-faint">:</span>
                <span className={digitClass}>{time?.m ?? "--"}</span>
                <span className="text-dash-text-faint">:</span>
                <span className={digitClass}>{time?.s ?? "--"}</span>
            </div>
            <div className="text-[11px] text-dash-text-faint mt-1 leading-tight">
                Resets 00:00 IST
            </div>
        </div>
    )
}
