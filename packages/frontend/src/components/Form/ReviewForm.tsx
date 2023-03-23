import { BigNumber } from '@ethersproject/bignumber'
import { useEtherBalance, useEthers } from '@usedapp/core'
import { useEffect } from 'react'
import { TxFlowSteps } from 'src/components/Auction'
import { heading } from 'src/components/Auction/AuctionTransaction'
import { Button } from 'src/components/Buttons'
import { FormRow, FormNarrow } from 'src/components/Form/Form'
import { TransactionAction, Transactions } from 'src/components/Transaction'
import { useEligibleDiscount } from 'src/hooks/useEligibleDiscount'
import { formatEtherAmount } from 'src/utils/formatters'
import { isTxPending } from 'src/utils/transactions/isTxPending'
import styled from 'styled-components'

const amountLabel = {
  [Transactions.Place]: 'Your Bid',
  [Transactions.Bump]: 'Your Bid Bump',
  [Transactions.Withdraw]: 'Withdraw amount',
}

interface ReviewFormProps {
  action: TransactionAction
  amount: BigNumber
  impact?: BigNumber
  setTxHash: (hash: string) => void
  view: TxFlowSteps
  setView: (state: TxFlowSteps) => void
  lockViewOnTransaction?: () => void
}

export const ReviewForm = ({
  action,
  amount,
  impact,
  setTxHash,
  view,
  setView,
  lockViewOnTransaction,
}: ReviewFormProps) => {
  const { account } = useEthers()
  const etherBalance = useEtherBalance(account)
  const isPending = isTxPending(action.state)
  const discount = useEligibleDiscount()

  useEffect(() => {
    if (action.state.status === 'Success') {
      if (!action.state.transaction) {
        return
      }
      setTxHash(action.state.transaction.hash)
      setView(view + 1)
      action.resetState()
    }
  }, [view, setView, setTxHash, action])

  const sendTransaction = () => {
    action.send()
    lockViewOnTransaction?.()
  }

  return (
    <FormNarrow>
      <FormRow>
        <span>Wallet Balance</span>
        <span>{etherBalance && formatEtherAmount(etherBalance)} ETH</span>
      </FormRow>
      <FormRow>
        <span>{amountLabel[action.type]}</span>
        <span>{formatEtherAmount(amount)} ETH</span>
      </FormRow>
      {impact && (
        <FormRow>
          <span>Your Bid after the bump</span>
          <span>{formatEtherAmount(impact)} ETH</span>
        </FormRow>
      )}
      <ActionButton view="primary" isLoading={isPending} onClick={sendTransaction}>
        {heading[action.type]}
      </ActionButton>
      {discount > 0 && (
        <FormRow>
          <Discount>
            You are eligible for a discount. A {discount}% discount will be applied at the end of the raffle.
          </Discount>
        </FormRow>
      )}
    </FormNarrow>
  )
}

const Discount = styled.span`
  opacity: 0.7;
`

const ActionButton = styled(Button)`
  width: 100%;
`
