import React from "react"

export default function DashboardLoading() {
    return (
        <div className="flex-grow bg-[#14141A] min-h-[calc(100vh-3.5rem)] relative">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
                
                {/* Left Sidebar Skeleton */}
                <aside className="w-full md:w-[250px] shrink-0 flex flex-col gap-6">
                    {/* User Profile Block */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-5 flex flex-col items-center animate-pulse">
                        <div className="size-20 bg-[#2A2A35] rounded-full mb-3"></div>
                        <div className="h-4 bg-[#2A2A35] w-2/3 rounded-full mb-2"></div>
                        <div className="h-3 bg-[#2A2A35] w-1/2 rounded-full"></div>
                        
                        <div className="w-full mt-6 space-y-2">
                            <div className="h-2 bg-[#2A2A35] w-1/3 rounded-full"></div>
                            <div className="h-2 w-full bg-[#2A2A35] rounded-full"></div>
                        </div>
                    </div>

                    {/* Navigation list */}
                    <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-3 flex flex-col gap-2 animate-pulse">
                        <div className="h-10 bg-[#2A2A35] w-full rounded-lg"></div>
                        <div className="h-10 bg-[#2A2A35] w-full rounded-lg"></div>
                        <div className="h-10 bg-[#2A2A35] w-full rounded-lg"></div>
                    </div>
                </aside>

                {/* Main Content Skeleton */}
                <main className="flex-grow min-w-0 flex flex-col gap-6 animate-pulse">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="h-6 bg-[#1C1C24] border border-[#323242] w-48 rounded-md"></div>
                            <div className="h-3 bg-[#1C1C24] border border-[#323242] w-64 rounded-md"></div>
                        </div>
                        <div className="h-5 bg-[#1C1C24] border border-[#323242] w-24 rounded-full"></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#1C1C24] border border-[#323242] h-24 rounded-xl"></div>
                        <div className="bg-[#1C1C24] border border-[#323242] h-24 rounded-xl"></div>
                        <div className="bg-[#1C1C24] border border-[#323242] h-24 rounded-xl"></div>
                        <div className="bg-[#1C1C24] border border-[#323242] h-24 rounded-xl"></div>
                    </div>

                    {/* Progress Bar Card */}
                    <div className="bg-[#1C1C24] border border-[#323242] h-20 rounded-xl"></div>

                    {/* Levels Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#1C1C24] border border-[#323242] h-40 rounded-xl"></div>
                        <div className="bg-[#1C1C24] border border-[#323242] h-40 rounded-xl"></div>
                        <div className="bg-[#1C1C24] border border-[#323242] h-40 rounded-xl"></div>
                    </div>
                </main>
            </div>
        </div>
    )
}
