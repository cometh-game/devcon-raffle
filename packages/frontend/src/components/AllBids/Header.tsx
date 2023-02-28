import { BackButton } from 'src/components/Buttons'
import { HeaderBar } from 'src/components/common/Header'
import { useAuctionWinnersCount, useBids, useRaffleWinnersCount } from 'src/hooks'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

export const Header = () => {
  const auctionWinnersCount = useAuctionWinnersCount()
  const raffleWinnersCount = useRaffleWinnersCount()
  const isLoadingParams = auctionWinnersCount === undefined || raffleWinnersCount === undefined

  const { bids } = useBids()
  return (
    <StyledHeader>
      <BackButton url="/" />
      <Wrapper>
        <Title>
          <h2>Number of participants:</h2>
          <h2>{isLoadingParams ? 0 : bids.size}</h2>
        </Title>
      </Wrapper>
    </StyledHeader>
  )
}

const StyledHeader = styled(HeaderBar)`
  height: 160px;
  padding: 28px 68px;
  overflow: hidden;
  display: flex;
  flex-shrink: 0;
  width: 100%;
  position: relative;
  background: linear-gradient(to left, #2800A5 0%, #4B00FF 16.66%, #6400FF 33.33%, #8C00F0 50%, #DF00A6 66%, #FF005F 83.33%, #FF0000 100%);
`

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: ${Colors.White};
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 8px;
`

const Key = styled.div`
  position: absolute;
  bottom: -5px;
  right: 68px;
  height: 225px;
`

const Number = styled.h2`
  color: ${Colors.BlueDark};
`
