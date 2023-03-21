import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId, useEthers } from '@usedapp/core'
import { useCallback } from 'react'
import { SupportedChainId } from 'src/constants/chainIDs'
import { useChainId } from 'src/hooks/chainId/useChainId'
import { unpadHexString } from 'src/utils/formatters/unpadHexString'

interface AddEthereumChainParameter {
  chainId: string
  chainName: string
  rpcUrls: string[]
  blockExplorerUrls?: string[]
}

interface SwitchEthereumChainParameter {
  chainId: string
}

const toHex = (value: number) => unpadHexString(BigNumber.from(value).toHexString())
const goerliChainId = toHex(ChainId.Goerli)
const errChainNotAddedYet = 4902

const addGoerliChain: AddEthereumChainParameter = {
  chainId: goerliChainId,
  chainName: 'Goerli',
  rpcUrls: ['https://goerli.blockpi.network/v1/rpc/public'],
  blockExplorerUrls: ['https://goerli.etherscan.io'],
}
const getSwitchChainParam = (chainId: SupportedChainId): SwitchEthereumChainParameter => ({ chainId: toHex(chainId) })

export function useSwitchChain() {
  const { library } = useEthers()
  const chainId = useChainId()

  return useCallback(async () => {
    if (library !== undefined) {
      await switchOrAddChain(library as JsonRpcProvider, chainId)
    }
  }, [library, chainId])
}

async function switchOrAddChain(library: JsonRpcProvider, chainId: SupportedChainId) {
  try {
    await library.send('wallet_switchEthereumChain', [getSwitchChainParam(chainId)])
  } catch (switchChainError: any) {
    if (switchChainError.code === errChainNotAddedYet) {
      await addChain(library)
    }
  }
}

async function addChain(library: JsonRpcProvider) {
  try {
    await library.send('wallet_addEthereumChain', [addGoerliChain])
  } catch (error: any) {
    return // error already logged by MetaMask
  }
}
