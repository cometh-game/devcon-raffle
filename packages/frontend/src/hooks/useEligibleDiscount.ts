import { useEthers } from '@usedapp/core'
import proofs from 'src/assets/merkle-tree.json'

/**
 * @returns the percentage of discount the active user is eligible to
 */
export const useEligibleDiscount = () => {
  const { account } = useEthers()

  const userDiscount = proofs.find((p) => p.address === account?.toLowerCase())
  return userDiscount?.discountPercentage ?? 0
}
