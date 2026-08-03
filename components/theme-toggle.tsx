"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
    const { theme, toggle } = useTheme()

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="inline-flex items-center justify-center size-9 rounded-lg border border-border bg-surface text-text hover:text-accent transition-colors"
        >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
    )
}
