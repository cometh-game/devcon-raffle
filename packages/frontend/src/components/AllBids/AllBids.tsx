import { useState } from 'react'
import { AllBidsList, LoadingBids, NothingFound, SettledBidsList } from 'src/components/AllBids'
import { SearchInput } from 'src/components/Form'
import { useAuctionWinnersCount, useBids, useContractState, useRaffleWinnersCount } from 'src/hooks'
import { isAuctionSettled } from 'src/utils'
import styled from 'styled-components'

export const AllBids = () => {
  const [search, setSearch] = useState('')

  return (
    <PageContainer>
      <SearchInput setSearch={setSearch} />
      <AllBidsContent search={search} />
    </PageContainer>
  )
}

const AllBidsContent = ({ search }: { search: string }) => {
  const auctionWinnersCount = useAuctionWinnersCount()
  const raffleWinnersCount = useRaffleWinnersCount()
  const { state } = useContractState()
  const { bids } = useBids()

  if (auctionWinnersCount === undefined || raffleWinnersCount === undefined) {
    return <LoadingBids />
  }

  if (bids.size == 0) {
    return <NothingFound />
  }

  return (
    <>
      {isAuctionSettled(state) ? (
        <SettledBidsList search={search} />
      ) : (
        <AllBidsList
          search={search}
          auctionWinnersCount={auctionWinnersCount}
          raffleWinnersCount={raffleWinnersCount}
        />
      )}
    </>
  )
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  row-gap: 20px;
  width: 100%;
  max-width: 780px;
  padding: 28px 0 56px;

  @media only screen and (max-width: 900px) {
    padding-left: 16px;
    padding-right: 16px;
  }
`
