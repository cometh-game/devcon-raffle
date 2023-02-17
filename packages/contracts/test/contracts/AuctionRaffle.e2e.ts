import { setupFixtureLoader } from '../setup'
import { auctionRaffleE2EFixture, minBidIncrement, reservePrice } from 'fixtures/auctionRaffleFixture'
import { AuctionRaffleMock } from 'contracts'
import { Provider } from '@ethersproject/providers'
import { BigNumber, constants, Wallet } from 'ethers'
import { randomBigNumbers } from 'scripts/utils/random'
import { expect } from 'chai'
import { heapKey } from 'utils/heapKey'
import { network } from 'hardhat'
import { compareBids } from 'utils/compareBids'
import { HOUR } from 'scripts/utils/consts'

interface Bid {
  bidderID: number,
  amount: BigNumber,
  bumpAmount: BigNumber,
  wallet: Wallet,
}

describe('AuctionRaffle - E2E', function () {
  const loadFixture = setupFixtureLoader()

  let provider: Provider
  let auctionRaffle: AuctionRaffleMock
  let auctionRaffleAsOwner: AuctionRaffleMock
  let wallets: Wallet[]

  let bids: Bid[]
  let sortedBids: Bid[]

  // Increases timeout to 60s to make sure all tests are passing without a timeout
  this.timeout(60_000)

  before('prepare contracts', async function () {
    ({ provider, auctionRaffle, wallets } = await loadFixture(auctionRaffleE2EFixture))
    auctionRaffleAsOwner = auctionRaffle.connect(owner())
  })

  before('prepare bids', function () {
    bids = randomBigNumbers(120).map((bn, index): Bid => ({
      bidderID: index + 1,
      amount: bn.shr(192).add(reservePrice),
      bumpAmount: index % 2 === 0 ? bn.shr(240).add(minBidIncrement) : constants.Zero,
      wallet: wallets[index],
    }),
    )

    // introduce some duplicate amounts
    for (let i = 0; i < 45; i += 3) {
      bids[i].amount = bids[i + 2].amount
    }

    sortedBids = bids.slice().sort(compareBids)
  })

  it('lets 120 participants place bids', async function () {
    for (const { wallet, amount } of bids) {
      await auctionRaffle.connect(wallet).bid({ value: amount })
    }

    expect(await auctionRaffle.getRaffleParticipants()).to.have.lengthOf(120)
    expect(await auctionRaffle.getHeap()).to.have.lengthOf(20)
    const lastAuctionBid = sortedBids[19]
    expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(lastAuctionBid.bidderID, lastAuctionBid.amount))
  })

  it('lets some participants bump bids', async function () {
    for (const { wallet, bumpAmount } of bids) {
      if (!bumpAmount.isZero()) {
        await auctionRaffle.connect(wallet).bid({ value: bumpAmount })
      }
    }

    sortedBids = bids.map(bid => ({ ...bid, amount: bid.amount.add(bid.bumpAmount) })).sort(compareBids)
  })

  it('lets the owner settle the auction', async function () {
    await endBidding(auctionRaffleAsOwner)
    await auctionRaffleAsOwner.settleAuction()

    expect(await auctionRaffle.getHeap()).to.be.empty

    const expectedAuctionWinners = sortedBids.slice(0, 20).map(bid => BigNumber.from(bid.bidderID))
    expect(await auctionRaffle.getAuctionWinners()).to.deep.eq(expectedAuctionWinners)
    expect(await auctionRaffle.getRaffleParticipants()).to.have.lengthOf(100)
  })

  it('lets the owner settle the raffle', async function () {
    await auctionRaffleAsOwner.settleRaffle()

    expect(await auctionRaffle.getRaffleWinners()).to.have.lengthOf(80)
    expect(await auctionRaffle.getRaffleParticipants()).to.have.lengthOf(20)
  })

  it('lets everyone claim their funds', async function () {
    const nonAuctionBids = sortedBids.slice(20)

    for (const { wallet, bidderID } of nonAuctionBids.slice(0, 50)) {
      await auctionRaffle.connect(wallet).claim(bidderID)
    }

    await auctionRaffleAsOwner.claimProceeds()
    await auctionRaffleAsOwner.claimFees(20)

    for (const { wallet, bidderID } of nonAuctionBids.slice(50, 100)) {
      await auctionRaffle.connect(wallet).claim(bidderID)
    }

    expect(await provider.getBalance(auctionRaffle.address)).to.eq(0)
  })

  it('divides bidders into 3 disjoint sets', async function () {
    const bidders = [
      ...await auctionRaffle.getAuctionWinners(),
      ...await auctionRaffle.getRaffleWinners(),
      ...await auctionRaffle.getRaffleParticipants(),
    ]

    let bids = []
    for (const bidder of bidders) {
      bids.push(await auctionRaffle.getBidByID(bidder))
    }
    bids = bids.sort(compareBids).map(bid => ({
      bidderID: bid.bidderID.toNumber(),
      amount: bid.amount,
    }))

    const expectedBids = sortedBids.map(({ bidderID, amount }) => ({ bidderID, amount }))
    expect(bids).to.deep.eq(expectedBids)
  })

  function owner() {
    return wallets[1]
  }

  async function endBidding(auctionRaffle: AuctionRaffleMock) {
    const endTime = await auctionRaffle.biddingEndTime()
    await network.provider.send('evm_setNextBlockTimestamp', [endTime.add(HOUR).toNumber()])
    await network.provider.send('evm_mine')
  }
})
