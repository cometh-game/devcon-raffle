import { task, types } from 'hardhat/config'
import { connectToAuctionRaffle } from 'scripts/utils/auctionRaffle'
import { BigNumber, BigNumberish, constants, Contract, utils } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { randomBigNumbers } from 'scripts/utils/random'
import { generateRandomAccounts } from 'scripts/utils/generateRandomAccounts'
import { fundAccounts } from 'scripts/utils/fundAccounts'
import { bidAsSigner } from 'scripts/utils/bid'
import { minBidIncrement, reservePrice } from 'scripts/node/deploy'

const auctionRaffleAddress = '0x783D14DEC137B4b477CdD225c4033942DCC9f6c9'

task('bid', 'Places bid for given account with provided amount')
  .addParam('account', 'Hardhat account to use')
  .addParam('amount', 'The bid\'s amount in ETH', undefined, types.string)
  .setAction(async (
    { account, amount }: { account: string, amount: string },
    hre,
  ) => {
    const signer = await hre.ethers.getSigner(account)
    const auctionRaffle = await connectToAuctionRaffle(hre, auctionRaffleAddress)
    const auctionRaffleAsSigner = auctionRaffle.connect(signer)

    const ethAmount = parseEther(amount)
    await auctionRaffleAsSigner.bid({ value: ethAmount })
    logBid(account, ethAmount)
  })

task('bid-random', 'Bids X times using randomly generated accounts')
  .addParam('amount', 'Amount of bids', undefined, types.int, false)
  .addParam('account', 'Index of hardhat account to take funds from', 0, types.int)
  .setAction(async (
    { amount, account }: { amount: number, account: number },
    hre,
  ) => {
    const signers = await hre.ethers.getSigners()
    const auctionRaffle = await connectToAuctionRaffle(hre, auctionRaffleAddress)

    console.log('Generating accounts...')
    const randomAccounts = generateRandomAccounts(amount, hre.ethers.provider)

    console.log('Funding accounts...')
    await fundAccounts(signers[account], randomAccounts, reservePrice, minBidIncrement)

    console.log('Starting bidding...')
    for (let i = 0; i < randomAccounts.length; i++) {
      console.log(`Bidding with random account #${i + 1} out of ${randomAccounts.length}`)
      await bidAsSigner(auctionRaffle, randomAccounts[i], reservePrice.add(minBidIncrement.mul(i)))
    }
  })

task('settle-auction', 'Settles auction')
  .setAction(async (taskArgs, hre) => {
    const auctionRaffle = await auctionRaffleAsOwner(hre)

    await auctionRaffle.settleAuction({ gasLimit: 300_000 })
    console.log('Auction settled!')
  })

task('settle-raffle', 'Settles raffle')
  .setAction(async (taskArgs, hre) => {
    const auctionRaffle = await auctionRaffleAsOwner(hre)

    //const raffleWinnersCount = await auctionRaffle.raffleWinnersCount()
    //const randomNumbersCount = BigNumber.from(raffleWinnersCount).div(8).toNumber()

    await auctionRaffle.settleRaffle(/*randomBigNumbers(randomNumbersCount)*/)
    console.log('Raffle settled!')
  })

task('withdraw-unclaimed', 'Withdraw unclaimed funds')
  .setAction(async (taskArgs, hre) => {
    const auctionRaffle = await auctionRaffleAsOwner(hre)
    await auctionRaffle.withdrawUnclaimedFunds()
    console.log('Withdrew unclaimed funds!')
  })

function logBid(address: string, bidAmount: BigNumberish) {
  console.log(`Account ${address} bid ${formatEther(bidAmount)}`)
}

function formatEther(amount: BigNumberish): string {
  return `${utils.formatEther(amount).toString()}${constants.EtherSymbol}`
}

async function auctionRaffleAsOwner(hre: HardhatRuntimeEnvironment): Promise<Contract> {
  const owner = await getAuctionRaffleOwner(hre)
  const auctionRaffle = await connectToAuctionRaffle(hre, auctionRaffleAddress)
  return auctionRaffle.connect(owner)
}

async function getAuctionRaffleOwner(hre: HardhatRuntimeEnvironment): Promise<SignerWithAddress> {
  const signers = await hre.ethers.getSigners()
  return signers[0]
}
