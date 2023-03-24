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
  discountsMerkleRoot: string,
}

export const config: DeploymentConfig = {
  initialOwner: '0x90110BF0B97457D4785D2CA7AEEbA5206169192d',
  biddingStartTime: 1679734800, // Sat Mar 25 2023 09:00:00 GMT+0000
  biddingEndTime: 1680278400, // Fri Mar 31 2023 16:00:00 GMT+0000
  claimingEndTime: 1680883200, // Fri Apr 07 2023 16:00:00 GMT+0000
  auctionWinnersCount: 20,
  raffleWinnersCount: 280,
  reservePrice: utils.parseEther('0.24'),
  minBidIncrement: utils.parseEther('0.01'),
  discountsMerkleRoot: '0xae6e667ff7978c769ef8010a8cf237b13330c9da748e574cd15759dadc1cf2b7',
}
