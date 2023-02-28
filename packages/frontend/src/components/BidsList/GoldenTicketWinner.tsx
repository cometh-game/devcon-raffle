import { useChainId } from 'src/hooks/chainId/useChainId'
import { Colors } from 'src/styles/colors'
import { getExplorerAddressLink } from 'src/utils/getExplorerLink'
import styled from 'styled-components'

interface Props {
  bidderAddress: string | undefined
}

export const GoldenTicketWinner = ({ bidderAddress = '-' }: Props) => {
  const chainId = useChainId()
  return (
    <Container>
      <ReverseDoot>🎉</ReverseDoot>
      <Section>
        <HeaderText>THE GOLDEN TICKET WINNER IS:</HeaderText>
        <AddressLink href={getExplorerAddressLink(chainId, bidderAddress)} target="_blank" rel="noopener noreferrer">
          {bidderAddress}
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
  background-color: #4B00FF;
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
