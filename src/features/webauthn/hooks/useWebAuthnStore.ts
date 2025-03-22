import {
    getCredential,
    saveCredential,
} from "@/features/webauthn/lib/webAuthnCredentialService"
import {
    createNew,
    signIn,
    signMessage,
} from "@/features/webauthn/lib/webauthnService"
import { createWebAuthnStore } from "../lib/createWebAuthnStore"

export const useWebAuthnStore = createWebAuthnStore({
    async signIn() {
        const rawId = await signIn()
        return getCredential(rawId)
    },
    async createNew(passkeyName) {
        const credential = await createNew(passkeyName)
        await saveCredential(credential)
        return credential
    },
    signMessage,
})

// export function useWebAuthnActions() {
//     return useWebAuthnStore((state) => ({
//         signIn: state.signIn,
//         createNew: state.createNew,
//         signMessage: state.signMessage,
//         signOut: state.signOut,
//     }))
// }

export function useWebAuthnActions() {
    const signIn = useWebAuthnStore((state) => state.signIn);
    const createNew = useWebAuthnStore((state) => state.createNew);
    const signMessage = useWebAuthnStore((state) => state.signMessage);
    const signOut = useWebAuthnStore((state) => state.signOut);

    return { signIn, createNew, signMessage, signOut };
}


export function useWebAuthnCurrentCredential() {
    return useWebAuthnStore((state) => state.credential)
}

export { useWebAuthnUIStore } from "./useWebAuthnUiStore"
