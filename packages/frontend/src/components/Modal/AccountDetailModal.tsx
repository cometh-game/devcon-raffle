import Jazzicon from '@metamask/jazzicon'
import { shortenAddress, useEthers } from '@usedapp/core'
import { useConnectWallet } from '@web3-onboard/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CopyButton, RedirectButton } from 'src/components/Buttons'
import { Button } from 'src/components/Buttons/Button'
import { ContentRow, Modal } from 'src/components/Modal/Modal'
import { useLogout } from 'src/hooks/backend/useLogout'
import { useChainId } from 'src/hooks/chainId/useChainId'
import { Colors } from 'src/styles/colors'
import { getExplorerAddressLink } from 'src/utils/getExplorerLink'
import { removeWalletLinkStorage } from 'src/utils/removeWalletLinkStorage'
import styled from 'styled-components'

export interface ModalProps {
  isShown: boolean | undefined
  onRequestClose: () => void
}

export const AccountDetailModal = ({ isShown, onRequestClose }: ModalProps) => {
  const { account, deactivate } = useEthers()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{ wallet }, connect, disconnect] = useConnectWallet()
  const accountIconRef = useRef<any>(null)
  const chainId = useChainId()
  const [walletLabel, setWalletLabel] = useState('-')
  const { logout } = useLogout()

  useEffect(() => {
    setWalletLabel(wallet?.label ?? '-')
    if (account && accountIconRef.current) {
      accountIconRef.current.innerHTML = ''
      accountIconRef.current.appendChild(Jazzicon(40, parseInt(account.slice(2, 10), 16)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  const onDisconnect = useCallback(() => {
    onRequestClose()
    if (wallet?.label) {
      disconnect(wallet)
    }
    localStorage.removeItem('selectedWallet')
    localStorage.removeItem('walletconnect')
    removeWalletLinkStorage()
    deactivate()
    logout()
  }, [onRequestClose, wallet, disconnect, deactivate, logout])

  return (
    <Modal isShown={isShown} onRequestClose={onRequestClose} title="Your account">
      <ContentWrapper>
        <ContentRow>
          <ConnectedWallet>Connected with {walletLabel}</ConnectedWallet>
        </ContentRow>
        <ContentRow>
          <AccountIcon ref={accountIconRef} />
          <AccountAddress>{shortenAddress(account || '')}</AccountAddress>
        </ContentRow>
        {account && (
          <ContentRow>
            <RedirectButton
              link={account && getExplorerAddressLink(chainId, account)}
              tooltip="View on Arbiscan"
              color={Colors.Blue}
              label=" View in block explorer"
              side="top"
            />

            <CopyButton
              value={account}
              text="Copy account address"
              color={Colors.Blue}
              label="Copy address"
              side="top"
            />
          </ContentRow>
        )}
      </ContentWrapper>
      <Button view="secondary" onClick={onDisconnect}>
        Disconnect
      </Button>
    </Modal>
  )
}

const AccountIcon = styled.div`
  display: flex;
  place-items: center;
  height: 40px;
  width: 40px;
  background-color: ${Colors.Blue};
  border-radius: 50%;
`

const AccountAddress = styled.p`
  font-family: 'Jetbrains Mono', 'Space Mono', 'Roboto Mono', monospace;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: ${Colors.Black};
`

const ConnectedWallet = styled.p`
  font-weight: 400;
  font-size: 14px;
  line-height: 32px;
  color: ${Colors.Grey};
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  row-gap: 20px;
  padding: 20px;
  border: 1px solid #e7eaf3;
`
