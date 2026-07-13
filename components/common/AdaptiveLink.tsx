"use client"

import React, { useEffect, useState } from "react"
import Link, { LinkProps } from "next/link"
import { useNetwork } from "./NetworkProvider"

interface AdaptiveLinkProps extends LinkProps {
    children: React.ReactNode
    className?: string
    id?: string
}

export function AdaptiveLink({ children, className, id, ...props }: AdaptiveLinkProps) {
    const { isFastConnection } = useNetwork()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // During SSR and initial hydration, use default Next.js prefetching behavior (null)
    // to prevent server-client markup/attribute mismatches.
    const prefetchValue = mounted ? isFastConnection : undefined

    return (
        <Link className={className} id={id} prefetch={prefetchValue} {...props}>
            {children}
        </Link>
    )
}
