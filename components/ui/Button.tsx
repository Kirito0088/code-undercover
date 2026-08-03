import React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    ref?: React.Ref<HTMLButtonElement>
}

const variants = {
    default: "bg-accent text-accent-fg hover:opacity-90 transition-opacity",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-border text-muted hover:bg-surface hover:text-text hover:border-accent/40 transition-colors",
    secondary: "bg-surface text-text border border-border hover:border-accent/40 transition-colors",
    ghost: "hover:bg-surface hover:text-text text-muted transition-colors",
    link: "text-accent underline-offset-4 hover:underline",
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
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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
