"use client"

import { useEffect, useState } from "react"

export default function CountdownTimer() {
    const [timeDigits, setTimeDigits] = useState({ h1: "0", h2: "0", m1: "0", m2: "0" })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            // Reset daily at midnight UTC
            const nextReset = new Date()
            nextReset.setUTCHours(24, 0, 0, 0)
            
            const difference = nextReset.getTime() - now.getTime()
            if (difference <= 0) {
                return { h1: "0", h2: "0", m1: "0", m2: "0" }
            }

            const totalHours = Math.floor(difference / (1000 * 60 * 60))
            const totalMinutes = Math.floor((difference / 1000 / 60) % 60)

            const hoursStr = totalHours.toString().padStart(2, "0")
            const minutesStr = totalMinutes.toString().padStart(2, "0")

            return {
                h1: hoursStr[0],
                h2: hoursStr[1],
                m1: minutesStr[0],
                m2: minutesStr[1],
            }
        }

        setTimeDigits(calculateTimeLeft())
        const timer = setInterval(() => {
            setTimeDigits(calculateTimeLeft())
        }, 60000) // Update every minute is enough since we only show hours & minutes

        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flex items-center gap-3 select-none">
            <span className="text-[#8B8BA7] uppercase font-bold tracking-wider text-[10px]">Leaderboard resets in:</span>
            <div className="flex items-center gap-1">
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.h1}</span>
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.h2}</span>
                <span className="text-[#5C5C7A] font-bold mx-0.5 animate-pulse">:</span>
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.m1}</span>
                <span className="bg-[#1C1C24] border border-[#2B2B38] px-2 py-1 rounded text-xs font-mono font-bold text-[#F1F1F5] shadow-inner">{timeDigits.m2}</span>
            </div>
        </div>
    )
}
