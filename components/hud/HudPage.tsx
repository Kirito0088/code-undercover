import type { ReactNode } from "react"

interface HudPageProps {
    eyebrow?: string
    title?: ReactNode
    subtitle?: ReactNode
    status?: ReactNode
    children: ReactNode
    maxWidth?: string
    compact?: boolean
}

/**
 * Unified "agent HUD" page scaffold. Owns the single source of truth for the
 * scanline grid background, the CRT sweep overlay, the page container width,
 * and the corner-bracketed header tile — so every authenticated page aligns
 * to the same horizontal rhythm instead of re-implementing its own chrome.
 */
export function HudPage({
    eyebrow,
    title,
    subtitle,
    status,
    children,
    maxWidth = "max-w-[1280px]",
    compact = false,
}: HudPageProps) {
    return (
        <div className="flex-1 bg-bg min-h-[calc(100dvh-3.5rem)] relative text-text font-mono selection:bg-accent/20 overflow-x-hidden">
            {/* Scanline Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(183,135,66,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(183,135,66,0.04)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-[1]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none z-[1] opacity-40"></div>

            {/* CRT Scanline Sweep Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
                <div className="w-full h-24 bg-gradient-to-b from-transparent via-accent/5 to-transparent absolute top-0 left-0 right-0 animate-scanline-sweep"></div>
            </div>

            <div
                className={`relative z-10 ${maxWidth} mx-auto flex flex-col gap-6 ${
                    compact ? "p-3 sm:p-4" : "px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
                }`}
            >
                {(eyebrow || title) && (
                    <header className="bg-surface border border-border rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                        {/* Corner brackets — signature HUD mark */}
                        <span className="absolute top-0 left-0 size-3 border-t border-l border-accent/40 pointer-events-none"></span>
                        <span className="absolute top-0 right-0 size-3 border-t border-r border-accent/40 pointer-events-none"></span>
                        <span className="absolute bottom-0 left-0 size-3 border-b border-l border-accent/40 pointer-events-none"></span>
                        <span className="absolute bottom-0 right-0 size-3 border-b border-r border-accent/40 pointer-events-none"></span>

                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(183,135,66,0.04),transparent_70%)] pointer-events-none"></div>

                        <div className="text-left relative z-10">
                            {eyebrow && (
                                <span className="text-[10px] font-mono tracking-widest text-muted uppercase select-none">
                                    {eyebrow}
                                </span>
                            )}
                            <h1 className="text-2xl md:text-3xl font-bold font-sans text-accent tracking-tight mt-0.5">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-xs text-muted font-sans mt-0.5">{subtitle}</p>
                            )}
                        </div>

                        {status && (
                            <div className="relative z-10 shrink-0 self-start sm:self-auto">{status}</div>
                        )}
                    </header>
                )}
                {children}
            </div>
        </div>
    )
}
