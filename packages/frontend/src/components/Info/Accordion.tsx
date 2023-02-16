import { formatEther, parseEther } from '@ethersproject/units'
import * as Accordion from '@radix-ui/react-accordion'
import { ArrowDownIcon } from 'src/components/Icons'
import { Rule, RuleText } from 'src/components/Info/Rules'
import { useAuctionWinnersCount } from 'src/hooks/useAuctionWinnersCount'
import { useMinimumBid } from 'src/hooks/useMinimumBid'
import { useRaffleWinnersCount } from 'src/hooks/useRaffleWinnersCount'
import { useVoucherRedeemDeadline } from 'src/hooks/useVoucherRedeemDeadline'
import { Colors } from 'src/styles/colors'
import { formatEndDate } from 'src/utils/formatters'
import styled from 'styled-components'

export const InfoAccordion = () => {
  const auctionWinnersCount = useAuctionWinnersCount()
  const raffleWinnersCount = useRaffleWinnersCount()
  const redeemTimestamp = useVoucherRedeemDeadline()
  const totalCount = auctionWinnersCount && raffleWinnersCount && auctionWinnersCount + raffleWinnersCount
  const reservePrice = formatEther(useMinimumBid())
  const exampleBid = 0.5

  return (
    <Wrapper>
      <Accordion.Root type="single" defaultValue="item-1" collapsible>
        <Accordion.Item value="item-1">
          <StyledHeader>
            <AccordionStyledTrigger heading="What is this?" />
          </StyledHeader>
          <StyledContent>
            In an effort to make our ticket distribution more efficient and fair, we are selling a{' '}
            <Italic>portion</Italic> of this year’s tickets via an on-chain Auction & Raffle. Typically we sell tickets
            in waves; attendees need to wait for a specific release time and refresh the ticket shop rapidly in order to{' '}
            <Italic>hope</Italic> to claim & checkout with a ticket. Not to mention the need for a speedy internet
            connection and crossing your fingers that you’re close enough to our ticketing servers to be one of the
            first to secure a ticket.
            <br />
            <br />
            This year, we wanted to try something different, so we are experimenting with an on-chain Auction & Raffle
            to sell a <Italic>portion</Italic> of EthCC tickets.
          </StyledContent>
        </Accordion.Item>

        <Accordion.Item value="item-2">
          <StyledHeader>
            <AccordionStyledTrigger heading="How to participate in the Auction & Raffle?" />
          </StyledHeader>
          <StyledContent>
            Join the contest by submitting a bid for the ticket based on the amount you would value having a EthCC
            ticket. Bid high to compete for the 20 tickets distributed in the auction, or be entered into the raffle for
            a chance to buy a ticket at the reserve price. You need to bid at least the reserve price, which is set to
            the price of a standard EthCC ticket at time of publication: <Bold>{reservePrice} ETH.</Bold> Please note
            there is a one-person-one-bid rule in place. You will need to submit your name at check-out, and we will
            check IDs at EthCC to verify that the participant is the ticket holder.
          </StyledContent>
        </Accordion.Item>

        <Accordion.Item value="item-3">
          <StyledHeader>
            <AccordionStyledTrigger heading="ELI5 plz?" />
          </StyledHeader>
          <StyledContent>
            Place a bid of at least {reservePrice} ETH for a chance to win a EthCC ticket. If your bid is in the top{' '}
            {auctionWinnersCount}, you will win a EthCC ticket in exchange for the amount you paid in your bid. At any
            point, you can top up your bid if you want. If your bid is not in the top {auctionWinnersCount}, you will be
            entered into a raffle and may be randomly chosen to win a EthCC ticket — if you were randomly selected in
            the Raffle & bid more than the reserve price, you can withdraw the difference. If you do not win, you can
            withdraw your entire bid, minus a 2% sybil-resistance fee.
          </StyledContent>
        </Accordion.Item>

        <Accordion.Item value="item-4">
          <StyledHeader>
            <AccordionStyledTrigger heading="Contest rules" />
          </StyledHeader>
          <StyledContent>
            <RuleText>
              The total number of {totalCount} tickets will be divided between the auction and the raffle pools. All
              winners will receive a voucher code that must be redeemed for a EthCC ticket.
            </RuleText>
            <Rule
              heading={`Auction pool: ${auctionWinnersCount} tickets`}
              rule="Tickets from the auction pool will be distributed to the highest bidding participants. The price paid by a winner in that pool is equal to the amount of their bid. All proceeds will go towards Public Goods."
              example={`You bid ${exampleBid} ETH and end up in the top ${auctionWinnersCount} of the bidders. You receive a ticket for ${exampleBid} ETH.`}
            />
            <Rule
              heading={`Raffle pool: ${raffleWinnersCount} tickets`}
              rule={`From participants who bid below the last bid in the auction pool, ${raffleWinnersCount} will be chosen at random. A winner in that pool will receive a ticket for ${reservePrice} ETH. All funds that they bid over that price will be claimable after the raffle is settled.`}
              example={`You bid ${exampleBid} ETH and end up below the top ${auctionWinnersCount}. If you are selected in the raffle, you pay ${reservePrice} ETH for the ticket and get ${(
                exampleBid - parseEther(reservePrice).toNumber()
              ).toFixed(2)} ETH back.`}
            />
            <Rule
              heading="Golden Ticket: 1 ticket"
              rule="One lucky bidder from the raffle pool will receive a ticket for EthCC 6 totally for free! The Golden Ticket winner will be able to claim the whole amount of their bid after the raffle is settled."
            />
            <Rule
              heading="No luck?"
              rule="In case you don't win, you will be able to withdraw your bid amount minus a 2% sybil-resistance fee."
              example={`You bid ${exampleBid} ETH and end up not winning a ticket. You can get ${
                exampleBid * 0.98
              } ETH back.`}
            />
            <Rule
              heading="What if there’s less than 100 participants?"
              rule={
                <>
                  In the event there are:
                  <BulletList>
                    <li>
                      <ListText>
                        <Bold>1-80 participants:</Bold> All bidders win in the raffle.
                      </ListText>
                    </li>
                    <li>
                      <ListText>
                        <Bold>81 participants:</Bold> Top 1 bidder wins in the auction. 80 remaining bidders win in the
                        raffle.
                      </ListText>
                    </li>
                    <li>
                      <ListText>
                        <Bold>101 participants:</Bold> Top 20 bidders win in the auction. Out of 81 remaining bidders,
                        80 are randomly chosen to win in the raffle.
                      </ListText>
                    </li>
                    <li>
                      <ListText>
                        <Bold>120 participants:</Bold> Top 20 bidders win in the auction. Out of 100 remaining bidders,
                        80 are randomly chosen to win in the raffle.
                      </ListText>
                    </li>
                  </BulletList>
                </>
              }
            />
            <Rule
              heading="What happens when there's a draw?"
              rule="In case there’s a draw between two bids, the earlier bidder takes precedence."
              example={
                <>
                  Bidder A places their first bid of {exampleBid} ETH which puts them in the 1st place. Later Bidder B
                  places their first bid of the same amount which puts them in 2nd place. Next, Bidder B bumps their bid
                  to {exampleBid + 0.1} ETH which puts them in 1st place. Bidder A notices that they lost the first
                  place and decides to bump their bid as well. Bidder A bumps their bid to {exampleBid + 0.1} ETH which{' '}
                  <Bold>puts them in the 1st place</Bold>, because they placed their first bid before Bidder B.
                </>
              }
            />
          </StyledContent>
        </Accordion.Item>

        <Accordion.Item value="item-5">
          <StyledHeader>
            <AccordionStyledTrigger heading="In what form will I get the ticket?" />
          </StyledHeader>
          <StyledContent>
            After the raffle is settled, you will have 48 hours (<Bold>until {formatEndDate(redeemTimestamp)}</Bold>) to
            claim your voucher code for the ticket. In order to do so, you will be asked to sign a message using your
            wallet to authenticate as the owner of the winning account. The voucher code will be presented to you on
            this page.
          </StyledContent>
        </Accordion.Item>

        <Accordion.Item value="item-6">
          <StyledHeader>
            <AccordionStyledTrigger heading="Okay, I got a voucher code. What do I do now?" />
          </StyledHeader>
          <StyledContent>
            <span>
              Your Voucher Code will be available to you for 48 hours after the closing of the Auction & Raffle (
              <Bold>until {formatEndDate(redeemTimestamp)}</Bold>). Once you have input your voucher code into our
              ticket portal, you will go through the standard ticket checkout flow. You can go to{' '}
              <Link href="https://tickets.devcon.org/">our ticket shop here</Link> to redeem your voucher code for a
              EthCC 6 ticket. See you at the conference!
            </span>
          </StyledContent>
        </Accordion.Item>

        <Accordion.Item value="item-7">
          <StyledHeader>
            <AccordionStyledTrigger heading="Other FAQ" />
          </StyledHeader>
          <StyledContent>
            <span>
              Please read our Terms & Conditions{' '}
              <Link href="https://docs.google.com/document/d/1pVU-G8mpPD33EwOwE96MTB_4AZrYa2TNWXLSfkOPCJQ/edit?usp=sharing">
                here
              </Link>{' '}
              as well as our full Auction & Raffle FAQ on our website{' '}
              <Link href="https://devcon.org/en/raffle-auction/">here</Link>.
            </span>
          </StyledContent>
        </Accordion.Item>
      </Accordion.Root>
    </Wrapper>
  )
}

interface AccordionTriggerProps {
  heading: string
}

const AccordionStyledTrigger = ({ heading }: AccordionTriggerProps) => {
  return (
    <StyledTrigger>
      <span>{heading}</span>
      <AccordionArrow color={Colors.Black} size={22} />
    </StyledTrigger>
  )
}

const Wrapper = styled.div`
  width: 100%;
  max-width: 1252px;
  margin: 0 auto;
  padding: 68px 125px 68px 68px;
`
const StyledHeader = styled(Accordion.Header)`
  width: 100%;
`
const StyledTrigger = styled(Accordion.AccordionTrigger)`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px 4px 4px;
  font-family: 'Space Mono', 'Roboto Mono', monospace;
  font-style: normal;
  border: none;
  background-color: ${Colors.GreenLight};
  text-align: left;
  font-size: 20px;
  line-height: 1.5;

  &[data-state='open'] {
    font-weight: 700;
  }

  &[data-state='open'] > div {
    transform: translateY(100%) rotate(180deg);
  }
`

const StyledContent = styled(Accordion.AccordionContent)`
  display: flex;
  flex-direction: column;
  row-gap: 16px;
  margin-top: 32px;

  &[data-state='open'] {
    margin-bottom: 32px;
  }
`

const Italic = styled.span`
  font-style: italic;
  display: contents;
`

const Bold = styled.span`
  font-weight: 600;
  display: contents;
`

const AccordionArrow = styled(ArrowDownIcon)`
  transform: rotate(0);
  transform-origin: top;
`

const Link = styled.a`
  color: ${Colors.Blue};
  text-decoration: underline;
`

const BulletList = styled.ul`
  color: ${Colors.Blue};
  margin: 0;
`

const ListText = styled.span`
  color: ${Colors.Black};
`
