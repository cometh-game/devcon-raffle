import { Auction } from 'src/components/Auction'
import { InfoAccordion } from 'src/components/Info/Accordion'
import { Header } from 'src/components/Info/Header'
import { Info } from 'src/components/Info/Info'
import styled from 'styled-components'
import { useWindowSize } from 'usehooks-ts'

export function Home() {
  const { width } = useWindowSize()

  return (
    <PageContainer id="page-container">
      { width >= 900 && <Info /> }
      { width < 900 && <><Header />&nbsp;</> }
      <Auction />
      { width < 900 && <InfoAccordion /> }
    </PageContainer>
  )
}

const PageContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;

  @media only screen and (max-width: 768px) {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }
`
