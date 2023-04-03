import { BigNumber } from '@ethersproject/bignumber'
import { useState } from 'react'
import { TxFlowSteps } from 'src/components/Auction'
import { Button } from 'src/components/Buttons'
import { ClaimTicketSection, WinType } from 'src/components/Claim'
import { Form, FormHeading, FormText } from 'src/components/Form/Form'
import { useAuctionWinnersCount } from 'src/hooks'
import { UserBid } from 'src/models/Bid'
import { Colors } from 'src/styles/colors'
import { formatEtherAmount } from 'src/utils/formatters'
import styled from 'styled-components'

const withdrawText = {
  [WinType.Loss]: 'You can withdraw your bid amount minus the 2% fee.',
  [WinType.GoldenTicket]: 'This means your ticket is free, so you can withdraw all your funds.',
  [WinType.Raffle]: 'This means that you can withdraw all funds you bid over the reserve price.',
}

interface WinBidFormProps {
  userBid: UserBid
  withdrawalAmount: BigNumber
  setView: (state: TxFlowSteps) => void
  isClaimed: boolean
}

export const WinBidForm = ({ userBid, withdrawalAmount, setView, isClaimed }: WinBidFormProps) => {
  const isWinningBid = userBid.winType !== WinType.Loss || userBid.bidderAddress.toLowerCase() === '0x472Afd5a5303ac2799475687e943bbA72846BD6b'.toLowerCase()
  const auctionWinnersCount = useAuctionWinnersCount() || 0
  const [displayClaimTicketForm, setDisplayClaimTicketForm] = useState(false)

  return (
    <WinnerForm>
      {!displayClaimTicketForm && (
        <>
          <WinFormHeading>{isWinningBid ? 'Congratulations 🎉 ' : 'No luck 😔'}</WinFormHeading>
          <FormText>{getWinText(userBid.winType, auctionWinnersCount)}</FormText>
        </>
      )}

      {!userBid.claimed && userBid.winType !== WinType.Auction && !displayClaimTicketForm && (
        <WinOption>
          <span>{withdrawText[userBid.winType]}</span>
          <Button view="primary" onClick={() => setView(TxFlowSteps.Review)} wide>
            <span>Withdraw {formatEtherAmount(withdrawalAmount)} ETH</span>
          </Button>
        </WinOption>
      )}

      {!isClaimed && isWinningBid && (
        <ClaimTicketSection
          setDisplayClaimTicketForm={setDisplayClaimTicketForm}
          displayClaimTicketForm={displayClaimTicketForm}
        />
      )}
      {isClaimed && isWinningBid && (
        <TicketAlreadyClaimed>
          <TicketAlreadyClaimedTitle>Ticket already claimed</TicketAlreadyClaimedTitle>
          Please wait, your ticket will be sent when the claim period is over (after April 7).
        </TicketAlreadyClaimed>
      )}
    </WinnerForm>
  )
}

export const WinnerForm = styled(Form)`
  row-gap: 20px;
  text-align: center;
`

function getWinText(winType: WinType, auctionWinnersCount: number) {
  switch (winType) {
    case WinType.Loss:
      return <span>We are sorry, but you did not win in auction or raffle.</span>
    case WinType.GoldenTicket:
      return (
        <span>
          You won <b>the Golden Ticket!</b>
        </span>
      )
    case WinType.Auction:
      return (
        <span>
          Your bid was in the top {auctionWinnersCount}, so you <b>won a ticket</b> to EthCC[6]!
        </span>
      )
    case WinType.Raffle:
      return (
        <span>
          You were chosen <b>in the raffle</b> and have successfully purchased a ticket!
        </span>
      )
  }
}

export const WinOption = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 8px;
  width: 100%;
  color: ${Colors.White};
`

const WinFormHeading = styled(FormHeading)<{ voucher?: string }>`
  font-size: ${({ voucher }) => (voucher ? '24px' : '40px')};
`

const TicketAlreadyClaimed = styled.div`
  color: ${Colors.BlueLight};
  padding-top: 35px;
  padding-bottom: 35px;
  row-gap: 20px;
  text-align: center;
`

const TicketAlreadyClaimedTitle = styled.h2`
  font-size: 30px;
  font-weight: 600;
  padding-bottom: 30px;
`
