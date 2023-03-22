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
  initialOwner: process.env.SAFE_ADDRESS,
  biddingStartTime: 1679476500, // Wed Mar 22 2023 09:15:00 GMT+0000
  biddingEndTime: 1679500800, // Wed Mar 22 2023 16:00:00 GMT+0000
  claimingEndTime: 1679569200, // Thu Mar 23 2023 11:00:00 GMT+0000
  auctionWinnersCount: 4,
  raffleWinnersCount: 8,
  reservePrice: utils.parseEther('0.02'),
  minBidIncrement: utils.parseEther('0.002'),
  // TODO: check this for production!
  discountsMerkleRoot: '0x4181095aedb0c5a141c99453172ed6165111c24da8cdabfee1aecd04631c32cf',
}
