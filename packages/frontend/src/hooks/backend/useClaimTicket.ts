import { JsonRpcProvider } from '@ethersproject/providers'
import { useEthers } from '@usedapp/core'
import { useCallback, useState } from 'react'
import { SiweMessage } from 'siwe'
import { CONFIG } from 'src/config/config'
import { useChainId } from 'src/hooks/chainId/useChainId'

export type ClaimTicketStatus = 'idle' | 'fetching' | 'success' | 'error'

export function useClaimTicket() {
  const { account, library } = useEthers()
  const chainId = useChainId()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [claimTicketStatus, setClaimTicketStatus] = useState<ClaimTicketStatus>('idle')

  async function claimTicketResponse(firstName: string, lastName: string, email: string): Promise<ClaimTicketResponse> {
    const response = await fetch(CONFIG.backendUrl + '/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
      }),
      credentials: 'include',
    })
    if ([200, 201, 403].includes(response.status)) {
      switch (response?.status) {
        case 201:
          setClaimTicketStatus('success')
          return { message: 'Ticket claimed succesfully!' }
        case 200:
          setClaimTicketStatus('error')
          return { error: 'Ticket already claimed.' }
        default:
          setClaimTicketStatus('error')
          return { error: 'Could not verify address.' }
      }
    }
    return {
      error: `Server returned a ${response.status} code.`,
    }
  }

  const claimTicket = useCallback(
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
          credentials: 'include',
        })

        if (response.status !== 200) {
          return { error: 'Could not verify address.' }
        }

        return await claimTicketResponse(firstName, lastName, email)
      }
    },
    [library, account, chainId, firstName, lastName, email]
  )

  return {
    claimTicket,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    claimTicketStatus,
  }
}

type ClaimTicketResponse = { message: string } | { error: string }
