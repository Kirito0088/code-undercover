"use client"

import React from "react"
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
        s2: "0",
    })

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date()
            const targetReset = new Date("2026-07-12T08:44:10Z")
            const intervalMs = 12 * 60 * 60 * 1000

            const elapsed = now.getTime() - targetReset.getTime()
            const difference = intervalMs - (elapsed % intervalMs)
            const cycleIndex = Math.floor(elapsed / intervalMs)

            if (prevTargetRef.current !== null && cycleIndex !== prevTargetRef.current) {
                router.refresh()
            }
            prevTargetRef.current = cycleIndex

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
                s2: secondsStr[1],
            })
        }

        updateTimer()
        const timer = setInterval(updateTimer, 1000)

        return () => clearInterval(timer)
    }, [router])

    return (
        <div className="flex items-center gap-3 select-none">
            <span className="text-[12px] font-normal leading-[1.40] tracking-[0] text-[#62666d] uppercase font-semibold tracking-wider font-mono">
                Resets in
            </span>
            <div className="flex items-center gap-1">
                {Object.values(timeDigits).map((digit, i) => (
                    <React.Fragment key={i}>
                        <span className="bg-[#141516] border border-[#23252a] px-2 py-1 rounded text-xs font-mono font-bold text-[#f7f8f8]">
                            {digit}
                        </span>
                        {i % 2 === 1 && i < 5 && (
                            <span className="text-[#62666d] font-bold mx-0.5 animate-pulse">:</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}