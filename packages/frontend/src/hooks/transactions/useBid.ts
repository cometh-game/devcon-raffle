import { BigNumber } from '@ethersproject/bignumber'
import { useEthers, useSendTransaction } from '@usedapp/core'
import proofs from 'src/assets/merkle-tree.json'
import { useDevconContract } from 'src/hooks/contract'

export function useBid() {
  const { devcon } = useDevconContract()
  const { account, chainId } = useEthers()
  const { sendTransaction, state, resetState } = useSendTransaction({ transactionName: 'Bid' })

  async function placeBid(bidAmount: BigNumber) {
    if (!account || !chainId) {
      return
    }

    // check if user is eligible for a discount
    const userDiscount = proofs.find((p) => p.address === account.toLowerCase())
    const discountPercentage = userDiscount?.discountPercentage ?? 0
    const proof = userDiscount?.proof ?? []

    console.log('User', account)
    console.log('Discount percentage', discountPercentage)
    console.log('Proof', proof)

    const tx =
      discountPercentage === undefined || discountPercentage === 0
        ? await devcon.populateTransaction.bid({ value: bidAmount })
        : await devcon.populateTransaction.bidWithDiscount(discountPercentage, proof, { value: bidAmount })

    await sendTransaction(tx)
  }

  return { placeBid, state, resetState }
}
