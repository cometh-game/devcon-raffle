import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId, useEthers } from '@usedapp/core'
import { useCallback } from 'react'
import { CONFIG } from 'src/config/config'
import { SupportedChainId } from 'src/constants/chainIDs'
import { useAddresses } from 'src/hooks'
import { useChainId } from 'src/hooks/chainId/useChainId'

export function useClaimVoucher() {
  const { account, library } = useEthers()
  const { devcon } = useAddresses('devcon')
  const chainId = useChainId()
  return useCallback(
    async (nonce: string) => {
      if (library && account) {
        const signature = await signClaimVoucher({ library: library as JsonRpcProvider, account, devcon, chainId, nonce })
        if (!signature) {
          return { error: 'Could not sign message.' }
        }
        return await fetchVoucherCode(account, nonce, signature)
      }
    },
    [library, account, devcon, chainId]
  )
}

interface SignClaimVoucherArgs {
  library: JsonRpcProvider
  account: string
  devcon: string
  chainId: SupportedChainId
  nonce: string
}

async function signClaimVoucher({
  library,
  account,
  devcon,
  chainId,
  nonce,
}: SignClaimVoucherArgs): Promise<string | undefined> {
  const domain = getDomain(chainId)
  const types = getTypes()
  const data = getMessage(account, nonce, devcon)
  try {
    return await library.getSigner()._signTypedData(domain, types, data)
  } catch (e) {
    console.error(e)
    return undefined
  }
}

async function fetchVoucherCode(userAddress: string, nonce: string, signature: string): Promise<VoucherCodeResponse> {
  const response = await fetch(CONFIG.backendUrl + '/voucher-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signature, nonce, userAddress }),
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

const getDomain = (chainId: ChainId) => ({
  name: 'Backend for AuctionRaffle contract',
  chainId,
})

const getTypes = () => ({
  Message: [
    { name: 'contents', type: 'string' },
    { name: 'contractAddress', type: 'string' },
    { name: 'signatureNonce', type: 'string' },
  ],
})

const getMessage = (signer: string, signatureNonce: string, contractAddress: string) => ({
  contents: `Claim voucher code for address ${signer}.`,
  contractAddress,
  signatureNonce,
})
