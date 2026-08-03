import React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    ref?: React.Ref<HTMLInputElement>
}

const Input = ({ className, type, ref, ...props }: InputProps) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-md border border-[#1F261F] bg-[#0D0E12] px-3 py-2 text-sm text-[#E2E8F0] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#4A5D4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                className
            )}
            ref={ref}
            {...props}
        />
    )
}
Input.displayName = "Input"

export { Input }
