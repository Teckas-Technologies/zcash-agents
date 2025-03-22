export const getChainIconFromId = (defuseAssetId: string): string => {
    const getAssetIdParts = defuseAssetId.split(":")
    const chain = getAssetIdParts.length ? getAssetIdParts[0] : ""
    switch (chain.toLowerCase()) {
        case "near":
            return "/icons/network/near.svg"
        case "base":
            return "/icons/network/base.svg"
        case "eth":
            return "/icons/network/ethereum.svg"
        case "btc":
            return "/icons/network/btc.svg"
        case "sol":
            return "/icons/wallets/solana-logo-mark.svg"
        default:
            return "/icons/network/near.svg"
    }
}
