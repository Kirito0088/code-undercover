import React from "react"

export default function DashboardLoading() {
    return (
        <div className="flex-grow min-h-[calc(100vh-3.5rem)] relative overflow-hidden bg-[linear-gradient(160deg,#204a3a_0%,#17342a_45%,#0d2118_100%)]">
            {/* chalk noise */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
                    opacity: 0.55,
                    mixBlendMode: "overlay",
                }}
            />

            <div className="relative z-10 max-w-[1204px] mx-auto px-6 py-12 flex flex-col items-center animate-pulse">
                {/* heading skeleton */}
                <div className="h-12 w-72 rounded-md bg-[#f7f2e7]/10 mb-8"></div>

                {/* clearance boards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[420px] md:max-w-none">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex flex-col">
                            {/* tab */}
                            <div className="mx-auto h-7 w-32 rounded bg-[#f7f2e7]/15 mb-2"></div>
                            {/* frame + polaroid */}
                            <div className="rounded-t-md bg-[#3b2a1c] p-4 shadow-xl">
                                <div className="aspect-square rounded-sm bg-[#ecdfc0]"></div>
                                <div className="mx-auto mt-3 h-4 w-28 rounded bg-[#a5453a]/60"></div>
                            </div>
                            {/* body */}
                            <div className="flex-1 rounded-b-md bg-[#7a2e28] p-5 flex flex-col items-center gap-3">
                                <div className="h-3 w-4/5 rounded bg-white/20"></div>
                                <div className="h-3 w-3/5 rounded bg-white/20"></div>
                                <div className="mt-2 h-9 w-32 rounded bg-[#f0cf8a]/70"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
