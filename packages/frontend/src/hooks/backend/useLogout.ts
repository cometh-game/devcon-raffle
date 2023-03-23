import { useCallback } from 'react'
import { CONFIG } from 'src/config/config'

export function useLogout(setError?: (e: string) => void) {
  const logout = useCallback(async () => {
    try {
      await fetch(CONFIG.backendUrl + '/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    } catch {
      setError?.('Could not logout.')
    }
  }, [setError])
  return { logout }
}
