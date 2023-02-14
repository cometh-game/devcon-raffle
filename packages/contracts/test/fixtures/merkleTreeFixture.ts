import { Wallet, utils } from 'ethers'
import { MerkleTree } from 'merkletreejs'

export function hashDiscount(address: string, discount: number) {
  return Buffer.from(
    utils.keccak256(
      utils.defaultAbiCoder.encode(
        ['address', 'uint256'],
        [address, discount]
      )
    ).slice(2),
    'hex'
  )
}

export function merkleTreeFixture(wallets: Wallet[], discountsPerWallet?: number[]): MerkleTree {
  const leaves = wallets.flatMap(function (wallet) {
    const address = wallet.address
    return (discountsPerWallet || [10, 20]).map(function(discount) {
      return hashDiscount(address, discount)
    })
  })

  const tree = new MerkleTree(leaves, utils.keccak256, { sort: true })
  return tree
}
