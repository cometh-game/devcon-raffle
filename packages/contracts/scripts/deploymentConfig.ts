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
  biddingStartTime: 1677230220, // Fri Feb 24 2023 09:17:00 GMT+0000
  biddingEndTime: 1677230820, // Fri Feb 24 2023 09:27:00 GMT+0000
  claimingEndTime: 1677234420, // Fri Feb 24 2023 10:27:00 GMT+0000
  auctionWinnersCount: 10,
  raffleWinnersCount: 80,
  reservePrice: utils.parseEther('0.01'),
  minBidIncrement: utils.parseEther('0.001'),
}
