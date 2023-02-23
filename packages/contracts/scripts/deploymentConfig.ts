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
  biddingStartTime: 1676984400, // Tue Feb 21 2023 13:00:00 GMT+0000
  biddingEndTime: 1676989800, // Tue Feb 21 2023 14:30:00 GMT+0000
  claimingEndTime: 1676997000, // Tue Feb 21 2023 16:30:00 GMT+0000
  auctionWinnersCount: 10,
  raffleWinnersCount: 80,
  reservePrice: utils.parseEther('0.01'),
  minBidIncrement: utils.parseEther('0.001'),
}
