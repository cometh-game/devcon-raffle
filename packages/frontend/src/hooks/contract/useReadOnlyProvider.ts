import { BaseProvider } from '@ethersproject/providers'
import { useReadonlyNetworks } from '@usedapp/core/dist/esm/src/providers'
import { useReadOnlyChainId } from 'src/hooks/chainId/useReadOnlyChainId'

export function useReadOnlyProvider(): BaseProvider {
  const providers = useReadonlyNetworks()
  const chainId = useReadOnlyChainId()
  const readOnlyProvider = providers[chainId]

  if (readOnlyProvider === undefined) {
    throw new Error('readOnlyProvider is not defined')
  }

  return readOnlyProvider
}
