import { Chain } from '@usedapp/core'
import coinbaseWalletModule from '@web3-onboard/coinbase'
import injectedModule from '@web3-onboard/injected-wallets'
import { init } from '@web3-onboard/react'
import walletConnectModule from '@web3-onboard/walletconnect'
import { CONFIG } from 'src/config/config'

function getDefaultNetwork(): Chain {
  const defaultNetwork = CONFIG.useDAppConfig.networks?.[0]

  if (defaultNetwork === undefined) {
    throw new Error('no default network set in useDApp config')
  }

  return defaultNetwork
}

const { chainName, chainId, rpcUrl } = getDefaultNetwork()

const injected = injectedModule()
const coinbaseWallet = coinbaseWalletModule({ darkMode: true })
const walletConnect = walletConnectModule({
  qrcodeModalOptions: {
    mobileLinks: ['rainbow', 'metamask', 'argent', 'trust', 'gnosis', 'imtoken', 'pillar', 'rabby'],
  },
  connectFirstChainId: true,
})
const wallets = [injected, coinbaseWallet, walletConnect]
const chains = [
  {
    id: chainId,
    token: 'ETH',
    label: chainName,
    rpcUrl: rpcUrl!,
  },
]
const appMetadata = {
  name: 'EthCC[6] Auction & Raffle Ticket Sale',
  icon: '/ethcc-logo.svg',
  description: 'EthCC[6] Auction & Raffle Ticket Sale',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
    { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
  ],
}

export default init({
  wallets,
  chains,
  appMetadata,
  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
  theme: 'dark',
})
