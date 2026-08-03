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
            className="flex items-center gap-1.5 text-xs text-[#8F9F8F] hover:text-[#E2E8F0] transition-colors border border-[#1F261F] bg-[#0D0E12] px-3 py-1.5 rounded-md hover:border-[#2A3A2A] ml-4 group"
        >
            <ChevronLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
        </Link>
    )
}
