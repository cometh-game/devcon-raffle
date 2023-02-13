import { AddressLike, NumberLike } from 'ethereum-mars'
import { utils } from 'ethers'

interface DeploymentConfig {
  initialOwner: AddressLike,
  biddingStartTime: NumberLike,
  biddingEndTime: NumberLike,
  claimingEndTime: NumberLike,
  auctionWinnersCount: NumberLike,
  raffleWinnersCount: NumberLike,
  reservePrice: NumberLike,
  minBidIncrement: NumberLike,
}

export const config: DeploymentConfig = {
  initialOwner: '0x472Afd5a5303ac2799475687e943bbA72846BD6b',
  biddingStartTime: 1676300400, // Mon Feb 13 2023 15:00:00 GMT+0000
  biddingEndTime: 1676473200, // Wed Feb 15 2023 15:00:00 GMT+0000
  claimingEndTime: 1676646000, // Fri Feb 17 2023 15:00:00 GMT+0000
  auctionWinnersCount: 20,
  raffleWinnersCount: 80,
  reservePrice: utils.parseEther('0.01'),
  minBidIncrement: utils.parseEther('0.001'),
}
