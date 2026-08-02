"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { Search, Lock, Play, FileText } from "lucide-react"
import { getCmdkOpenSnapshot, getCmdkOpenServerSnapshot, subscribeCmdkOpen, closeCmdk, openCmdk } from "./cmdkStore"
import { COMMAND_PAGES } from "./mock"
import { useToast } from "./ToastProvider"
import type { Mission } from "./types"

type Item = { kind: "mission"; mission: Mission } | { kind: "page"; label: string; href: string }

export default function CommandPalette({ missions }: { missions: Mission[] }) {
    const open = useSyncExternalStore(subscribeCmdkOpen, getCmdkOpenSnapshot, getCmdkOpenServerSnapshot)
    const [query, setQuery] = useState("")
    const [index, setIndex] = useState(0)
    const { push } = useRouter()
    const toast = useToast()

    const inputRef = useRef<HTMLInputElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<Element | null>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const items: Item[] = useMemo(() => {
        const term = query.trim().toLowerCase()
        const missionItems: Item[] = missions
            .filter((m) => `${String(m.index).padStart(2, "0")} ${m.name} ${m.hint}`.toLowerCase().includes(term))
            .map((mission) => ({ kind: "mission", mission }))
        const pageItems: Item[] = COMMAND_PAGES.filter((p) => p.label.toLowerCase().includes(term)).map((p) => ({
            kind: "page",
            label: p.label,
            href: p.href,
        }))
        return [...missionItems, ...pageItems]
    }, [query, missions])

    // Global ⌘K / Ctrl+K
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                if (getCmdkOpenSnapshot()) closeCmdk()
                else {
                    triggerRef.current = document.activeElement
                    openCmdk()
                }
            }
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [])

    // Reset + focus on open, restore focus on close
    useEffect(() => {
        if (open) {
            triggerRef.current = triggerRef.current ?? document.activeElement
            setQuery("")
            setIndex(0)
            requestAnimationFrame(() => inputRef.current?.focus())
        } else if (triggerRef.current instanceof HTMLElement) {
            triggerRef.current.focus()
            triggerRef.current = null
        }
    }, [open])

    useEffect(() => {
        setIndex(0)
    }, [query])

    useEffect(() => {
        const el = listRef.current?.querySelector('[aria-selected="true"]')
        el?.scrollIntoView({ block: "nearest" })
    }, [index])

    const act = async (item: Item) => {
        if (item.kind === "page") {
            closeCmdk()
            push(item.href)
            return
        }

        const { mission } = item
        if (mission.state === "locked") {
            toast(`${mission.name} is still locked`)
            return
        }

        closeCmdk()
        try {
            const res = await fetch("/api/missions/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id }),
            })
            const data = await res.json()
            if (res.ok && data.redirect) push(data.redirect)
        } catch {
            console.error("Failed to open mission")
        }
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault()
            closeCmdk()
            return
        }
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setIndex((i) => Math.min(i + 1, items.length - 1))
            return
        }
        if (e.key === "ArrowUp") {
            e.preventDefault()
            setIndex((i) => Math.max(i - 1, 0))
            return
        }
        if (e.key === "Enter") {
            e.preventDefault()
            const item = items[index]
            if (item) act(item)
            return
        }
        if (e.key === "Tab") {
            // Single-field focus trap: everything actionable is reachable via
            // arrow keys, so keep Tab from escaping the dialog.
            e.preventDefault()
        }
    }

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[300] flex items-start justify-center px-4 pt-[12vh] pb-4 bg-black/70 backdrop-blur-[3px]"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeCmdk()
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                onKeyDown={onKeyDown}
                className="dash-cmdk-in w-full max-w-[520px] bg-dash-surface-2 border border-dash-line-strong rounded-[18px] shadow-[0_12px_32px_-8px_rgba(0,0,0,.7)] overflow-hidden"
            >
                <div className="flex items-center gap-2.5 h-12 px-4 border-b border-dash-line">
                    <Search className="size-4 stroke-[1.75] text-dash-text-faint" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Jump to a mission or page…"
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-dash-text-faint"
                    />
                    <kbd className="font-dash-mono text-[9.5px] text-dash-text-faint border border-dash-line-strong rounded px-1 py-px bg-dash-surface-3">
                        ESC
                    </kbd>
                </div>

                <div ref={listRef} className="max-h-80 overflow-y-auto p-1" role="listbox">
                    {items.length === 0 && (
                        <div className="p-5 text-center text-dash-text-faint text-[12.5px]">
                            No matches. Try a mission number or page name.
                        </div>
                    )}
                    {items.map((item, i) => {
                        const selected = i === index
                        const key = item.kind === "mission" ? item.mission.id : item.href
                        return (
                            <button
                                key={key}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onMouseEnter={() => setIndex(i)}
                                onClick={() => act(item)}
                                className={`flex items-center gap-2.5 w-full h-9 px-2.5 rounded-[8px] text-[13px] text-left transition-colors ${
                                    selected ? "bg-dash-surface-3 text-dash-text" : "text-dash-text-dim"
                                }`}
                            >
                                {item.kind === "mission" ? (
                                    <>
                                        {item.mission.state === "locked" ? (
                                            <Lock className="size-3.5 stroke-[1.75] shrink-0" />
                                        ) : (
                                            <Play className="size-3.5 stroke-[1.75] shrink-0" />
                                        )}
                                        <span className="truncate">
                                            {String(item.mission.index).padStart(2, "0")} · {item.mission.name}
                                        </span>
                                        <span className="ml-auto font-dash-mono text-[10.5px] text-dash-orange shrink-0">
                                            +{item.mission.ap} AP
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="size-3.5 stroke-[1.75] shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </>
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center gap-4 px-4 py-2 border-t border-dash-line text-[10.5px] text-dash-text-faint">
                    <span className="inline-flex items-center gap-1.5">
                        <kbd className="font-dash-mono border border-dash-line-strong rounded px-1 py-px bg-dash-surface-3">↑</kbd>
                        <kbd className="font-dash-mono border border-dash-line-strong rounded px-1 py-px bg-dash-surface-3">↓</kbd>
                        navigate
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <kbd className="font-dash-mono border border-dash-line-strong rounded px-1 py-px bg-dash-surface-3">⏎</kbd>
                        open
                    </span>
                    <span className="ml-auto">Code Undercover</span>
                </div>
            </div>
        </div>
    )
}
