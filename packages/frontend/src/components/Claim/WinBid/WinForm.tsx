import { BigNumber } from '@ethersproject/bignumber'
import { useEthers } from '@usedapp/core'
import { useEffect } from 'react'
import { TxFlowSteps } from 'src/components/Auction'
import { WinBidForm } from 'src/components/Claim'
import { FormWrapper } from 'src/components/Form/Form'
import { useIsTicketClaimed } from 'src/hooks/backend/useIsTicketClaimed'
import { UserBid } from 'src/models/Bid'
import styled from 'styled-components'

interface WinFormProps {
  userBid: UserBid
  withdrawalAmount: BigNumber
  setView: (state: TxFlowSteps) => void
}

export const WinForm = ({ userBid, withdrawalAmount, setView }: WinFormProps) => {
  const { account } = useEthers()
  const { claimed, isClaimed } = useIsTicketClaimed()

  useEffect(() => {
    claimed(account)
  }, [account, claimed])

  return (
    <Wrapper>
      <WinBidForm userBid={userBid} withdrawalAmount={withdrawalAmount} setView={setView} isClaimed={isClaimed} />
    </Wrapper>
  )
}

const Wrapper = styled(FormWrapper)`
  justify-content: center;
`
