import { BigNumber } from '@ethersproject/bignumber'
import { useState } from 'react'
import { TxFlowSteps } from 'src/components/Auction'
import { BackButton } from 'src/components/Buttons'
import { ReviewForm } from 'src/components/Form'
import { FormWrapper, FormSubHeading } from 'src/components/Form/Form'
import { TransactionAction, TransactionStepper, TransactionSuccess, Transactions } from 'src/components/Transaction'
import { isTxFailed } from 'src/utils/transactions/isTxFailed'
import styled from 'styled-components'

export const heading = {
  [Transactions.Place]: 'Place bid',
  [Transactions.Bump]: 'Bump your Bid',
  [Transactions.Withdraw]: 'Withdraw',
}

interface AuctionTransactionProps {
  action: TransactionAction
  amount: BigNumber
  impact?: BigNumber
  view: TxFlowSteps
  setView: (state: TxFlowSteps) => void
  setTransactionViewLock?: (val: boolean) => void
}

export const AuctionTransaction = ({
  action,
  amount,
  impact,
  view,
  setView,
  setTransactionViewLock: setTransactionViewLock,
}: AuctionTransactionProps) => {
  const [txHash, setTxHash] = useState('')
  const isFailed = isTxFailed(action.state)
  const lockViewOnTransaction = () => setTransactionViewLock?.(true)
  const unlockViewFromTransaction = () => setTransactionViewLock?.(false)

  return (
    <Transaction>
      <TransactionWrapper>
        <TransactionHeading>
          {view !== TxFlowSteps.Confirmation && (
            <BackButton view={view} setView={setView} resetState={action.resetState} />
          )}
          <FormSubHeading>{heading[action.type]}</FormSubHeading>
        </TransactionHeading>
        {view === TxFlowSteps.Review && (
          <ReviewForm
            action={action}
            amount={amount}
            impact={impact}
            setTxHash={setTxHash}
            view={view}
            setView={setView}
            lockViewOnTransaction={lockViewOnTransaction}
          />
        )}
        {view === TxFlowSteps.Confirmation && (
          <TransactionSuccess
            action={action.type}
            txHash={txHash}
            setView={setView}
            unlockViewFromTransaction={unlockViewFromTransaction}
          />
        )}
      </TransactionWrapper>
      <TransactionStepper
        action={action.type}
        current={view === TxFlowSteps.Confirmation || isFailed ? 'Finalized' : `${heading[action.type]}`}
        isFailed={isFailed}
      />
    </Transaction>
  )
}

const Transaction = styled.div`
  display: flex;
  width: 100%;

  @media only screen and (max-width: 900px) {
    display: block;
  }
`

const TransactionWrapper = styled(FormWrapper)`
  flex: 1;
  row-gap: 24px;
  padding: 82px 54px;
  width: fit-content;

  @media only screen and (max-width: 900px) {
    padding: 16px;
    width: 100%;
  }
`
const TransactionHeading = styled.div`
  display: flex;
  align-items: center;
  column-gap: 16px;
`
