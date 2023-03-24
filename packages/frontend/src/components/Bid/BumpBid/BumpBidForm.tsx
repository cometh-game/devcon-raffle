import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { useEtherBalance, useEthers } from '@usedapp/core'
import { TxFlowSteps } from 'src/components/Auction/TxFlowSteps'
import { Button } from 'src/components/Buttons'
import { Separator } from 'src/components/common/Separator'
import { Form, FormHeading, FormRow, FormWrapper } from 'src/components/Form/Form'
import { Input } from 'src/components/Form/Input'
import { ZERO } from 'src/constants/bigNumber'
import type { Bid } from 'src/models/Bid'
import { ImmutableBids } from 'src/providers/Bids/types'
import { getPositionAfterBump } from 'src/utils'
import { formatEtherAmount } from 'src/utils/formatters'
import styled from 'styled-components'

interface BumpBidProps {
  userBid?: Bid
  newBidAmount?: BigNumber
  bumpAmount: string
  parsedBumpAmount: BigNumber
  minimumIncrement: BigNumber
  setBumpAmount: (val: string) => void
  setView: (state: TxFlowSteps) => void
  bids: ImmutableBids
}

export const BumpBidForm = ({
  userBid,
  newBidAmount = ZERO,
  bumpAmount,
  parsedBumpAmount,
  minimumIncrement,
  setBumpAmount,
  setView,
  bids,
}: BumpBidProps) => {
  const { account } = useEthers()
  const userBalance = useEtherBalance(account)
  const notEnoughBalance = userBalance !== undefined && parsedBumpAmount.gt(userBalance)
  const bidTooLow = parsedBumpAmount.lt(minimumIncrement)

  return (
    <BumpFormWrapper>
      <FormHeading>Bump your bid</FormHeading>
      <BumpForm>
        <FormRow>
          <span>Your current bid</span>
          <span>{formatEtherAmount(userBid?.amount ?? ZERO)} ETH</span>
        </FormRow>
        <FormRow>
          <span>Current place in the raffle</span>
          <span>No. {userBid?.place}</span>
        </FormRow>
        <Input
          initialAmount={bumpAmount}
          setAmount={setBumpAmount}
          notEnoughBalance={notEnoughBalance}
          bidTooLow={bidTooLow}
        />
        <FormRow>
          <span>Min. increment of the bid</span>
          <span>{formatEther(minimumIncrement)} ETH</span>
        </FormRow>
        <Separator />
        <FormRow>
          <span>Your bid after the bump</span>
          <span>{formatEtherAmount(newBidAmount)} ETH</span>
        </FormRow>
        <FormRow>
          <span>Place in the raffle after the bump</span>
          <span>
            No. {userBid && (bidTooLow ? userBid.place : getPositionAfterBump(newBidAmount, userBid.bidderID, bids))}
          </span>
        </FormRow>
        <Button
          disabled={notEnoughBalance || bidTooLow}
          onClick={() => {
            setView(TxFlowSteps.Review)
          }}
          wide
        >
          Bump your bid
        </Button>
      </BumpForm>
    </BumpFormWrapper>
  )
}

const BumpFormWrapper = styled(FormWrapper)`
  padding: 0 115px 0 170px;
  justify-content: center;

  @media only screen and (max-width: 900px) {
    padding: 16px;
  }
`

const BumpForm = styled(Form)`
  row-gap: 8px;
`
