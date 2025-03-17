"use client"

import { useEffect, useState } from "react"

export function useMobile() {
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Only run on client side
        if (typeof window !== "undefined") {
            const userAgent = window.navigator.userAgent.toLowerCase()
            setIsIOS(/iphone|ipad|ipod/.test(userAgent))
        }
    }, [])

    return { isIOS }
}

