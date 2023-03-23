import { AccountButton } from 'src/components/Buttons'
import { Logo } from 'src/components/Icons'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

export const TopBar = () => {
  return (
    <TopBarContainer>
      <HomeLink href="/">
        <Logo />
      </HomeLink>
      <AccountButton />
    </TopBarContainer>
  )
}

const TopBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px 68px;
  background-color: ${Colors.White};
  position: sticky;
  top: 0;
  z-index: 99;

  @media only screen and (max-width: 800px) {
    padding: 8px 16px;
  }
`
const HomeLink = styled.a`
  line-height: 1;
`
