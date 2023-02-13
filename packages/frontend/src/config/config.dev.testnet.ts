import { Mumbai } from '@usedapp/core'
import { providerWithInterval } from 'src/constants/nodeUrls'
import { POLLING_INTERVAL } from 'src/constants/pollingInterval'

import { getAddresses } from './addresses'
import { commonUseDAppConfig, Config } from './config'
import { getDateEnv, getStringEnv } from './getEnv'

export function getTestnetDevConfig(): Config {
  return {
    useDAppConfig: {
      ...commonUseDAppConfig,
      readOnlyChainId: Mumbai.chainId,
      readOnlyUrls: providerWithInterval(Mumbai.chainId, POLLING_INTERVAL),
      networks: [Mumbai],
      pollingInterval: POLLING_INTERVAL,
    },
    addresses: getAddresses(),
    backendUrl: getStringEnv('VITE_BACKEND_URL') || 'http://localhost:3001',
    portisDAppID: getStringEnv('VITE_PORTIS_DAPP_ID') || '',
    dappName: 'EthCC 6 Auction & Raffle (TESTNET DEV)',
    voucherRedeemDeadline: getDateEnv('VITE_VOUCHER_REDEEM_DEADLINE'),
  }
}
