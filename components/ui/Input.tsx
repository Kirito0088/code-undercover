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
                "flex h-10 w-full rounded-md border border-[#323242] bg-[#14141A] px-3 py-2 text-sm text-[#F1F1F5] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#5C5C7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                className
            )}
            ref={ref}
            {...props}
        />
    )
}
Input.displayName = "Input"

export { Input }
