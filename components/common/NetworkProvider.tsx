"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface NetworkContextType {
    isFastConnection: boolean
}

const NetworkContext = createContext<NetworkContextType>({
    isFastConnection: true, // Default to true (optimistic) during SSR/hydration
})

export const useNetwork = () => useContext(NetworkContext)

// Extended Navigator interface for Chromium connection status API
interface NetworkInformation {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g"
    saveData?: boolean
    addEventListener?: (type: string, listener: () => void) => void
    removeEventListener?: (type: string, listener: () => void) => void
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [isFastConnection, setIsFastConnection] = useState(true)

    useEffect(() => {
        const nav = navigator as Navigator & { connection?: NetworkInformation }
        const connection = nav.connection
        const controller = new AbortController()
        let active = true

        // 1. If navigator.connection is supported (Chrome/Edge/Opera/Android)
        if (connection) {
            const checkConnection = () => {
                if (!active) return
                const type = connection.effectiveType
                const isSlow = type === "slow-2g" || type === "2g" || type === "3g" || connection.saveData === true
                setIsFastConnection(!isSlow)
            }

            checkConnection()

            if (connection.addEventListener) {
                connection.addEventListener("change", checkConnection)
                return () => {
                    active = false
                    controller.abort()
                    if (connection.removeEventListener) {
                        connection.removeEventListener("change", checkConnection)
                    }
                }
            }
            return () => {
                active = false
                controller.abort()
            }
        }

        // 2. Fallback for browsers without navigator.connection (Safari/iOS/Firefox)
        const measureLatency = async () => {
            const start = performance.now()
            try {
                const res = await fetch("/api/ping", { 
                    cache: "no-store",
                    signal: controller.signal
                })
                if (!active) return
                if (res.ok) {
                    const rtt = performance.now() - start
                    // Fast connection if round trip latency is under 150ms
                    setIsFastConnection(rtt < 150)
                } else {
                    setIsFastConnection(false)
                }
            } catch (err) {
                if (!active) return
                if (err instanceof Error && err.name === "AbortError") {
                    return
                }
                setIsFastConnection(false) // Safe fallback on error
            }
        }

        measureLatency()

        return () => {
            active = false
            controller.abort()
        }
    }, [])

    return (
        <NetworkContext.Provider value={{ isFastConnection }}>
            {children}
        </NetworkContext.Provider>
    )
}
