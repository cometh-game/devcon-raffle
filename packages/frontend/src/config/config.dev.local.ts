import { Hardhat } from '@usedapp/core'
import { providerWithInterval } from 'src/constants/nodeUrls'
import { POLLING_INTERVAL } from 'src/constants/pollingInterval'

import { ADDRESSES } from './addresses'
import { commonUseDAppConfig, Config } from './config'
import { getDateEnv, getStringEnv } from './getEnv'

export function getLocalDevConfig(): Config {
  console.log('Hardhat chain id', Hardhat.chainId)
  return {
    useDAppConfig: {
      ...commonUseDAppConfig,
      readOnlyChainId: Hardhat.chainId,
      readOnlyUrls: providerWithInterval(Hardhat.chainId, POLLING_INTERVAL),
      networks: [Hardhat],
      pollingInterval: POLLING_INTERVAL,
    },
    addresses: ADDRESSES,
    backendUrl: 'http://localhost:3000',
    portisDAppID: getStringEnv('VITE_PORTIS_DAPP_ID') || '',
    dappName: 'EthCC[6] Auction & Raffle (LOCAL DEV)',
    voucherRedeemDeadline: getDateEnv('VITE_VOUCHER_REDEEM_DEADLINE'),
  }
}
