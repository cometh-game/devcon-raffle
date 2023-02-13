import { AuctionRaffle } from '@devcon-raffle/contracts'
import { useBlockNumbers } from '@usedapp/core'
import { Dispatch, ReactNode, useEffect, useReducer, useState } from 'react'
import { POLLING_INTERVAL } from 'src/constants/pollingInterval'
import { useChainId } from 'src/hooks/chainId/useChainId'
import { useDevconContract, useReadOnlyProvider } from 'src/hooks/contract'
import { useAsyncInterval } from 'src/hooks/useAsyncInterval'
import { useContractBids } from 'src/hooks/useContractBids'
import { Bid } from 'src/models/Bid'
import useAsyncEffect from 'use-async-effect'

import { BidsContext } from './context'
import { BidChanged, bidsReducer, getDefaultBidsState } from './reducer'

interface Props {
  children: ReactNode
}

export const BidsProvider = ({ children }: Props) => {
  const [bidsState, dispatch] = useReducer(bidsReducer, getDefaultBidsState())
  const contractBids = useContractBids()

  useEffect(() => initBids(contractBids, dispatch), [contractBids])

  const provider = useReadOnlyProvider()
  const chainId = useChainId()
  const [lastFetchedBlock, setLastFetchedBlock] = useState<number | undefined>(undefined)

  useAsyncEffect(
    async (isActive) => {
      const blockNumber = await provider.getBlockNumber()
      if (!isActive()) {
        return
      }
      setLastFetchedBlock(blockNumber - 1)
    },
    () => setLastFetchedBlock(undefined),
    [chainId]
  )

  const { devcon } = useDevconContract()
  const blockNumber = useBlockNumbers()[chainId]

  useAsyncInterval(
    () => queryNewBids(devcon, blockNumber, lastFetchedBlock, setLastFetchedBlock, dispatch),
    POLLING_INTERVAL
  )

  return <BidsContext.Provider value={{ bidsState }}>{children}</BidsContext.Provider>
}

function initBids(contractBids: Bid[], dispatch: Dispatch<BidChanged>) {
  contractBids.forEach((bid) => dispatch(bid))
}

async function queryNewBids(
  devcon: AuctionRaffle,
  currentBlock: number | undefined,
  lastFetchedBlock: number | undefined,
  setLastFetchedBlock: (value: number | undefined) => void,
  dispatch: Dispatch<BidChanged>
) {
  if (currentBlock === undefined || lastFetchedBlock === undefined) {
    return
  }

  if (currentBlock <= lastFetchedBlock) {
    return
  }

  const eventFilter = devcon.filters.NewBid(null, null, null)
  const events = await devcon.queryFilter(eventFilter, lastFetchedBlock + 1, currentBlock)
  events.forEach((event) => {
    dispatch({
      bidderID: event.args.bidderID,
      bidderAddress: event.args.bidder,
      amount: event.args.bidAmount,
    })
  })
  setLastFetchedBlock(currentBlock)
}
