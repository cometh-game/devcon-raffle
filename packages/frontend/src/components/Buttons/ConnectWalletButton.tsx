import { useEthers } from '@usedapp/core'
import { useConnectWallet } from '@web3-onboard/react'
import { ethers } from 'ethers'
import { useEffect } from 'react'
import { Button, ButtonProps } from 'src/components/Buttons/Button'

type ConnectWalletButtonProps = Omit<ButtonProps, 'onClick' | 'children'>

export const ConnectWalletButton = (props: ConnectWalletButtonProps) => {
  const { activate, deactivate } = useEthers()
  const [{ wallet }, connect] = useConnectWallet()

  useEffect(() => {
    const previouslyConnectedWallets = localStorage.getItem('selectedWallet')
    try {
      if (previouslyConnectedWallets != null && previouslyConnectedWallets !== '') {
        connect({
          autoSelect: { label: JSON.parse(previouslyConnectedWallets), disableModals: true },
        })
      }
    } catch (error: any) {
      console.error(error.message)
    }
  }, [connect])

  useEffect(
    () => {
      if (wallet) {
        const provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
        activate(provider)
      } else {
        deactivate()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet]
  )

  const connectWallet = async () => {
    try {
      const wallet = await connect()
      if (wallet![0]) localStorage.setItem('selectedWallet', JSON.stringify(wallet![0].label))
    } catch (error: any) {
      console.error(error.message)
    }
  }

  return (
    <>
      <Button {...props} onClick={connectWallet}>
        Connect Wallet
      </Button>
    </>
  )
}
