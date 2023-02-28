import { useEthers } from '@usedapp/core'

interface WhichWallet {
  isMetaMask: boolean
  isBraveWallet: boolean
  isWalletConnect: boolean
  isPortis: boolean
}

export function useWhichWallet(): WhichWallet {
  const { library } = useEthers()
  const { isBraveWallet } = (window.ethereum as any) ?? {}
  const { isMetaMask, bridge: isWalletConnect, isPortis } = (library as any)?.provider ?? {}
  return { isMetaMask, isBraveWallet, isWalletConnect, isPortis }
}
