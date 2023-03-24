import { getWarningText } from 'src/components/Auction'
import { ConnectWalletButton } from 'src/components/Buttons'
import { FormHeading, FormRow, FormWrapper } from 'src/components/Form/Form'
import { useContractState } from 'src/hooks'
import styled from 'styled-components'

export const ConnectWalletWarning = () => {
  const { state } = useContractState()
  const text = getWarningText(state)

  return (
    <ConnectFormWrapper>
      <FormHeading>{text.heading}</FormHeading>
      <FormRow>
        <span>To {text.action} connect your wallet</span>
      </FormRow>
      <ConnectWalletButton />
    </ConnectFormWrapper>
  )
}

const ConnectFormWrapper = styled(FormWrapper)`
  justify-content: center;
  padding: 0 218px;

  @media only screen and (max-width: 900px) {
    padding: 16px;
  }
`
