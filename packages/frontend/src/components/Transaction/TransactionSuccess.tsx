import { TxFlowSteps } from 'src/components/Auction'
import { Button, CopyButton, RedirectButton } from 'src/components/Buttons'
import { FormNarrow } from 'src/components/Form/Form'
import { InputLabel } from 'src/components/Form/Input'
import { Transactions } from 'src/components/Transaction/TransactionEnum'
import { TransactionSuccessHeader } from 'src/components/Transaction/TransactionSuccessHeader'
import { useChainId } from 'src/hooks/chainId/useChainId'
import { Colors } from 'src/styles/colors'
import { shortenTxHash } from 'src/utils/formatters'
import { getExplorerTxLink } from 'src/utils/getExplorerLink'
import styled from 'styled-components'

interface Props {
  txHash: string
  action: Transactions
  setView: (state: TxFlowSteps) => void
  unlockViewFromTransaction?: () => void
}

export const TransactionSuccess = ({ txHash, action, setView, unlockViewFromTransaction }: Props) => {
  const chainId = useChainId()
  const transactionLink = getExplorerTxLink(chainId, txHash)

  const goHome = () => {
    setView(0)
    unlockViewFromTransaction?.()
  }

  return (
    <Container>
      <TransactionSuccessHeader action={action} />
      <TransactionIdWrapper>
        <TransactionIdLabel>Your transaction ID</TransactionIdLabel>
        <TransactionIdBox>
          <TransactionIdText>{shortenTxHash(txHash)}</TransactionIdText>
          <CopyButton value={txHash} side="top" text="Copy transaction ID" />
          <RedirectButton link={transactionLink} side="top" tooltip="View on Arbiscan" />
        </TransactionIdBox>
      </TransactionIdWrapper>
      <ActionButton view="primary" onClick={goHome}>
        Back to home
      </ActionButton>
    </Container>
  )
}

const Container = styled(FormNarrow)`
  row-gap: 24px;
`

const TransactionIdWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
`

const TransactionIdLabel = styled(InputLabel)`
  justify-content: flex-start;
  margin-bottom: 8px;
`

const TransactionIdBox = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background-color: ${Colors.White};
  padding: 8px 12px;
  height: 40px;
`

const TransactionIdText = styled.span`
  flex: 1;
  color: ${Colors.Grey};
`

const ActionButton = styled(Button)`
  width: 100%;
`
