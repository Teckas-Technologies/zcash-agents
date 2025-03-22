"use client"

import { useSentrySetUser } from "@/hooks/useSetSentry"

export const SentryTracer = () => {
    useSentrySetUser()
    return null
}
