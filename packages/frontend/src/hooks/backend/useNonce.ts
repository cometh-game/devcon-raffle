import { useCallback } from 'react'
import { CONFIG } from 'src/config/config'

type NonceResponse = { nonce: string }

export function useNonce(setError?: (e: string) => void) {
  const getNonce = useCallback(async () => {
    try {
      const rawResponse = await fetch(CONFIG.backendUrl + '/nonce', {
        credentials: 'include',
      })
      const response: NonceResponse = await rawResponse.json()
      return response.nonce
    } catch {
      setError?.('Could not retrieve message nonce.')
    }
  }, [setError])
  return { getNonce }
}
