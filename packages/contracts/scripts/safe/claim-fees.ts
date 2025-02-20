import { AuctionRaffle, AuctionRaffle__factory } from '@devcon-raffle/contracts'
import { deployments } from 'hardhat'
import { getSafeSigner } from './utils'

async function main() {
  const safeSigner = await getSafeSigner()
  const deployment = await deployments.get('AuctionRaffle')
  const auctionRaffle: AuctionRaffle = AuctionRaffle__factory.connect(deployment.address, safeSigner)

  const bidsCount = await auctionRaffle.getBiddersCount()
  await auctionRaffle.claimFees(bidsCount, { gasLimit: 300_000 })

  console.log('Claim fees: waiting for other safe owners to confirm!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
