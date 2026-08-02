import { Swords, ShieldAlert } from "lucide-react"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import type { Sector } from "./types"

// Server component — no state, renders straight from props.
// (Named SectorCard, not MissionCard: that filename is a real, unrelated
// component already used by app/debug-lab/page.tsx — see MissionCard.tsx.)
export default function SectorCard({ sector, href }: { sector: Sector; href: string }) {
    const percent = sector.missionsTotal > 0 ? Math.round((sector.missionsDone / sector.missionsTotal) * 100) : 0

    const body = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div
                    className={`size-8 rounded-[9px] grid place-items-center border ${
                        sector.locked
                            ? "bg-dash-surface-3 border-dash-line text-dash-text-dim"
                            : "bg-[var(--dash-accent-wash)] border-dash-accent-mid text-dash-accent"
                    }`}
                >
                    {sector.locked ? <ShieldAlert className="size-[15px] stroke-[1.75]" /> : <Swords className="size-[15px] stroke-[1.75]" />}
                </div>

                {sector.locked ? (
                    <span className="inline-flex items-center gap-1.5 h-[21px] px-2 rounded-full border border-dash-line font-dash-mono text-[9.5px] font-medium tracking-[.1em] uppercase text-dash-text-faint">
                        <ShieldAlert className="size-2.5" />
                        Locked
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 h-[21px] px-2 rounded-full border border-dash-accent-mid bg-[var(--dash-accent-wash)] font-dash-mono text-[9.5px] font-medium tracking-[.1em] uppercase text-dash-accent">
                        <span className="dash-pulse size-[5px] rounded-full bg-current" />
                        In progress
                    </span>
                )}
            </div>

            <div className="text-[14.5px] font-semibold tracking-tight mt-3 mb-0.5">{sector.title}</div>
            <p className="text-xs text-dash-text-dim m-0">{sector.subtitle}</p>

            <div className="flex gap-6 mt-4 pt-3 border-t border-dash-line">
                <div>
                    <div className="text-[10.5px] text-dash-text-faint mb-0.5">Sectors decrypted</div>
                    <div className="font-dash-mono text-sm font-medium tabular-nums">
                        {sector.missionsDone} / {sector.missionsTotal}
                    </div>
                </div>
                <div>
                    <div className="text-[10.5px] text-dash-text-faint mb-0.5">Earned</div>
                    <div className="font-dash-mono text-sm font-medium tabular-nums text-dash-orange">{sector.apEarned} AP</div>
                </div>
            </div>

            <div className="h-1 rounded-full bg-dash-surface-4 overflow-hidden mt-3">
                <div
                    className={`h-full rounded-full transition-[width] duration-500 ${sector.locked ? "bg-dash-line-strong" : "bg-dash-accent"}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </>
    )

    const sharedClasses =
        "relative text-left w-full bg-dash-surface border rounded-[14px] p-4 flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,.035)] transition-[border-color,background-color,transform,box-shadow] duration-150"

    if (sector.locked) {
        return (
            <Link
                href={href}
                data-tip={sector.unlockHint}
                className={`${sharedClasses} border-dash-line opacity-45 hover:opacity-[.68] cursor-not-allowed`}
            >
                {body}
            </Link>
        )
    }

    return (
        <Link
            href={href}
            className={`dash-active-trace ${sharedClasses} border-dash-accent-mid bg-dash-surface-2 hover:border-dash-line-strong hover:-translate-y-px active:translate-y-px`}
        >
            <span className="absolute left-[-1px] top-4 bottom-4 w-[2px] rounded-full bg-dash-accent" />
            {body}
        </Link>
    )
}
