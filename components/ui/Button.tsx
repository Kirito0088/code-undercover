import React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    ref?: React.Ref<HTMLButtonElement>
}

const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-500 transition-colors",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-[#323242] text-[#8B8BA7] hover:bg-[#2A2A35] hover:text-[#F1F1F5] hover:border-[#3F3F52] transition-colors",
    secondary: "bg-[#2A2A35] text-[#F1F1F5] border border-[#323242] hover:bg-[#323242] hover:border-[#3F3F52] transition-colors",
    ghost: "hover:bg-[#2A2A35] hover:text-[#F1F1F5] text-[#8B8BA7] transition-colors",
    link: "text-[#39D375] underline-offset-4 hover:underline hover:text-indigo-300",
}

const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8 text-lg",
    icon: "size-10",
}

const Button = ({ className, variant = "default", size = "default", ref, ...props }: ButtonProps) => {
    return (
        <button
            type="button"
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14141A] disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    )
}
Button.displayName = "Button"

export { Button }
