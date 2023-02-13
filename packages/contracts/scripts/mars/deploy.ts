import { contract, deploy } from 'ethereum-mars'
import { AuctionRaffle } from '../../build/artifacts'
import { config } from '../deploymentConfig'

deploy({ verify: true }, deployAuctionRaffle)

function deployAuctionRaffle() {
  contract(AuctionRaffle, [
    config.initialOwner,
    config.biddingStartTime,
    config.biddingEndTime,
    config.claimingEndTime,
    config.auctionWinnersCount,
    config.raffleWinnersCount,
    config.reservePrice,
    config.minBidIncrement,
  ], { gasLimit: 60_000_000 },
  )
}
