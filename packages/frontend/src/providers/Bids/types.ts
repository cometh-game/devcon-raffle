import { AddressZero, Zero } from '@ethersproject/constants'
import { List as ImmutableList, Map as ImmutableMap, Record as ImmutableRecord } from 'immutable'
import { Bid } from 'src/models/Bid'

export interface BidsState {
  bids: ImmutableBids
  bidders: ImmutableBidders
}

export type ImmutableBidsState = ImmutableRecord<BidsState>
export type ImmutableBid = ImmutableRecord<Bid>
export type ImmutableBids = ImmutableList<ImmutableBid>
export type ImmutableBidders = ImmutableMap<string, number>

export const bidFactory = ImmutableRecord<Bid>({
  bidderID: Zero,
  bidderAddress: AddressZero,
  amount: Zero,
  discount: Zero,
  place: 0,
})

export const bidsStateFactory = ImmutableRecord({
  bids: ImmutableList<ImmutableRecord<Bid>>(),
  bidders: ImmutableMap<string, number>({}),
})
