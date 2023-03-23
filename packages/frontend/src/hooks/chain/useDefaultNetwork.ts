import { Chain } from '@usedapp/core'
import { CONFIG } from 'src/config/config'

export function useDefaultNetwork(): Chain {
  const defaultNetwork = CONFIG.useDAppConfig.networks?.[0]

  if (defaultNetwork === undefined) {
    throw new Error('no default network set in useDApp config')
  }

  return defaultNetwork
}
