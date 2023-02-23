import { ChainId } from '@usedapp/core'

const supportedChainIds = [
  ChainId.Arbitrum,
  ChainId.ArbitrumRinkeby,
  ChainId.Goerli,
  ChainId.Mumbai,
  ChainId.Hardhat,
] as const

export type SupportedChainId = typeof supportedChainIds[number]

export function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return supportedChainIds.includes(chainId)
}
