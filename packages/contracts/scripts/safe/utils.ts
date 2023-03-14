import { ethers, network } from 'hardhat'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import Safe from '@safe-global/safe-core-sdk'
import { SafeEthersSigner, SafeService } from '@safe-global/safe-ethers-adapters'
import { Signer } from 'ethers'

const safeAddress = process.env.SAFE_ADDRESS

async function getSafeSigner(): Promise<Signer> {
  const signers = await ethers.getSigners()
  const proposer = signers[0]
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: proposer,
  })
  const safe: Safe = await Safe.create({ ethAdapter: ethAdapter, safeAddress })
  const safeService = new SafeService(network.name === 'ethereum' ? 'https://safe-transaction-mainnet.safe.global' : 'https://safe-transaction-goerli.safe.global')
  return new SafeEthersSigner(safe, safeService, ethers.provider)
}

export { getSafeSigner }
