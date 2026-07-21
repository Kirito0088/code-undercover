import Link from "next/link"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#07080A] text-[#E2E8F0] font-mono flex flex-col items-center justify-center relative p-6">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff4104_1px,transparent_1px),linear-gradient(to_bottom,#00ff4104_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-1"></div>
            
            <div className="max-w-md w-full bg-[#0D0E12] border border-red-500/20 rounded-xl p-8 text-center relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
                <span className="text-[10px] font-mono font-bold text-red-500 tracking-widest uppercase block mb-2">ERROR_CODE // 404</span>
                <h1 className="text-xl font-bold text-[#E2E8F0] tracking-tight mb-4">INTEL NOT FOUND</h1>
                
                <p className="text-xs text-[#8F9F8F] leading-relaxed mb-6 font-sans">
                    The intelligence channel or operative file you are seeking does not exist or has been deleted from active servers. Verify target coordinates.
                </p>

                <div className="border-t border-[#1F261F]/40 pt-6">
                    <Link 
                        href="/dashboard" 
                        className="inline-flex w-full justify-center items-center px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold font-mono transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                        RETURN TO COMMAND HUD
                    </Link>
                </div>
            </div>
        </div>
    )
}
