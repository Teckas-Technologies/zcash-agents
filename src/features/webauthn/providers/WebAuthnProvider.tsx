"use client"

import type { ReactNode } from "react"

import { WebAuthnDialog } from "@/features/webauthn/components/WebAuthnDialog"

export function WebAuthnProvider({ children }: { children: ReactNode }) {
    return (
        <>
            {children}
            <WebAuthnDialog />
        </>
    )
}
