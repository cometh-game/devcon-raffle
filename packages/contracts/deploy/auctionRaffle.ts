import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { config } from '../scripts/deploymentConfig'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
	const {
		deployments: { deploy },
	} = hre
	const [deployer] = await hre.ethers.getSigners()

	let factory = await deploy("AuctionRaffle", {
		from: deployer.address,
		args: [
      config.initialOwner,
      config.biddingStartTime,
      config.biddingEndTime,
      config.claimingEndTime,
      config.auctionWinnersCount,
      config.raffleWinnersCount,
      config.reservePrice,
      config.minBidIncrement,
    ],
		log: true,
	})
}

export default func
func.tags = ["AuctionRaffle"]
