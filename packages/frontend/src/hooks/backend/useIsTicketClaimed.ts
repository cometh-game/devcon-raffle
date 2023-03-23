import { useEthers } from '@usedapp/core'
import { useCallback, useState } from 'react'
import { CONFIG } from 'src/config/config'

export function useIsTicketClaimed() {
  const { library } = useEthers()
  const [isClaimed, setIsClaimed] = useState(false)
  const [isFetched, setIsFetched] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const claimed = useCallback(
    async (account: string | undefined) => {
      if (library && account) {
        setIsFetching(true)
        setIsFetched(false)
        const response = await fetch(CONFIG.backendUrl + `/tickets?address=${account}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
        const data: any = await response.json()
        setIsFetching(false)
        setIsFetched(true)
        setIsClaimed(data.claimed)
      }
    },
    [library]
  )

  return {
    claimed,
    isClaimed,
    isFetching,
    isFetched,
  }
}
