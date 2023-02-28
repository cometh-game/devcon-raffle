import { useEthers } from '@usedapp/core'

import { isSupportedChainId, SupportedChainId } from '../../constants/chainIDs'

// This hook:
// - when wallet is not connected
//    - returns `readOnlyChainId`
// - when wallet is connected
//   - when network not listed in `networks` is chosen
//     - returns undefined
//   - when network listed in `networks` is chosen
//     - returns this network's chainId
export function useInjectedProviderChainId(): SupportedChainId | undefined {
  const { chainId } = useEthers()

  if (chainId === undefined) {
    return undefined
  }

  if (!isSupportedChainId(chainId)) {
    //throw new Error('chainId returned by useEthers is not one of SupportedChainIds')
    return undefined
  }

  return chainId
}
