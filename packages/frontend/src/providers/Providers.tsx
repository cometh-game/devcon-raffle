import { DAppProvider } from '@usedapp/core'
import { Web3OnboardProvider } from '@web3-onboard/react'
import { ReactNode } from 'react'
import { CONFIG } from 'src/config/config'

import { BidsProvider } from './Bids/provider'
import web3Onboard from './Web3Onboard/init'

interface Props {
  children: ReactNode
}

export const Providers = ({ children }: Props) => (
  <DAppProvider config={CONFIG.useDAppConfig}>
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <BidsProvider>{children}</BidsProvider>
    </Web3OnboardProvider>
  </DAppProvider>
)
