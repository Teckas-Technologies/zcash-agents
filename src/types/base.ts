export enum BaseTokenConvertEnum {
    USD = "usd",
}

export type BaseTokenBalance = {
    /** bigint in string */
    balance: string
    balanceUsd?: string
    convertedLast?: {
        [key in BaseTokenConvertEnum]: string
    }
}

export type SupportedChainName =
    | "eth"
    | "near"
    | "base"
    | "arbitrum"
    | "bitcoin"
    | "solana"
    | "dogecoin"
    | "turbochain"
    | "aurora"
    | "xrpledger"
    | "zcash"
    | "gnosis"
    | "berachain"

export interface FungibleTokenInfo extends Partial<BaseTokenBalance> {
    defuseAssetId: string
    address: string
    symbol: string
    name: string
    decimals: number
    icon: string
    /** @deprecated */
    chainId: string
    chainIcon: string
    chainName: SupportedChainName
    /** @deprecated */
    routes: string[]
}

export interface NativeTokenInfo extends Partial<BaseTokenBalance> {
    defuseAssetId: string
    type: "native"
    /** this is a hack to have backward capability with `FungibleTokenInfo`, prefer using "type" property */
    // address: "native"
    symbol: string
    name: string
    decimals: number
    icon: string
    /** @deprecated */
    chainId: string
    chainIcon: string
    chainName: SupportedChainName
    /** @deprecated */
    routes: string[]
}

export type BaseTokenInfo = FungibleTokenInfo | NativeTokenInfo

/**
 * A virtual aggregation of the same token across multiple blockchains.
 * This is not an on-chain token but a unified view of network-specific tokens
 * with shared properties.
 *
 * The name avoids "NativeMultichainAsset" to clarify that it doesn't represent
 * an actual multichain token, just a virtual abstraction.
 */
export interface UnifiedTokenInfo {
    unifiedAssetId: string
    symbol: string
    name: string
    decimals: number
    icon: string
    groupedTokens: BaseTokenInfo[]
}

export function isBaseToken(
    token: BaseTokenInfo | UnifiedTokenInfo
): token is BaseTokenInfo {
    return "defuseAssetId" in token
}

export function isUnifiedToken(
    token: BaseTokenInfo | UnifiedTokenInfo
): token is UnifiedTokenInfo {
    return "unifiedAssetId" in token
}

export function isFungibleToken(
    token: BaseTokenInfo | UnifiedTokenInfo
): token is FungibleTokenInfo {
    return isBaseToken(token) && "address" in token && token.address !== "native"
}

export function isNativeToken(
    token: BaseTokenInfo | UnifiedTokenInfo
): token is NativeTokenInfo {
    return isBaseToken(token) && "type" in token && token.type === "native"
}