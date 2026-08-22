"use client"

import React, { useEffect, useState } from "react"
import Link, { LinkProps } from "next/link"
import { useNetwork } from "./NetworkProvider"

// LinkProps alone covers routing but none of the anchor's own attributes, so
// callers couldn't pass aria-label, onFocus, target, etc. Anchor attributes
// that LinkProps already declares (onClick, onMouseEnter, href, ...) are
// omitted so the two halves can't disagree.
interface AdaptiveLinkProps
    extends LinkProps,
        Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
    children: React.ReactNode
}

export const AdaptiveLink = React.forwardRef<HTMLAnchorElement, AdaptiveLinkProps>(
    function AdaptiveLink({ children, className, id, style, onClick, ...props }, ref) {
        const { isFastConnection } = useNetwork()
        const [mounted, setMounted] = useState(false)

        useEffect(() => {
            setMounted(true)
        }, [])

        // During SSR and initial hydration, use default Next.js prefetching behavior (null)
        // to prevent server-client markup/attribute mismatches.
        const prefetchValue = mounted ? isFastConnection : undefined

        return (
            <Link ref={ref} className={className} id={id} prefetch={prefetchValue} style={style} onClick={onClick} {...props}>
                {children}
            </Link>
        )
    }
)
