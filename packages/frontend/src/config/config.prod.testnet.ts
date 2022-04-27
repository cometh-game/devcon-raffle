import { ArbitrumRinkeby } from '@usedapp/core'
import { ARBITRUM_RINKEBY_NODE_URL } from 'src/constants/nodeUrls'

import { getAddresses } from './addresses'
import { commonUseDAppConfig } from './config'
import { getStringEnv } from './getEnv'

export function getTestnetProdConfig() {
  return {
    useDAppConfig: {
      ...commonUseDAppConfig,
      readOnlyChainId: ArbitrumRinkeby.chainId,
      readOnlyUrls: ARBITRUM_RINKEBY_NODE_URL,
      networks: [ArbitrumRinkeby],
    },
    addresses: getAddresses(),
    backendUrl: getStringEnv('BACKEND_URL') || '',
  }
}
