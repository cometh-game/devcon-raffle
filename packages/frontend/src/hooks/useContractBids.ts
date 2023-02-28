import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { useDevconContract } from 'src/hooks/contract'
import { useCachedCall } from 'src/hooks/useCachedCall'
import { Bid } from 'src/models/Bid'

interface BidWithAddress {
  bidder: string
  bid: {
    bidderID: BigNumber
    amount: BigNumber
    discount: BigNumber
    winType: number
    claimed: boolean
  }
}

export function useContractBids(): Bid[] {
  const { devcon, chainId } = useDevconContract()

  const { value } =
    useCachedCall(
      {
        contract: devcon,
        method: 'getBidsWithAddresses',
        args: [],
      },
      chainId
    ) ?? {}

  const bids = value && (value[0] as BidWithAddress[])

  return useMemo(() => {
    return (
      bids?.map((fetchedBid) => ({
        bidderID: fetchedBid.bid.bidderID,
        bidderAddress: fetchedBid.bidder,
        amount: fetchedBid.bid.amount,
        discount: fetchedBid.bid.discount,
        place: -1,
      })) ?? []
    )
  }, [bids])
}
