import { getWarningText } from 'src/components/Auction'
import { Button } from 'src/components/Buttons'
import { FormHeading, FormRow, FormWrapper } from 'src/components/Form/Form'
import { useContractState, useSwitchChain, useWhichWallet } from 'src/hooks'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

export const ChainIdWarning = () => {
  const { isMetaMask, isWalletConnect, isPortis } = useWhichWallet()
  const switchChain = useSwitchChain()
  const { state } = useContractState()
  const text = getWarningText(state)

  return (
    <FormWrapper>
      <FormHeading>{text.heading}</FormHeading>
      <FormRow>
        <span>You are connected to the wrong network.</span>
      </FormRow>
      <FormRow>
        <span>
          To {text.action} connect your wallet to the <b>Ethereum network.</b>
        </span>
      </FormRow>
      <FormRow>
        <span>
          <TutorialLink
            target="_blank"
            href="https://consensys.net/blog/metamask/how-to-bridge-your-assets-to-arbitrum-using-metamask/"
          >
            Click here to read the tutorial for MetaMask
          </TutorialLink>{' '}
          »
        </span>
      </FormRow>
      {isMetaMask && !isWalletConnect && !isPortis && <Button onClick={switchChain}>Change network</Button>}
    </FormWrapper>
  )
}

const TutorialLink = styled.a`
  color: ${Colors.GreenLight};
  text-decoration: underline;
`
