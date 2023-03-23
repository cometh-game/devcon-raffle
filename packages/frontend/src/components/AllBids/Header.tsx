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
  background: linear-gradient(
    to left,
    #2800a5 0%,
    #4b00ff 16.66%,
    #6400ff 33.33%,
    #8c00f0 50%,
    #df00a6 66%,
    #ff005f 83.33%,
    #ff0000 100%
  );

  @media only screen and (max-width: 900px) {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
    padding-left: 16px;
    padding-right: 16px;
    height: auto;
  }
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
