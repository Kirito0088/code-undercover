import React, { forwardRef } from "react"
// Re-writing to not use Radix since it's not in deps
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {

        const variants = {
            default: "bg-green-600 text-white hover:bg-green-700 shadow-[0_0_15px_rgba(22,163,74,0.3)]",
            destructive: "bg-red-500 text-white hover:bg-red-600",
            outline: "border border-green-600 text-green-500 hover:bg-green-950/30",
            secondary: "bg-gray-800 text-gray-100 hover:bg-gray-700",
            ghost: "hover:bg-gray-800 hover:text-gray-100 text-gray-400",
            link: "text-green-500 underline-offset-4 hover:underline",
        }

        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8 text-lg",
            icon: "h-10 w-10",
        }

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
