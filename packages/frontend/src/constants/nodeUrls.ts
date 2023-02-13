import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from '@usedapp/core'
import { SupportedChainId } from 'src/constants/chainIDs'

const NODE_URLS: Record<SupportedChainId, string> = {
  [ChainId.Arbitrum]: 'https://arb-mainnet.g.alchemy.com/v2/6-V_6Ad9eh8xGo3U7hbfFsveRdC67dQL',
  [ChainId.ArbitrumRinkeby]: 'https://rinkeby.arbitrum.io/rpc',
  [ChainId.Mumbai]: 'https://rpc.ankr.com/polygon_mumbai',
  [ChainId.Hardhat]: 'http://localhost:8545',
}

export function providerWithInterval(chainId: SupportedChainId, pollingInterval: number) {
  const provider = new JsonRpcProvider(NODE_URLS[chainId])
  provider.pollingInterval = pollingInterval
  return { [chainId]: provider }
}
