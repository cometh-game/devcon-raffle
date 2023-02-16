import { useEthers } from '@usedapp/core'
import { useCallback } from 'react'
import { CONFIG } from 'src/config/config'

export function useGetVoucher() {
  const { account } = useEthers()
  return useCallback(async () => fetchVoucherCode(), [account])
}

async function fetchVoucherCode(): Promise<{ voucherCode: string } | undefined> {
  const response = await fetch(CONFIG.backendUrl + '/voucher-codes', {
    method: 'GET',
    credentials: 'include',
  })
  if (response.status === 200) {
    const body = await response.json()
    if ('voucherCode' in body) {
      return body
    }
  }
}
