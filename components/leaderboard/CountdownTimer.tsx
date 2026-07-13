"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function CountdownTimer() {
    const router = useRouter()
    const prevTargetRef = useRef<number | null>(null)
    const [timeDigits, setTimeDigits] = useState({
        h1: "0",
        h2: "0",
        m1: "0",
        m2: "0",
        s1: "0",
        s2: "0"
    })

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date()
            // Baseline target: July 12, 2026, 08:44:10 UTC (exactly 12 hours from 02:14:10 AM local time)
            const targetReset = new Date("2026-07-12T08:44:10Z")
            const intervalMs = 12 * 60 * 60 * 1000 // 12 hours
            
            let nextTargetMs = targetReset.getTime()
            let difference = nextTargetMs - now.getTime()
            if (difference <= 0) {
                const elapsed = now.getTime() - nextTargetMs
                nextTargetMs = nextTargetMs + Math.ceil(elapsed / intervalMs) * intervalMs
                difference = nextTargetMs - now.getTime()
            }

            // Check if we crossed the reset boundary
            if (prevTargetRef.current !== null && nextTargetMs !== prevTargetRef.current) {
                // The target time has changed, meaning we crossed the 12-hour boundary!
                router.refresh()
            }
            prevTargetRef.current = nextTargetMs

            const totalHours = Math.max(0, Math.floor(difference / (1000 * 60 * 60)))
            const totalMinutes = Math.max(0, Math.floor((difference / 1000 / 60) % 60))
            const totalSeconds = Math.max(0, Math.floor((difference / 1000) % 60))

            const hoursStr = totalHours.toString().padStart(2, "0")
            const minutesStr = totalMinutes.toString().padStart(2, "0")
            const secondsStr = totalSeconds.toString().padStart(2, "0")

            setTimeDigits({
                h1: hoursStr[0],
                h2: hoursStr[1],
                m1: minutesStr[0],
                m2: minutesStr[1],
                s1: secondsStr[0],
                s2: secondsStr[1]
            })
        }

        updateTimer()
        const timer = setInterval(updateTimer, 1000) // Update every second for real-time countdown

        return () => clearInterval(timer)
    }, [router])

    return (
        <div className="flex items-center gap-3 select-none">
            <span className="text-[#8B8BA7] uppercase font-bold tracking-wider text-[10px]">Leaderboard resets in:</span>
            <div className="flex items-center gap-1">
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.h1}</span>
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.h2}</span>
                <span className="text-[#5C5C7A] font-bold mx-0.5 animate-pulse">:</span>
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.m1}</span>
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.m2}</span>
                <span className="text-[#5C5C7A] font-bold mx-0.5 animate-pulse">:</span>
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.s1}</span>
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.s2}</span>
            </div>
        </div>
    )
}
