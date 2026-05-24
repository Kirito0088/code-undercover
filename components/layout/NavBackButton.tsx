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
            className="flex items-center gap-1.5 text-xs text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors border border-[#22222E] bg-[#111118] px-3 py-1.5 rounded-md hover:border-[#2E2E3F] ml-4 group"
        >
            <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
        </Link>
    )
}
