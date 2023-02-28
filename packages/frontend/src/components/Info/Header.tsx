import { AuctionState, useAuctionState } from 'src/hooks'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

import background from '../../assets/ethcc-background.svg'

import { HeaderBar } from '../common/Header'

import { ClaimTicketTimeLeft } from './ClaimTicketTimeLeft'

export const Header = () => {
  const state = useAuctionState()

  return (
    <Wrapper>
      <StyledHeader>
        <HeaderWrapper>
          <InfoWrapper>
            <TitleWrapper>
              <Title>EthCC[6]</Title>
              <SubTitle>Auction & Raffle Ticket Sale</SubTitle>
            </TitleWrapper>
          </InfoWrapper>
        </HeaderWrapper>
      </StyledHeader>
      {isClaimingFlow(state) && <ClaimTicketTimeLeft />}
    </Wrapper>
  )
}

function isClaimingFlow(state: AuctionState) {
  return state === 'ClaimingFlow' || state === 'ClaimingClosed'
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const StyledHeader = styled(HeaderBar)`
  height: 225px;
  padding: 16px 125px 24px 68px;

  #background-image: url(${background});
  #background-size: cover;
`

const HeaderWrapper = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  max-width: 1058px;
  margin: 0 auto;
  position: relative;
`

const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  color: ${Colors.White};

  @media screen and (min-width: 1800px) {
    justify-content: flex-start;
    row-gap: 40px;
  }
`

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;

  @media screen and (min-width: 1800px) {
    flex-direction: row;
    align-items: flex-end;
    column-gap: 20px;
    padding-top: 16px;
  }
`

const Title = styled.h1`
  color: ${Colors.Black};
  @media screen and (min-width: 1800px) {
    line-height: 1;
  }

  @media screen and (max-width: 1260px) {
    font-size: 40px;
  }
`

const SubTitle = styled.h3`
  color: ${Colors.Black};
`
