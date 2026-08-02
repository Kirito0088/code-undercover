"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { Check } from "lucide-react"

interface ToastItem {
    id: number
    message: string
    ap?: string
}

type ToastFn = (message: string, ap?: string) => void

const ToastContext = createContext<ToastFn | null>(null)

export function useToast(): ToastFn {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error("useToast must be used within ToastProvider")
    return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const idRef = useRef(0)

    const toast = useCallback<ToastFn>((message, ap) => {
        const id = ++idRef.current
        setToasts((prev) => [...prev, { id, message, ap }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 2600)
    }, [])

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed right-5 bottom-5 z-[400] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className="dash-toast-in flex items-center gap-2.5 px-4 py-2.5 min-w-[250px] bg-dash-surface-2 border border-dash-line-strong rounded-[14px] shadow-[0_12px_32px_-8px_rgba(0,0,0,.7)] text-[12.5px] text-dash-text"
                    >
                        <span className="size-[19px] rounded-full grid place-items-center shrink-0 bg-[var(--dash-accent-wash)] text-dash-accent">
                            <Check className="size-[11px] stroke-[3]" />
                        </span>
                        <span>{t.message}</span>
                        {t.ap && <span className="ml-auto font-dash-mono text-[11px] text-dash-orange">{t.ap}</span>}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
