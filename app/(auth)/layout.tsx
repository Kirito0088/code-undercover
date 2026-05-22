"use client"

import LetterGlitch from "@/components/LetterGlitch"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
            {/* Shared animated glitch background — persists across login/register navigation */}
            <div className="fixed inset-0 z-0 opacity-40">
                <LetterGlitch
                    glitchSpeed={50}
                    centerVignette={true}
                    outerVignette={false}
                    smooth={true}
                />
            </div>

            {children}
        </div>
    )
}
