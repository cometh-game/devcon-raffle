import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BidsList, BidsListHeaders } from 'src/components/BidsList'
import { Button } from 'src/components/Buttons'
import { TimeLeft } from 'src/components/Info/TimeLeft'
import { useAuctionState } from 'src/hooks'
import { useAuctionWinnersCount } from 'src/hooks/useAuctionWinnersCount'
import { useBids } from 'src/hooks/useBids'
import { useUserBid } from 'src/hooks/useUserBid'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

import { Bid, UserBid } from '../../models/Bid'
import { ImmutableBids } from '../../providers/Bids/types'

const topAuctionBidsCount = 3
const bidsMaxCount = topAuctionBidsCount + 1

export const BidsListSection = () => {
  const state = useAuctionState()
  const { bids: immutableBids } = useBids()
  const userBid = useUserBid()
  const auctionWinnersCount = useAuctionWinnersCount()
  const navigate = useNavigate()

  const bidsShortlist = useMemo(() => {
    return selectBids(auctionWinnersCount, immutableBids, userBid)
  }, [auctionWinnersCount, immutableBids, userBid])

  const isLoadingParams = auctionWinnersCount === undefined

  return (
    <BidsListContainer>
      {!isLoadingParams && immutableBids.size === 0 ? (
        <EmptyList>
          <ColoredText>
            {state === 'AwaitingBidding' ? 'Bids will show up here' : `No bidders yet. Be the first one!`}
          </ColoredText>
        </EmptyList>
      ) : (
        <>
          <TimeLeftWrapper>
            <TimeLeft />
          </TimeLeftWrapper>
          <ListHeader>
            <h3>Number of participants:</h3>
            <ColoredText>{isLoadingParams ? 0 : immutableBids.size}</ColoredText>
          </ListHeader>
          <BidsListHeaders />
          <BidsList bids={bidsShortlist} view="short" isLoadingParams={isLoadingParams} />
        </>
      )}
      {!isLoadingParams && immutableBids.size !== 0 && (
        <Button view="secondary" onClick={() => navigate('/bids')}>
          Show all
        </Button>
      )}
    </BidsListContainer>
  )
}

function selectBids(
  auctionWinnersCount: number | undefined,
  immutableBids: ImmutableBids,
  userBid: UserBid | undefined
) {
  if (auctionWinnersCount === undefined) {
    return []
  }

  const bids = immutableBids.toArray().map((bid) => bid.toObject())
  if (bids.length <= bidsMaxCount) {
    return bids
  }

  const topAuctionBids = bids.slice(0, topAuctionBidsCount)

  const lastAuctionBidIndex = bids.length > auctionWinnersCount ? auctionWinnersCount - 1 : bids.length - 1
  const lastAuctionBid = bids[lastAuctionBidIndex]

  return userBid && shouldUserBidBeDisplayed(userBid, lastAuctionBid, auctionWinnersCount)
    ? topAuctionBids.concat([userBid, lastAuctionBid])
    : topAuctionBids.concat([lastAuctionBid])
}

const shouldUserBidBeDisplayed = (userBid: UserBid, lastAuctionBid: Bid, auctionWinnersCount: number) => {
  return !userBid.bidderID.eq(lastAuctionBid.bidderID) && within(bidsMaxCount, auctionWinnersCount - 1, userBid.place)
}

const within = (...[lower, higher, value]: number[]) => value >= lower && value <= higher

const BidsListContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 32px;
  width: 100%;
  padding: 46px 0;
`

const TimeLeftWrapper = styled.div`
  color: ${Colors.Blue};
`

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 22px;
  width: 100%;
`

const EmptyList = styled.div`
  margin: 48px 0;
`
const ColoredText = styled.h3`
  width: max-content;
  color: ${Colors.Blue};
`
