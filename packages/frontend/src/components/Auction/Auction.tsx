import { UserActionSection } from 'src/components/Auction'
import { BidsListSection } from 'src/components/BidsList'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

export const Auction = () => {
  return (
    <Wrapper id="wrapper">
      <UserActionSection />
      <BidsListSection />
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 670px;
  padding: 0 115px;
  background: ${Colors.GreyLight};

  @media only screen and (max-width: 800px) {
    width: 100%;
    padding-left: 16px;
    padding-right: 16px;
  }
`
