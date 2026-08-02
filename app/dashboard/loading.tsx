import React from "react"

// Matches the real layout's geometry so nothing jumps on hydrate: rail sidebar,
// topbar strip, hero card, three sector cards, five-row table. Nothing green —
// a skeleton must not look like live data.
export default function DashboardLoading() {
    return (
        <div className="dash-theme flex min-h-[calc(100dvh-56px)] bg-dash-bg">
            {/* Font vars come from the app/dashboard/layout.tsx wrapper this renders inside */}
            <aside className="hidden md:flex flex-col w-[252px] shrink-0 bg-dash-surface border-r border-dash-line p-3 gap-3">
                <div className="h-[52px]" />
                <div className="dash-shimmer h-24 rounded-[14px]" />
                <div className="dash-shimmer h-8 rounded-[8px]" />
                <div className="dash-shimmer h-8 rounded-[8px]" />
                <div className="dash-shimmer h-8 rounded-[8px]" />
            </aside>

            <div className="flex-1 min-w-0 flex flex-col">
                <div className="h-[52px] border-b border-dash-line shrink-0 flex items-center px-5 gap-2">
                    <div className="dash-shimmer h-8 w-40 rounded-[8px]" />
                    <div className="dash-shimmer h-8 w-52 rounded-[8px] ml-auto hidden sm:block" />
                </div>

                <main className="max-w-[1320px] w-full mx-auto px-5 py-6 flex flex-col gap-8">
                    <div className="dash-shimmer h-[178px] rounded-[18px]" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="dash-shimmer h-[168px] rounded-[14px]" />
                        <div className="dash-shimmer h-[168px] rounded-[14px]" />
                        <div className="dash-shimmer h-[168px] rounded-[14px]" />
                    </div>

                    <div className="border border-dash-line rounded-[14px] overflow-hidden">
                        <div className="dash-shimmer h-10" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="dash-shimmer h-11 border-t border-dash-line" style={{ animationDelay: `${i * 90}ms` }} />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
