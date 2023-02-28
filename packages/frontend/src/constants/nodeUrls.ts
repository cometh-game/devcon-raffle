import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from '@usedapp/core'
import { SupportedChainId } from 'src/constants/chainIDs'

const NODE_URLS: Record<SupportedChainId, string> = {
  [ChainId.Mainnet]: 'https://eth.llamarpc.com',
  [ChainId.Goerli]: 'https://goerli.blockpi.network/v1/rpc/public', //'https://rpc.ankr.com/eth_goerli',
  [ChainId.Hardhat]: 'http://localhost:8545',
}

export function providerWithInterval(chainId: SupportedChainId, pollingInterval: number) {
  const provider = new JsonRpcProvider(NODE_URLS[chainId])
  provider.pollingInterval = pollingInterval
  return { [chainId]: provider }
}
