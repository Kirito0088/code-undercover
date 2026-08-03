"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "dark" | "light"

interface ThemeContextValue {
    theme: Theme
    toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = "cu-theme"

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Starts "dark" to match the server-rendered markup and the :root default,
    // then syncs to the real persisted value (already applied to <html> by the
    // blocking inline script in app/layout.tsx) right after mount.
    const [theme, setTheme] = useState<Theme>("dark")

    useEffect(() => {
        const current = document.documentElement.dataset.theme === "light" ? "light" : "dark"
        setTheme(current)
    }, [])

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"))

    return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
    return ctx
}
