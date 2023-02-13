import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
	const {
		deployments: { deploy },
	} = hre
	const [deployer] = await hre.ethers.getSigners()

	await deploy("Multicall2", {
		from: deployer.address,
		args: [],
		log: true,
	})
}

export default func
func.tags = ["Multicall2"]
