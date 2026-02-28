"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export function NavBackButton() {
    const pathname = usePathname()

    // Only show the back button if we are currently inside a mission
    if (!pathname?.startsWith('/mission/')) return null;

    return (
        <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs font-mono text-gray-400 hover:text-white transition-colors border border-gray-800 bg-gray-900/50 px-3 py-1.5 rounded-full hover:border-gray-600 ml-4 group"
        >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            BACK TO MISSION CONTROL
        </Link>
    )
}
