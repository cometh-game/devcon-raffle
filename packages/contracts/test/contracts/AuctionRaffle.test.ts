import { MerkleTree } from 'merkletreejs'
import { setupFixtureLoader } from '../setup'
import { expect } from 'chai'
import {
  configuredAuctionRaffleFixture,
  auctionRaffleFixture,
  auctionRaffleFixtureWithToken,
  minBidIncrement,
  reservePrice,
} from 'fixtures/auctionRaffleFixture'
import { hashDiscount } from 'fixtures/merkleTreeFixture'
import { AuctionRaffleMock, ExampleToken } from 'contracts'
import { getLatestBlockTimestamp } from 'utils/getLatestBlockTimestamp'
import { Provider } from '@ethersproject/providers'
import { Zero } from '@ethersproject/constants'
import { HOUR, MINUTE } from 'scripts/utils/consts'
import { network, ethers } from 'hardhat'
import { setPrevRandao } from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber, BigNumberish, ContractTransaction, Wallet } from 'ethers'
import { State } from './state'
import { WinType } from './winType'
import { bigNumberArrayFrom } from 'utils/bigNumber'
import { randomAddress } from 'utils/randomAddress'
import { Bid } from './bid'
import { parseEther } from 'ethers/lib/utils'
import { randomBigNumbers } from 'scripts/utils/random'
import { heapKey } from 'utils/heapKey'

describe('AuctionRaffle', function () {
  const loadFixture = setupFixtureLoader()

  let provider: Provider
  let auctionRaffle: AuctionRaffleMock
  let auctionRaffleAsOwner: AuctionRaffleMock
  let bidderAddress: string
  let wallets: Wallet[]
  let discountTree: MerkleTree
  let discounts
  let bidderProof: string[]

  beforeEach(async function () {
    ({ provider, auctionRaffle, wallets, discountTree, discounts } = await loadFixture(configuredAuctionRaffleFixture({})))
    auctionRaffleAsOwner = auctionRaffle.connect(owner())
    bidderAddress = await auctionRaffle.signer.getAddress()
    bidderProof = discountTree.getHexProof(hashDiscount(bidderAddress, discounts[0]))
  })

  it.skip('should handle the load with 500 participants (TAKES A LONG TIME)', async function () {
    this.timeout(500000);

    ({ provider, auctionRaffle, wallets, discountTree, discounts } = await loadFixture(configuredAuctionRaffleFixture({
      reservePrice: ethers.utils.parseEther('0.000000001'),
      minBidIncrement: ethers.utils.parseEther('0.00000001'),
      auctionWinnersCount: 20,
      raffleWinnersCount: 280,
    })))
    const reservePrice = ethers.utils.parseEther('0.000000001')
    const minBid = ethers.utils.parseEther('0.00000001')
    auctionRaffleAsOwner = auctionRaffle.connect(owner())
    bidderAddress = await auctionRaffle.signer.getAddress()
    bidderProof = discountTree.getHexProof(hashDiscount(bidderAddress, discounts[0]))

    const mnemonic = 'lucky elephant lunch topic believe snap either ankle group orbit meadow genuine'
    const path = (i) =>  `m/44'/60'/0'/0/${i.toString(10)}`
    const hdWallet = ethers.utils.HDNode.fromMnemonic(mnemonic)
    const n = 10000

    const bidderWallets = new Array(n).fill(0).map(function (_, i) {
      const node = hdWallet.derivePath(path(i))
      return new ethers.Wallet(node.privateKey, provider)
    })

    for (let i = 0; i < n; i++) {
      if (i > 0 && i % 100 === 0) console.log('fund', i)

      await wallets[0].sendTransaction({
        to: bidderWallets[i].address,
        value: ethers.utils.parseEther('0.01')
      })
    }

    const chunkSize = 50;
    const array = bidderWallets
    for (let i = 0; i < array.length; i += chunkSize) {
      console.log('bid', i)
      const chunk = array.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async function (bidder, j) {
        const v = reservePrice.add(minBid.mul(BigNumber.from(j)))
        try {
          await auctionRaffle.connect(bidder).bid({ gasLimit: 1_000_000, value: v })
        } catch (err) {
          console.error(i, err)
        }
      }))
    }

    console.log('endBidding')

    await endBidding(auctionRaffle)

    console.log('settleAuction')
    await auctionRaffleAsOwner.settleAuction()
    console.log('settleRaffle')
    await auctionRaffleAsOwner.settleRaffle()

    const tx = await auctionRaffleAsOwner.claimProceeds()
    const receipt = await tx.wait()
  });

  describe('bidWithDiscount', function () {
    it('should revert if proof is invalid', async function () {
      const invalidDiscount = 100

      await expect(auctionRaffle.bidWithDiscount(invalidDiscount, bidderProof)).to.be.revertedWith('AuctionRaffle: discount proof invalid')
    })

    it('should revert if discount is greater than 100', async function () {
      const invalidDiscount = 110

      await expect(auctionRaffle.bidWithDiscount(invalidDiscount, bidderProof)).to.be.revertedWith('AuctionRaffle: discount must be at most 100%')
    })

    it('should bid with discount', async function () {
      await auctionRaffle.bidWithDiscount(discounts[0], bidderProof, { value: reservePrice })

      const bid = await auctionRaffle.getBid(bidderAddress)

      expect(bid.discount).to.equal(parseEther('0.05'))
    })

    it('should increase discount', async function () {
      await auctionRaffle.bidWithDiscount(discounts[0], bidderProof, { value: reservePrice })

      const leaf = hashDiscount(bidderAddress, discounts[1])
      const proof = discountTree.getHexProof(leaf)
      await auctionRaffle.bidWithDiscount(discounts[1], proof, { value: reservePrice, gasLimit: 1000000 })

      const bid = await auctionRaffle.getBid(bidderAddress)
      expect(bid.discount).to.equal(parseEther('0.10'))
    })

    it('should keep highest discount', async function () {
      const proof = discountTree.getHexProof(hashDiscount(bidderAddress, discounts[1]))
      await auctionRaffle.bidWithDiscount(discounts[1], proof, { value: reservePrice })

      await auctionRaffle.bidWithDiscount(discounts[0], bidderProof, { value: reservePrice })

      const bid = await auctionRaffle.getBid(bidderAddress)
      expect(bid.discount).to.equal(parseEther('0.10'))
    })

    describe('when bidder already has a bid', async function () {
      beforeEach(async function () {
        await auctionRaffle.bid({ value: reservePrice })
      })

      it('should bid with discount', async function () {
        await auctionRaffle.bidWithDiscount(discounts[0], bidderProof, { value: reservePrice })

        const bid = await auctionRaffle.getBid(bidderAddress)

        expect(bid.discount).to.equal(parseEther('0.05'))
      })
    })
  })

  describe('bid', function () {
    it('reverts if bidding is not opened yet', async function () {
      const currentTime = await getLatestBlockTimestamp(provider);
      ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ biddingStartTime: currentTime + MINUTE })))

      await expect(auctionRaffle.bid()).to.be.revertedWith('AuctionRaffle: is in invalid state')
    })

    it('reverts if bidding is already closed', async function () {
      const endTime = await auctionRaffle.biddingEndTime()
      await network.provider.send('evm_setNextBlockTimestamp', [endTime.add(HOUR).toNumber()])

      await expect(auctionRaffle.bid()).to.be.revertedWith('AuctionRaffle: is in invalid state')
    })

    it('reverts if bid increase is too low', async function () {
      await auctionRaffle.bid({ value: reservePrice })
      await expect(auctionRaffle.bid({ value: minBidIncrement.sub(100) }))
        .to.be.revertedWith('AuctionRaffle: bid increment too low')
    })

    it('increases bid amount', async function () {
      await auctionRaffle.bid({ value: reservePrice })
      await expect(auctionRaffle.bid({ value: minBidIncrement })).to.be.not.reverted

      const bid = await auctionRaffle.getBid(bidderAddress)
      expect(bid.amount).to.be.equal(reservePrice.add(minBidIncrement))
    })

    it('reverts if bid amount is below reserve price', async function () {
      await expect(auctionRaffle.bid({ value: reservePrice.sub(100) }))
        .to.be.revertedWith('AuctionRaffle: bid amount is below reserve price')
    })

    it('saves bid', async function () {
      await expect(auctionRaffle.bid({ value: reservePrice })).to.be.not.reverted

      const bid = await auctionRaffle.getBid(bidderAddress)

      expect(bid.bidderID).to.be.equal(1)
      expect(bid.amount).to.be.equal(reservePrice)
      expect(bid.winType).to.be.equal(WinType.loss)
      expect(bid.claimed).to.be.false
      expect(bid.discount).to.equal(0)
    })

    it('saves bidder address', async function () {
      await auctionRaffle.bid({ value: reservePrice })

      const savedBidderAddress = await auctionRaffle.getBidderAddress(1)
      expect(savedBidderAddress).to.be.equal(bidderAddress)
    })

    it('saves bidder as raffle participant', async function () {
      await auctionRaffle.bid({ value: reservePrice })

      expect(await auctionRaffle.getRaffleParticipants()).to.deep.eq([BigNumber.from(1)])
    })

    it('increases bidders count', async function () {
      await auctionRaffle.bid({ value: reservePrice })

      expect(await auctionRaffle.getBiddersCount()).to.be.equal(1)
    })

    describe('when user already has discount', function () {
      it('should increase bid and add discount', async function () {
        await auctionRaffle.bidWithDiscount(discounts[0], bidderProof, { value: reservePrice })

        const bid = await auctionRaffle.getBid(bidderAddress)

        expect(bid.amount).to.equal(parseEther('0.5'))
        expect(bid.discount).to.equal(parseEther('0.05'))
      })
    })

    describe('when heap is full', function () {
      describe('when bid < min auction bid', function () {
        it('does not add bid to heap', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))

          await bidAsWallet(wallets[0], reservePrice.add(100))
          await bidAsWallet(wallets[1], reservePrice.add(200))
          await bidAsWallet(wallets[2], reservePrice.add(50))

          expect(await auctionRaffle.getHeap()).to.deep.equal([
            heapKey(2, reservePrice.add(200)),
            heapKey(1, reservePrice.add(100)),
          ])
          expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
          expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(1, reservePrice.add(100)))
        })
      })

      describe('when bid > min auction bid', function () {
        it('replaces minimum auction bid', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))

          await bid(2)
          await bidAsWallet(wallets[2], reservePrice.add(100))
          await bidAsWallet(wallets[3], reservePrice.add(120))

          expect(await auctionRaffle.getHeap())
            .to.deep.equal([heapKey(4, reservePrice.add(120)), heapKey(3, reservePrice.add(100))])
          expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
          expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(3, reservePrice.add(100)))
        })
      })

      describe('when bumped bid < min auction bid', function () {
        it('does not add bid to heap', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))

          await bidAsWallet(wallets[0], reservePrice.add(minBidIncrement).add(100))
          await bidAsWallet(wallets[1], reservePrice.add(minBidIncrement).add(200))
          await bidAsWallet(wallets[2], reservePrice)

          await bidAsWallet(wallets[2], minBidIncrement)

          expect(await auctionRaffle.getHeap()).to.deep.equal([
            heapKey(2, reservePrice.add(minBidIncrement).add(200)),
            heapKey(1, reservePrice.add(minBidIncrement).add(100)),
          ])
          expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
          expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(1, reservePrice.add(minBidIncrement).add(100)))
        })
      })

      describe('when bumped bid > min auction bid', function () {
        describe('when old bid < min auction bid', function () {
          it('adds bid to heap', async function () {
            ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))

            await bidAsWallet(wallets[0], reservePrice)
            await bidAsWallet(wallets[1], reservePrice.add(minBidIncrement).add(200))
            await bidAsWallet(wallets[2], reservePrice.add(minBidIncrement))

            await bidAsWallet(wallets[0], minBidIncrement.add(100))

            expect(await auctionRaffle.getHeap()).to.deep.equal([
              heapKey(2, reservePrice.add(minBidIncrement).add(200)),
              heapKey(1, reservePrice.add(minBidIncrement).add(100)),
            ])
            expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
            expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(1, reservePrice.add(minBidIncrement).add(100)))
          })
        })

        describe('when old bid == min auction bid', function () {
          it('updates bid in heap', async function () {
            ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))

            await bidAsWallet(wallets[0], reservePrice)
            await bidAsWallet(wallets[1], reservePrice.add(minBidIncrement).add(200))

            await bidAsWallet(wallets[0], minBidIncrement.add(100))

            expect(await auctionRaffle.getHeap()).to.deep.equal([
              heapKey(2, reservePrice.add(minBidIncrement).add(200)),
              heapKey(1, reservePrice.add(minBidIncrement).add(100)),
            ])
            expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
            expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(1, reservePrice.add(minBidIncrement).add(100)))
          })
        })

        describe('when old bid > min auction bid', function () {
          it('updates bid in heap', async function () {
            ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))

            await bidAsWallet(wallets[0], reservePrice)
            await bidAsWallet(wallets[1], reservePrice.add(200))

            await bidAsWallet(wallets[1], minBidIncrement)

            expect(await auctionRaffle.getHeap()).to.deep.equal([
              heapKey(2, reservePrice.add(minBidIncrement).add(200)),
              heapKey(1, reservePrice),
            ])
            expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
            expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(1, reservePrice))
          })
        })
      })
    })

    describe('when heap is not full', function () {
      describe('when bid < min auction bid', function () {
        it('adds bid to heap', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))

          const auctionWinnerBid = reservePrice.add(100)
          await bidAsWallet(wallets[0], auctionWinnerBid)
          await bidAsWallet(wallets[1], reservePrice)

          expect(await auctionRaffle.getHeap())
            .to.deep.equal([heapKey(1, auctionWinnerBid), heapKey(2, reservePrice)])
          expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
          expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(2, reservePrice))
        })
      })

      describe('when bid > min auction bid', function () {
        it('adds bid to heap', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))

          const auctionWinnerBid = reservePrice.add(100)
          await bidAsWallet(wallets[0], reservePrice)
          await bidAsWallet(wallets[1], auctionWinnerBid)

          expect(await auctionRaffle.getHeap())
            .to.deep.equal([heapKey(2, auctionWinnerBid), heapKey(1, reservePrice)])
          expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
          expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(1, reservePrice))
        })
      })

      describe('when bumped bid == min auction bid', function () {
        it('updates old bid in heap', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 4 })))

          await bidAsWallet(wallets[0], reservePrice.add(200))
          await bidAsWallet(wallets[1], reservePrice.add(minBidIncrement))
          await bidAsWallet(wallets[2], reservePrice.add(minBidIncrement).add(100))

          await bidAsWallet(wallets[0], minBidIncrement)

          expect(await auctionRaffle.getHeap()).to.deep.equal([
            heapKey(1, reservePrice.add(minBidIncrement).add(200)),
            heapKey(3, reservePrice.add(minBidIncrement).add(100)),
            heapKey(2, reservePrice.add(minBidIncrement)),
          ])
          expect(await auctionRaffle.getMinKeyIndex()).to.eq(2)
          expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(2, reservePrice.add(minBidIncrement)))
        })
      })

      describe('when bumped bid > min auction bid', function () {
        it('updates old bid in heap', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 3 })))

          let auctionWinnerBid = reservePrice.add(100)
          await bidAsWallet(wallets[0], auctionWinnerBid)
          await bidAsWallet(wallets[1], reservePrice)
          await bidAsWallet(wallets[0], minBidIncrement)
          auctionWinnerBid = auctionWinnerBid.add(minBidIncrement)

          expect(await auctionRaffle.getHeap())
            .to.deep.equal([heapKey(1, auctionWinnerBid), heapKey(2, reservePrice)])
          expect(await auctionRaffle.getMinKeyIndex()).to.eq(1)
          expect(await auctionRaffle.getMinKeyValue()).to.eq(heapKey(2, reservePrice))
        })
      })
    })

    it('emits event on bid increase', async function () {
      await auctionRaffle.bid({ value: reservePrice })

      await expect(auctionRaffle.bid({ value: minBidIncrement }))
        .to.emit(auctionRaffle, 'NewBid')
        .withArgs(bidderAddress, 1, reservePrice.add(minBidIncrement))
    })

    it('emits event on bid', async function () {
      await expect(auctionRaffle.bid({ value: reservePrice }))
        .to.emit(auctionRaffle, 'NewBid')
        .withArgs(bidderAddress, 1, reservePrice)
    })
  })

  describe('settleAuction', function () {
    beforeEach(async function () {
      await bid(9)
    })

    it('reverts if called not by owner', async function () {
      await expect(auctionRaffle.settleAuction())
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if bidding is in progress', async function () {
      await expect(settleAuction())
        .to.be.revertedWith('AuctionRaffle: is in invalid state')
    })

    it('reverts if called twice', async function () {
      await endBidding(auctionRaffleAsOwner)
      await settleAuction()
      await expect(settleAuction())
        .to.be.revertedWith('AuctionRaffle: is in invalid state')
    })

    it('changes state if number of bidders is less than raffleWinnersCount', async function () {
      ({ auctionRaffle } = await loadFixture(auctionRaffleFixture))
      auctionRaffleAsOwner = auctionRaffle.connect(owner())

      await bid(1)

      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      expect(await auctionRaffleAsOwner.getState()).to.be.equal(State.auctionSettled)
    })

    it('chooses auction winners when there are not enough participants for entire auction', async function () {
      ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 5 })))
      auctionRaffleAsOwner = auctionRaffle.connect(owner())

      await bid(9)

      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      const auctionWinners = await getAllBidsByWinType(9, WinType.auction)
      expect(auctionWinners.length).to.equal(1)
      expect(auctionWinners[0].bidderID).to.eq(1)
    })

    it('changes bidder win type', async function () {
      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      const bid = await getBidByID(1)
      expect(bid.winType).to.deep.equal(WinType.auction)
    })

    it('saves auction winners', async function () {
      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      expect(await auctionRaffleAsOwner.getAuctionWinners()).to.deep.equal(bigNumberArrayFrom([1]))
    })

    it('deletes heap', async function () {
      ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 5 })))
      auctionRaffleAsOwner = auctionRaffle.connect(owner())

      await bid(10)
      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      expect(await auctionRaffleAsOwner.getHeap()).to.deep.equal([])
    })

    it('removes winners from raffle participants', async function () {
      ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))
      auctionRaffleAsOwner = auctionRaffle.connect(owner())

      await bid(10)

      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      expect(await auctionRaffle.getRaffleParticipants()).to.deep.eq(bigNumberArrayFrom([9, 10, 3, 4, 5, 6, 7, 8]))
    })

    it('emits events', async function () {
      ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2 })))
      auctionRaffleAsOwner = auctionRaffle.connect(owner())

      await bid(10)
      await endBidding(auctionRaffleAsOwner)

      const tx = await settleAuction()
      await emitsEvents(tx, 'NewAuctionWinner', [1], [2])
    })
  })

  describe('settleRaffle', function () {
    beforeEach(async function () {
      await bid(9)
    })

    it('reverts if called not by owner', async function () {
      await expect(auctionRaffle.settleRaffle())
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if raffle is not settled', async function () {
      await expect(auctionRaffleAsOwner.settleRaffle())
        .to.be.revertedWith('AuctionRaffle: is in invalid state')
    })

    describe('when bidders count is less than raffleWinnersCount', function () {
      it('picks all participants as winners', async function () {
        ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ raffleWinnersCount: 16 })))
        auctionRaffleAsOwner = auctionRaffle.connect(owner())

        await bid(4)

        await endBidding(auctionRaffleAsOwner)
        await settleAuction()

        // Golden ticket winner participant index generated from this number: 2, bidderID: 3
        const randomNumber = BigNumber.from('65155287986987035700835155359065462427392489128550609102552042044410661181326')
        await setPrevRandao(randomNumber.toHexString())
        await auctionRaffleAsOwner.settleRaffle()

        for (let i = 1; i <= 4; i++) {
          const bid = await getBidByID(i)

          if (bid.bidderID.eq(3)) {
            expect(bid.winType).to.be.eq(WinType.goldenTicket)
          } else {
            expect(bid.winType).to.be.eq(WinType.raffle)
          }
        }
      })

      it('saves raffle winners', async function () {
        await bidAndSettleRaffle(0)
        await verifyRaffleWinners()
      })

      it('removes raffle participants', async function () {
        ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ raffleWinnersCount: 16 })))
        auctionRaffleAsOwner = auctionRaffle.connect(wallets[1])

        await bidAndSettleRaffle(4)
        const raffleParticipants = await auctionRaffleAsOwner.getRaffleParticipants()
        expect(raffleParticipants.length).to.be.equal(0)
      })
    })

    describe('when bidders count is greater than raffleWinnersCount', function () {
      it('saves raffle winners', async function () {
        await bidAndSettleRaffle(12)
        await verifyRaffleWinners()
      })
    })

    it('picks correct numbers of winners', async function () {
      await bid(10)
      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      await auctionRaffleAsOwner.settleRaffle()

      const raffleWinners = await getAllBidsByWinType(10, WinType.raffle)
      const goldenWinners = await getAllBidsByWinType(10, WinType.goldenTicket)

      expect(raffleWinners.length).to.be.equal(7)
      expect(goldenWinners.length).to.be.equal(1)
    })

    it('selects random winners', async function () {
      ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ raffleWinnersCount: 16 })))
      auctionRaffleAsOwner = auctionRaffle.connect(owner())

      await bid(20)

      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      const seed =
        BigNumber.from('112726022748934390014388827089462711312944969753614146584009694773482609536945')

      const participants = await auctionRaffle.getRaffleParticipants();

      await setPrevRandao(seed.toHexString())
      await auctionRaffleAsOwner.settleRaffle()

      const winnersBidderIDs = [15, 10, 17, 19, 7, 13, 5, 16, 2, 20, 12, 3, 6, 4, 8, 18]

      for (let i = 0; i < winnersBidderIDs.length; i++) {
        const winningBid = await getBidByID(winnersBidderIDs[i])
        if (i === 0) {
          expect(winningBid.winType).to.be.eq(WinType.goldenTicket)
          continue
        }
        expect(winningBid.winType).to.be.eq(WinType.raffle)
      }
    })

    it('works if there are no participants', async function () {
      ({ auctionRaffle } = await loadFixture(auctionRaffleFixture))
      auctionRaffleAsOwner = auctionRaffle.connect(owner())

      await bidAndSettleRaffle(0)
    })

    it('changes state', async function () {
      await endBidding(auctionRaffleAsOwner)

      await settleAuction()

      await auctionRaffleAsOwner.settleRaffle()

      expect(await auctionRaffleAsOwner.getState()).to.be.eq(State.raffleSettled)
    })

    describe('when golden ticket winner has been selected', function () {
      it('emits event', async function () {
        const tx = await bidAndSettleRaffle(0)

        const goldenBid = await getBidByWinType(9, WinType.goldenTicket)
        await emitsEvents(tx, 'NewGoldenTicketWinner', [goldenBid.bidderID])
      })
    })

    describe('when raffle winners have been selected', function () {
      it('emits events', async function () {
        await endBidding(auctionRaffleAsOwner)
        await settleAuction() // auction winner bidderID: 1

        // Golden ticket winner participant index generated from this number: 7, bidderID: 4
        await setPrevRandao(BigNumber.from(7).toHexString());
        const tx = await auctionRaffleAsOwner.settleRaffle()

        const raffleWinners = [9, 2, 3, 8, 5, 6, 7].map((v) => [v])
        await emitsEvents(tx, 'NewRaffleWinner', ...raffleWinners)
      })
    })

    async function verifyRaffleWinners() {
      const raffleWinners = await auctionRaffleAsOwner.getRaffleWinners()

      for (let i = 0; i < raffleWinners.length; i++) {
        const winnerBid = await getBidByID(raffleWinners[i].toNumber())
        if (i === 0) {
          expect(winnerBid.winType).to.be.equal(WinType.goldenTicket)
          continue
        }

        expect(winnerBid.winType).to.be.equal(WinType.raffle)
      }
    }
  })

  describe('claim', function () {
    it('reverts if settling is not finished yet', async function () {
      await endBidding(auctionRaffleAsOwner)
      await settleAuction()

      await expect(auctionRaffle.claim(4))
        .to.be.revertedWith('AuctionRaffle: is in invalid state')
    })

    it('reverts if bidder does not exist', async function () {
      await bidAndSettleRaffle(2)

      await expect(auctionRaffle.claim(20))
        .to.be.revertedWith('AuctionRaffle: bidder with given ID does not exist')
    })

    it('reverts if funds have been already claimed', async function () {
      await bidAndSettleRaffle(4)

      await auctionRaffle.claim(4)
      await expect(auctionRaffle.claim(4))
        .to.be.revertedWith('AuctionRaffle: funds have already been claimed')
    })

    it('reverts if auction winner wants to claim funds', async function () {
      await bidAndSettleRaffle(9)

      await expect(auctionRaffle.claim(1))
        .to.be.revertedWith('AuctionRaffle: auction winners cannot claim funds')
    })

    it('sets bid as claimed', async function () {
      await bidAndSettleRaffle(5)

      await auctionRaffleAsOwner.claim(1)

      const bid = await getBidByID(1)
      expect(bid.claimed).to.be.true
    })

    it('transfers remaining funds for raffle winner', async function () {
      await bid(9) // place 9 bids = reservePrice
      await bidAsWallet(owner(), reservePrice) // bumps owner bid to become auction winner
      await bidAndSettleRaffle(9) // bumps all 9 bids
      const raffleBid = await getBidByWinType(9, WinType.raffle) // get any raffle winner
      const bidderAddress = await auctionRaffleAsOwner.getBidderAddress(raffleBid.bidderID)

      const bidderBalanceBeforeClaim = await provider.getBalance(bidderAddress)
      await auctionRaffleAsOwner.claim(raffleBid.bidderID)

      expect(await provider.getBalance(bidderAddress)).to.be.equal(bidderBalanceBeforeClaim.add(reservePrice))
    })

    it('transfers remaining funds plus discount for raffle winner with discount', async function () {
      await bidsWithDiscount(9, discounts[0]) // place 9 bids with discount = reservePrice
      await bidAsWallet(owner(), reservePrice) // bumps owner bid to become auction winner
      await bidAndSettleRaffle(9) // bumps all 9 bids

      const raffleBid = await getBidByWinType(9, WinType.raffle) // get any raffle winner
      const bidderAddress = await auctionRaffleAsOwner.getBidderAddress(raffleBid.bidderID)

      const bidderBalanceBeforeClaim = await provider.getBalance(bidderAddress)
      await auctionRaffleAsOwner.claim(raffleBid.bidderID)
      const discount = parseEther('0.05')

      const expected = bidderBalanceBeforeClaim.add(reservePrice.add(discount))
      expect(await provider.getBalance(bidderAddress)).to.be.equal(expected)

    })

    it('transfers bid funds for golden ticket winner', async function () {
      await bidAsWallet(owner(), reservePrice)
      await bidAndSettleRaffle(10)

      const goldenBid = await getBidByWinType(10, WinType.goldenTicket)

      const bidderAddress = await auctionRaffleAsOwner.getBidderAddress(goldenBid.bidderID)
      const bidderBalance = await provider.getBalance(bidderAddress)
      const expectedBidderBalance = bidderBalance.add(goldenBid.amount)

      await auctionRaffleAsOwner.claim(goldenBid.bidderID)

      expect(await provider.getBalance(bidderAddress)).to.be.equal(expectedBidderBalance)
    })

    it('transfers bid funds for non-winning bidder', async function () {
      await bidAsWallet(owner(), reservePrice)
      await bidAndSettleRaffle(10)

      const lostBid = await getBidByWinType(10, WinType.loss)

      const bidderAddress = await auctionRaffleAsOwner.getBidderAddress(lostBid.bidderID)
      const bidderBalance = await provider.getBalance(bidderAddress)
      const expectedBidderBalance = bidderBalance.add(reservePrice.mul(98).div(100))

      await auctionRaffleAsOwner.claim(lostBid.bidderID)

      expect(await provider.getBalance(bidderAddress)).to.be.equal(expectedBidderBalance)
    })
  })

  describe('claimProceeds', function () {
    describe('when called not by owner', function () {
      it('reverts', async function () {
        await expect(auctionRaffle.claimProceeds())
          .to.be.revertedWith('Ownable: caller is not the owner')
      })
    })

    describe('when proceeds have already been claimed', function () {
      it('reverts', async function () {
        await bidAndSettleRaffle(2)
        await auctionRaffleAsOwner.claimProceeds()

        await expect(auctionRaffleAsOwner.claimProceeds())
          .to.be.revertedWith('AuctionRaffle: proceeds have already been claimed')
      })
    })

    describe('when using discounts', function () {
      const discount = parseEther('0.05')

      describe('when biddersCount > (auctionWinnersCount + raffleWinnersCount)', function () {
        it('transfers correct amount', async function () {
          const auctionBidAmount = reservePrice.add(100)
          await bidAsWallet(wallets[10], auctionBidAmount)
          await bidDiscountAndSettleRaffle(10)

          const claimAmount = auctionBidAmount.add(reservePrice.sub(discount).mul(7))
          expect(await claimProceeds()).to.eq(claimAmount)
        })
      })

      describe('when biddersCount == (auctionWinnersCount + raffleWinnersCount)', function () {
        it('transfers correct amount', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2, raffleWinnersCount: 8 })))
          auctionRaffleAsOwner = auctionRaffle.connect(owner())

          const auctionBidAmount = reservePrice.add(100)
          await bidAsWallet(wallets[8], auctionBidAmount)
          await bidAsWallet(wallets[9], auctionBidAmount)
          await bidDiscountAndSettleRaffle(8)

          const claimAmount = auctionBidAmount.mul(2).add(reservePrice.sub(discount).mul(7))
          expect(await claimProceeds()).to.eq(claimAmount)
        })
      })

      describe('when raffleWinnersCount < biddersCount < (auctionWinnersCount + raffleWinnersCount)', function () {
        it('transfers correct amount', async function () {
          ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2, raffleWinnersCount: 8 })))
          auctionRaffleAsOwner = auctionRaffle.connect(owner())

          const auctionBidAmount = reservePrice.add(100)
          await bidAsWallet(wallets[8], auctionBidAmount)
          await bidDiscountAndSettleRaffle(8)

          const claimAmount = auctionBidAmount.add(reservePrice.sub(discount).mul(7))
          expect(await claimProceeds()).to.eq(claimAmount)
        })
      })

      describe('when biddersCount == raffleWinnersCount', function () {
        it('transfers correct amount', async function () {
          await bidDiscountAndSettleRaffle(8)

          const claimAmount = reservePrice.sub(discount).mul(7)
          expect(await claimProceeds()).to.eq(claimAmount)
        })
      })

      describe('when biddersCount < raffleWinnersCount', function () {
        it('transfers correct amount', async function () {
          await bidDiscountAndSettleRaffle(5)

          const claimAmount = reservePrice.sub(discount).mul(4)
          expect(await claimProceeds()).to.eq(claimAmount)
        })
      })
    })

    describe('when biddersCount > (auctionWinnersCount + raffleWinnersCount)', function () {
      it('transfers correct amount', async function () {
        const auctionBidAmount = reservePrice.add(100)
        await bidAsWallet(wallets[10], auctionBidAmount)
        await bidAndSettleRaffle(10)

        const claimAmount = auctionBidAmount.add(reservePrice.mul(7))
        expect(await claimProceeds()).to.eq(claimAmount)
      })
    })

    describe('when biddersCount == (auctionWinnersCount + raffleWinnersCount)', function () {
      it('transfers correct amount', async function () {
        ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2, raffleWinnersCount: 8 })))
        auctionRaffleAsOwner = auctionRaffle.connect(owner())

        const auctionBidAmount = reservePrice.add(100)
        await bidAsWallet(wallets[8], auctionBidAmount)
        await bidAsWallet(wallets[9], auctionBidAmount)
        await bidAndSettleRaffle(8)

        const claimAmount = auctionBidAmount.mul(2).add(reservePrice.mul(7))
        expect(await claimProceeds()).to.eq(claimAmount)
      })
    })

    describe('when raffleWinnersCount < biddersCount < (auctionWinnersCount + raffleWinnersCount)', function () {
      it('transfers correct amount', async function () {
        ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ auctionWinnersCount: 2, raffleWinnersCount: 8 })))
        auctionRaffleAsOwner = auctionRaffle.connect(owner())

        const auctionBidAmount = reservePrice.add(100)
        await bidAsWallet(wallets[8], auctionBidAmount)
        await bidAndSettleRaffle(8)

        const claimAmount = auctionBidAmount.add(reservePrice.mul(7))
        expect(await claimProceeds()).to.eq(claimAmount)
      })
    })

    describe('when biddersCount == raffleWinnersCount', function () {
      it('transfers correct amount', async function () {
        await bidAndSettleRaffle(8)

        const claimAmount = reservePrice.mul(7)
        expect(await claimProceeds()).to.eq(claimAmount)
      })
    })

    describe('when biddersCount < raffleWinnersCount', function () {
      it('transfers correct amount', async function () {
        await bidAndSettleRaffle(5)

        const claimAmount = reservePrice.mul(4)
        expect(await claimProceeds()).to.eq(claimAmount)
      })
    })

    describe('when biddersCount == 1', function () {
      it('does not transfer funds', async function () {
        await bidAndSettleRaffle(1)
        expect(await claimProceeds()).to.eq(0)
      })
    })

    describe('when biddersCount == 0', function () {
      it('does not transfer funds', async function () {
        await bidAndSettleRaffle(0)
        expect(await claimProceeds()).to.eq(0)
      })
    })

    // Returns amount transferred to owner by claimProceeds method
    async function claimProceeds(): Promise<BigNumber> {
      return calculateTransferredAmount(auctionRaffleAsOwner.claimProceeds)
    }
  })

  describe('withdrawUnclaimedFunds', function () {
    it('reverts if called not by owner', async function () {
      await expect(auctionRaffle.withdrawUnclaimedFunds())
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if claiming has not been closed yet', async function () {
      await bidAndSettleRaffle(2)

      await expect(auctionRaffleAsOwner.withdrawUnclaimedFunds())
        .to.be.revertedWith('AuctionRaffle: is in invalid state')
    })

    it('transfers unclaimed funds', async function () {
      await bidAndSettleRaffle(10)
      await auctionRaffleAsOwner.claimProceeds()

      await endClaiming(auctionRaffleAsOwner)

      const unclaimedFunds = reservePrice.mul(2)
      expect(await withdrawUnclaimedFunds()).to.be.equal(unclaimedFunds)
    })

    it('transfers remaining unclaimed funds', async function () {
      await bidAndSettleRaffle(10)
      await auctionRaffleAsOwner.claimProceeds()

      const goldenBid = await getBidByWinType(10, WinType.goldenTicket)
      await auctionRaffleAsOwner.claim(goldenBid.bidderID)

      await endClaiming(auctionRaffleAsOwner)

      expect(await withdrawUnclaimedFunds()).to.be.equal(reservePrice)
    })

    async function endClaiming(auctionRaffle: AuctionRaffleMock) {
      const endTime = await auctionRaffle.claimingEndTime()
      await network.provider.send('evm_setNextBlockTimestamp', [endTime.add(HOUR).toNumber()])
    }

    // Returns amount transferred to owner by withdrawUnclaimedFunds method
    async function withdrawUnclaimedFunds(): Promise<BigNumber> {
      return calculateTransferredAmount(auctionRaffleAsOwner.withdrawUnclaimedFunds)
    }
  })

  describe('rescueTokens', function () {
    let exampleToken: ExampleToken

    beforeEach(async function () {
      ({ exampleToken, auctionRaffle, provider } = await loadFixture(auctionRaffleFixtureWithToken))
      auctionRaffleAsOwner = auctionRaffle.connect(owner())
    })

    describe('when called not by owner', function () {
      it('reverts', async function () {
        await expect(auctionRaffle.rescueTokens(exampleToken.address))
          .to.be.revertedWith('Ownable: caller is not the owner')
      })
    })

    describe('when balance for given token equals zero', function () {
      it('reverts', async function () {
        await expect(auctionRaffleAsOwner.rescueTokens(exampleToken.address))
          .to.be.revertedWith('AuctionRaffle: no tokens for given address')
      })
    })

    it('transfers tokens', async function () {
      await exampleToken.transfer(auctionRaffle.address, 100)
      const balanceBeforeRescue = await exampleToken.balanceOf(owner().address)

      await auctionRaffleAsOwner.rescueTokens(exampleToken.address)
      expect(await exampleToken.balanceOf(owner().address)).to.be.equal(balanceBeforeRescue.add(100))
    })
  })

  describe('fallback', function () {
    describe('when transfers ether without calldata', function () {
      it('reverts', async function () {
        await expect(owner().sendTransaction({ to: auctionRaffle.address, value: parseEther('1') }))
          .to.be.revertedWith('AuctionRaffle: contract accepts ether transfers only by bid method')
      })
    })

    describe('when transfers ether with calldata', function () {
      it('reverts', async function () {
        const params = {
          to: auctionRaffle.address,
          value: parseEther('1'),
          data: '0x7D86687F980A56b832e9378952B738b614A99dc6',
        }
        await expect(owner().sendTransaction(params))
          .to.be.revertedWith('AuctionRaffle: contract accepts ether transfers only by bid method')
      })
    })
  })

  describe('claimFees', function () {
    describe('when called not by owner', function () {
      it('reverts', async function () {
        await expect(auctionRaffle.claimFees(10))
          .to.be.revertedWith('Ownable: caller is not the owner')
      })
    })

    describe('when raffle has not been settled yet', function () {
      it('reverts', async function () {
        await bid(2)
        await expect(auctionRaffleAsOwner.claimFees(2))
          .to.be.revertedWith('AuctionRaffle: is in invalid state')
      })
    })

    describe('when fees have already been claimed', function () {
      it('reverts', async function () {
        await bidAndSettleRaffle(10)
        await auctionRaffleAsOwner.claimFees(1)

        await expect(auctionRaffleAsOwner.claimFees(1))
          .to.be.revertedWith('AuctionRaffle: fees have already been claimed')
      })
    })

    describe('when there are no non-winning bids', function () {
      it('reverts', async function () {
        await bidAndSettleRaffle(6)

        await expect(auctionRaffleAsOwner.claimFees(6))
          .to.be.revertedWith('AuctionRaffle: there are no fees to claim')
      })
    })

    describe('when claiming using multiple transactions', function () {
      it('transfers correct amount', async function () {
        await bidAndSettleRaffle(15)
        const singleBidFee = calculateFee(reservePrice)

        let claimAmount = singleBidFee.mul(2)
        expect(await claimFees(2)).to.be.equal(claimAmount)

        claimAmount = singleBidFee.mul(4)
        expect(await claimFees(4)).to.be.equal(claimAmount)
      })
    })

    describe('when claiming using single transactions', function () {
      it('transfers correct amount', async function () {
        const additionalBidAmount = parseEther('0.1')
        for (let i = 0; i < 16; i++) {
          await bidAsWallet(wallets[i], reservePrice.add(additionalBidAmount.mul(i)))
        }
        await bidAndSettleRaffle(0)

        const bids = await getAllBidsByWinType(16, WinType.loss)
        let claimAmount = Zero
        bids.forEach((bid) => {
          claimAmount = claimAmount.add(calculateFee(bid.amount))
        })

        expect(await claimFees(bids.length)).to.be.equal(claimAmount)
      })
    })

    describe('when bid amount is not divisible by 100', function () {
      it('transfers correct amount with remainder', async function () {
        const bidAmount = reservePrice.add(21)
        await bid(8)
        await bidAsWallet(wallets[9], bidAmount)
        await bidAsWallet(wallets[10], reservePrice.mul(2))

        // Non-winning bidderID from random number: 9
        await bidAndSettleRaffle(0, BigNumber.from(2))

        expect(await claimFees(1)).to.be.equal(calculateFee(bidAmount))
      })
    })

    // Returns amount transferred to owner by claimFees method
    async function claimFees(bidsNumber: number): Promise<BigNumber> {
      return calculateTransferredAmount(() => auctionRaffleAsOwner.claimFees(bidsNumber))
    }

    function calculateFee(bidAmount: BigNumber): BigNumber {
      return bidAmount.sub(bidAmount.mul(98).div(100))
    }
  })

  describe('getState', function () {
    it('waiting for bidding', async function () {
      const currentTime = await getLatestBlockTimestamp(provider);
      ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ biddingStartTime: currentTime + MINUTE })))

      expect(await auctionRaffle.getState()).to.be.equal(State.awaitingBidding)
    })

    it('bidding open', async function () {
      const currentTime = await getLatestBlockTimestamp(provider);
      ({ auctionRaffle } = await loadFixture(configuredAuctionRaffleFixture({ biddingStartTime: currentTime - MINUTE })))

      expect(await auctionRaffle.getState()).to.be.equal(State.biddingOpen)
    })

    it('bidding closed', async function () {
      const endTime = await auctionRaffle.biddingEndTime()
      await network.provider.send('evm_setNextBlockTimestamp', [endTime.add(HOUR).toNumber()])
      await network.provider.send('evm_mine')

      expect(await auctionRaffle.getState()).to.be.equal(State.biddingClosed)
    })

    it('claiming closed', async function () {
      const endTime = await auctionRaffle.claimingEndTime()
      await network.provider.send('evm_setNextBlockTimestamp', [endTime.add(HOUR).toNumber()])
      await network.provider.send('evm_mine')

      expect(await auctionRaffle.getState()).to.be.equal(State.claimingClosed)
    })
  })

  describe('getBid', function () {
    it('reverts for unknown bidder address', async function () {
      await expect(auctionRaffle.getBid(randomAddress()))
        .to.be.revertedWith('AuctionRaffle: no bid by given address')
    })

    it('returns bid details', async function () {
      await bid(1)
      const { bidderID, amount, winType, claimed } = await auctionRaffle.getBid(wallets[0].address)
      expect(bidderID).to.eq(1)
      expect(amount).to.eq(reservePrice)
      expect(winType).to.eq(0)
      expect(claimed).to.be.false
    })
  })

  describe('getBidByID', function () {
    it('reverts for zero bidder ID', async function () {
      await expect(auctionRaffle.getBidByID(0))
        .to.be.revertedWith('AuctionRaffle: bidder with given ID does not exist')
    })

    it('reverts for invalid bidder ID', async function () {
      await bid(1)
      await expect(auctionRaffle.getBidByID(2))
        .to.be.revertedWith('AuctionRaffle: bidder with given ID does not exist')
    })

    it('returns bidder address', async function () {
      await bid(1)
      const { bidderID, amount, winType, claimed } = await auctionRaffle.getBidByID(1)
      expect(bidderID).to.eq(1)
      expect(amount).to.eq(reservePrice)
      expect(winType).to.eq(0)
      expect(claimed).to.be.false
    })
  })

  describe('getBidWithAddress', function () {
    it('reverts for zero bidder ID', async function () {
      await expect(auctionRaffle.getBidWithAddress(0))
        .to.be.revertedWith('AuctionRaffle: bidder with given ID does not exist')
    })

    it('reverts for invalid bidder ID', async function () {
      await bid(1)
      await expect(auctionRaffle.getBidWithAddress(2))
        .to.be.revertedWith('AuctionRaffle: bidder with given ID does not exist')
    })

    it('returns correct bid with bidder address', async function () {
      await bid(1)
      const bidWithAddress = await auctionRaffle.getBidWithAddress(1)
      validateBidsWithAddresses([bidWithAddress])
    })
  })

  describe('getBidsWithAddresses', function () {
    it('returns empty array when there are no bids', async function () {
      expect(await auctionRaffle.getBidsWithAddresses()).to.be.of.length(0)
    })

    it('returns bids with corresponding bidder addresses', async function () {
      await bid(3)
      const bids = await auctionRaffle.getBidsWithAddresses()
      expect(bids).to.be.of.length(3)
      validateBidsWithAddresses(bids)
    })
  })

  describe('getBidderAddress', function () {
    it('reverts for zero bidder ID', async function () {
      await expect(auctionRaffle.getBidderAddress(0))
        .to.be.revertedWith('AuctionRaffle: bidder with given ID does not exist')
    })

    it('reverts for invalid bidder ID', async function () {
      await bid(1)
      await expect(auctionRaffle.getBidderAddress(2))
        .to.be.revertedWith('AuctionRaffle: bidder with given ID does not exist')
    })

    it('returns bidder address', async function () {
      await bid(1)
      expect(await auctionRaffle.getBidderAddress(1)).to.eq(wallets[0].address)
    })
  })

  function owner() {
    return wallets[1]
  }

  function validateBidsWithAddresses(bids) {
    bids.forEach(({ bidder, bid: bid_ }, index) => {
      expect(bidder).to.eq(wallets[index].address)
      expect(bid_.bidderID).to.eq(index + 1)
      expect(bid_.amount).to.eq(reservePrice)
      expect(bid_.winType).to.eq(0)
      expect(bid_.claimed).to.be.false
    })
  }

  async function bidDiscountAndSettleRaffle(bidCount: number, randomNumber?: BigNumberish): Promise<ContractTransaction> {
    await bidsWithDiscount(bidCount, 10)
    await endBidding(auctionRaffleAsOwner)
    await settleAuction()

    const number = randomNumber || randomBigNumbers(1)[0]
    await setPrevRandao(number.toHexString());
    return auctionRaffleAsOwner.settleRaffle()
  }

  async function bidAndSettleRaffle(bidCount: number, randomNumber?: BigNumberish): Promise<ContractTransaction> {
    await bid(bidCount)
    await endBidding(auctionRaffleAsOwner)
    await settleAuction()

    const number = randomNumber || randomBigNumbers(1)[0]
    await setPrevRandao(number.toHexString());
    return auctionRaffleAsOwner.settleRaffle()
  }

  async function endBidding(auctionRaffle: AuctionRaffleMock) {
    const endTime = await auctionRaffle.biddingEndTime()
    await network.provider.send('evm_setNextBlockTimestamp', [endTime.add(HOUR).toNumber()])
    await network.provider.send('evm_mine')
  }

  async function settleAuction(): Promise<ContractTransaction> {
    return auctionRaffleAsOwner.settleAuction({ gasLimit: 4_000_000 })
  }

  async function bid(walletCount: number) {
    for (let i = 0; i < walletCount; i++) {
      await bidAsWallet(wallets[i], reservePrice)
    }
  }

  async function bidsWithDiscount(walletCount: number, discount: number) {
    for (let i = 0; i < walletCount; i++) {
      await bidWithDiscount(wallets[i], discount, reservePrice)
    }
  }

  async function bidWithDiscount(wallet: Wallet, discount: number, value: BigNumberish) {
    const proof = discountTree.getHexProof(hashDiscount(wallet.address, discount))
    await auctionRaffle.connect(wallet).bidWithDiscount(discount, proof, { value })
  }

  async function bidAsWallet(wallet: Wallet, value: BigNumberish) {
    await auctionRaffle.connect(wallet).bid({ value })
  }

  async function getBidByID(bidID: number): Promise<Bid> {
    const bidderAddress = await auctionRaffleAsOwner.getBidderAddress(bidID)
    return auctionRaffleAsOwner.getBid(bidderAddress)
  }

  async function getBidByWinType(bidCount: number, winType: WinType): Promise<Bid> {
    for (let i = 1; i <= bidCount; i++) {
      const bid = await getBidByID(i)
      if (bid.winType === winType) {
        return bid
      }
    }
  }

  async function getAllBidsByWinType(bidCount: number, winType: WinType): Promise<Bid[]> {
    const bids = []
    for (let i = 1; i <= bidCount; i++) {
      const bid = await getBidByID(i)
      if (bid.winType === winType) {
        bids.push(bid)
      }
    }
    return bids
  }

  async function calculateTransferredAmount(transaction: () => Promise<ContractTransaction>): Promise<BigNumber> {
    const balanceBeforeClaim = await owner().getBalance()
    const tx = await transaction()
    const txCost = await calculateTxCost(tx)
    const balanceAfterClaim = await owner().getBalance()
    return balanceAfterClaim.add(txCost).sub(balanceBeforeClaim)
  }

  async function calculateTxCost(tx: ContractTransaction): Promise<BigNumber> {
    const txReceipt = await tx.wait()
    return txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)
  }

  async function emitsEvents(tx: ContractTransaction, eventName: string, ...args: any[][]) {
    const txReceipt = await tx.wait()
    const filteredEvents = txReceipt.events.filter((event) => event.event === eventName)
    expect(filteredEvents.length).to.be.equal(args.length)

    filteredEvents.forEach((event, index) => {
      expect(event.event).to.be.equal(eventName)

      expect(event.args.length).to.be.equal(args[index].length)
      event.args.forEach((value, j) => {
        expect(value).to.be.equal(args[index][j])
      })
    })
  }
})
