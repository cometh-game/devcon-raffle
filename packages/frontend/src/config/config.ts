import { BigNumber } from '@ethersproject/bignumber'
import { Config as UseDAppConfig } from '@usedapp/core'
import { ADDRESSES } from 'src/config/addresses'
import { SupportedChainId } from 'src/constants/chainIDs'

import { getLocalDevConfig } from './config.dev.local'
import { getTestnetDevConfig } from './config.dev.testnet'
import { getMainnetProdConfig } from './config.prod.mainnet'
import { getTestnetProdConfig } from './config.prod.testnet'
import { getStringEnv } from './getEnv'

export interface Config {
  useDAppConfig: UseDAppConfig
  addresses: Record<string, Record<SupportedChainId, string>>
  backendUrl: string
  portisDAppID: string
  dappName: string
  voucherRedeemDeadline?: BigNumber
}

function getConfig(mode: string): Config {
  const network = getStringEnv('VITE_NETWORK')

  switch (mode) {
    case 'development':
      return getDevConfig(network)
    default:
      return getProdConfig(network)
  }
}

function getDevConfig(network: string | undefined): Config {
  switch (network) {
    case 'ArbitrumRinkeby':
    case 'Goerli':
    case 'Mumbai':
      return getTestnetDevConfig()
    default:
      return getLocalDevConfig()
  }
}

function getProdConfig(network: string | undefined): Config {
  switch (network) {
    case 'ArbitrumRinkeby':
    case 'Goerli':
    case 'Mumbai':
      return getTestnetProdConfig()
    default:
      return getMainnetProdConfig()
  }
}

export const commonUseDAppConfig: UseDAppConfig = {
  multicallAddresses: ADDRESSES.multicall,
  multicallVersion: 2,
}

export const CONFIG = getConfig(import.meta.env.MODE)
