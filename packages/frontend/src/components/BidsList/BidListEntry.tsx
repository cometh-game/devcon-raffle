import { AddressZero } from '@ethersproject/constants'
import { BaseProvider } from '@ethersproject/providers'
import { useMemo, useState } from 'react'
import { AddressColumn, BidColumn, PlaceColumn } from 'src/components/BidsList/BidsColumns'
import { useChainId } from 'src/hooks/chainId/useChainId'
import { useProvider } from 'src/hooks/contract'
import { Bid } from 'src/models/Bid'
import { Colors } from 'src/styles/colors'
import { getExplorerAddressLink } from 'src/utils'
import { formatEtherAmount } from 'src/utils/formatters'
import { shortenEnsOrEthAddress } from 'src/utils/formatters/shortenEnsOrEthAddress'
import styled, { css } from 'styled-components'
import { useWindowSize } from 'usehooks-ts'

interface Props {
  bid: Bid
  isUser?: boolean
  view?: 'short' | 'full'
}

export const BidListEntry = ({ bid, isUser, view = 'full' }: Props) => {
  const chainId = useChainId()
  const provider = useProvider()
  const [bidderAddress, setBidderAddress] = useState('')
  const { width } = useWindowSize()

  useMemo(() => {
    const ensNameOrAddress = async (address: string, provider: BaseProvider) => {
      if (address !== AddressZero) {
        let ens
        try {
          ens = await provider.lookupAddress(address)
          // eslint-disable-next-line no-empty
        } catch (err: unknown) {}
        setBidderAddress(ens ?? address)
      } else {
        setBidderAddress('')
      }
    }
    ensNameOrAddress(bid.bidderAddress, provider)
  }, [bid, provider])

  return (
    <BidsEntryRow isUser={isUser}>
      <PlaceColumn>{bid.place}.</PlaceColumn>
      <BidColumn>
        {formatEtherAmount(bid.amount)} <span>ETH</span>
      </BidColumn>
      <AddressColumn>
        <AddressLink
          href={getExplorerAddressLink(chainId, bid.bidderAddress)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {view === 'short' || width < 900 ? shortenEnsOrEthAddress(bidderAddress ?? '') : bidderAddress}
        </AddressLink>
      </AddressColumn>
    </BidsEntryRow>
  )
}

export const EmptyBidListEntry = ({ place }: { place: number }) => {
  return (
    <BidsEntryRow>
      <PlaceColumn>{place}.</PlaceColumn>
      <BidColumn>-</BidColumn>
      <AddressColumn>-</AddressColumn>
    </BidsEntryRow>
  )
}

const BidsEntryRow = styled.div<{ isUser?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  grid-template-areas: 'place bid address';
  position: relative;

  ${({ isUser }) =>
    isUser &&
    css`
      &::before {
        content: '';
        width: calc(100% + 48px);
        height: calc(100% + 20px);
        border-width: 2px;
        border-style: solid;
        border-image: linear-gradient(90deg, rgba(126, 193, 136, 1), rgba(101, 196, 232, 1), rgba(119, 121, 181, 1)) 1;
        position: absolute;
        top: -10px;
        left: -24px;
        z-index: 1;
      }
    `};
`

const AddressLink = styled.a`
  font-family: 'Jetbrains Mono', 'Space Mono', 'Roboto Mono', monospace;
  font-style: normal;
  color: ${Colors.Blue};
  text-decoration: none;
`
