import { JsonRpcProvider } from '@ethersproject/providers'
import { useEthers } from '@usedapp/core'
import { useCallback } from 'react'
import { SiweMessage } from 'siwe'
import { CONFIG } from 'src/config/config'
import { useAddresses } from 'src/hooks'
import { useChainId } from 'src/hooks/chainId/useChainId'

export function useClaimVoucher() {
  const { account, library } = useEthers()
  const { devcon } = useAddresses('devcon')
  const chainId = useChainId()
  return useCallback(
    async (nonce: string) => {
      if (library && account) {
        // prepare login request to sign
        const domain = window.location.host
        const origin = window.location.origin
        const message = new SiweMessage({
          domain,
          address: account,
          statement: 'Sign in with Web3 wallet to the dApp',
          uri: origin,
          version: '1',
          chainId,
          nonce,
        })
        const signature = await (library as JsonRpcProvider).getSigner().signMessage(message.prepareMessage())

        // verify login request
        const response = await fetch(CONFIG.backendUrl + '/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, signature }),
          credentials: 'include'
        })
        if (response.status === 200) {
          return { error: 'Could not verify address.' }
        }

        return await fetchVoucherCode()
      }
    },
    [library, account, devcon, chainId]
  )
}

async function fetchVoucherCode(): Promise<VoucherCodeResponse> {
  const response = await fetch(CONFIG.backendUrl + '/voucher-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  if ([200, 403].includes(response.status)) {
    return await response.json()
  }
  return {
    error: `Server returned a ${response.status} code.`,
  }
}

type VoucherCodeResponse = { voucherCode: string } | { error: string }
