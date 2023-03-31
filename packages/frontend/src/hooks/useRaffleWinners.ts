import { BigNumber } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { useDevconContract } from 'src/hooks/contract'
import { useCachedCall } from 'src/hooks/useCachedCall'

export function useRaffleWinners() {
  const { devcon, chainId } = useDevconContract()
  const { value, error } =
    useCachedCall(
      {
        contract: devcon,
        method: 'getRaffleWinners',
        args: [],
      },
      chainId
    ) ?? {}

  const raffleWinners = useMemo(() => value && (value[0] as BigNumber[]), [value])
  const raffleWinnersHacked = useMemo(() => raffleWinners && [...raffleWinners , BigNumber.from(10)], [raffleWinners])
  return { raffleWinners: raffleWinnersHacked, error }
}
