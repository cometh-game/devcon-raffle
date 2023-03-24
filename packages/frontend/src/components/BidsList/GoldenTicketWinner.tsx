import { useChainId } from 'src/hooks/chainId/useChainId'
import { Colors } from 'src/styles/colors'
import { shortenEthAddress } from 'src/utils/formatters'
import { getExplorerAddressLink } from 'src/utils/getExplorerLink'
import styled from 'styled-components'
import { useWindowSize } from 'usehooks-ts'

interface Props {
  bidderAddress: string | undefined
}

export const GoldenTicketWinner = ({ bidderAddress = '-' }: Props) => {
  const chainId = useChainId()
  const { width } = useWindowSize()

  return (
    <Container>
      <ReverseDoot>🎉</ReverseDoot>
      <Section>
        <HeaderText>THE GOLDEN TICKET WINNER IS:</HeaderText>
        <AddressLink href={getExplorerAddressLink(chainId, bidderAddress)} target="_blank" rel="noopener noreferrer">
          {width < 900 ? shortenEthAddress(bidderAddress) : bidderAddress}
        </AddressLink>
      </Section>
      <Doot>🎉</Doot>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  height: 90px;
  background-color: #4b00ff;

  @media only screen and (max-width: 900px) {
    display: flex;
    flex-direction: column;
    row-gap: 20px;
    width: 100%;
    padding-top: 32px;
    padding-bottom: 32px;
    height: auto;
  }
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  height: 100%;
`

const Doot = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
`

const ReverseDoot = styled(Doot)`
  transform: matrix(-1, 0, 0, 1, 0, 0);
`

const HeaderText = styled.h3`
  font-size: 20px;
  line-height: 150%;
  color: ${Colors.White};
`

const AddressLink = styled.a`
  font-family: 'Jetbrains Mono', 'Space Mono', 'Roboto Mono', monospace;
  font-style: normal;
  color: ${Colors.White};
  text-decoration: none;
`
