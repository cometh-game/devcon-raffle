import { Goerli } from '@usedapp/core'
import { providerWithInterval } from 'src/constants/nodeUrls'
import { POLLING_INTERVAL } from 'src/constants/pollingInterval'

import { getAddresses } from './addresses'
import { commonUseDAppConfig, Config } from './config'
import { getDateEnv, getStringEnv } from './getEnv'

export function getTestnetProdConfig(): Config {
  return {
    useDAppConfig: {
      ...commonUseDAppConfig,
      readOnlyChainId: Goerli.chainId,
      readOnlyUrls: providerWithInterval(Goerli.chainId, POLLING_INTERVAL),
      networks: [Goerli],
      pollingInterval: POLLING_INTERVAL,
    },
    addresses: getAddresses(),
    backendUrl: getStringEnv('VITE_BACKEND_URL') || '',
    portisDAppID: getStringEnv('VITE_PORTIS_DAPP_ID') || '',
    dappName: 'EthCC[6] Auction & Raffle (TESTNET)',
    voucherRedeemDeadline: getDateEnv('VITE_VOUCHER_REDEEM_DEADLINE'),
  }
}
