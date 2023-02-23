import { TruefiLogoIcon } from 'src/components/Icons'
import { Colors, hexOpacity } from 'src/styles/colors'
import styled from 'styled-components'

export const Footer = () => {
  return (
    <FooterContainer>
      <FooterRow>
        <p>Built with 💙 by</p>
        <LogoLink href="https://truefi.io/" target="_blank" rel="noopener noreferrer">
          <TruefiLogoIcon />
        </LogoLink>
        {/* <p>adapted by</p>
        <LogoLink href="https://cometh.io/" target="_blank" rel="noopener noreferrer">
          <ComethLogoIcon />
        </LogoLink>
        <p>for EthCC</p> */}
      </FooterRow>
    </FooterContainer>
  )
}

const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: ${Colors.White};
  border-top: 1px solid ${hexOpacity(Colors.Black, 0.1)};
`

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  column-gap: 16px;
  padding: 16px 0;
`

const LogoLink = styled.a`
  display: flex;
  align-items: center;
`
