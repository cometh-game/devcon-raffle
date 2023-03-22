import { useCallback, useState } from 'react'
import { Button } from 'src/components/Buttons'
import { WinOption } from 'src/components/Claim/WinBid/WinBidForm'
import { FormRow } from 'src/components/Form'
import { ErrorNotifications } from 'src/components/Notifications/ErrorNotifications'
import { useAuctionState } from 'src/hooks'
import { useClaimTicket } from 'src/hooks/backend/useClaimTicket'
import { useNonce } from 'src/hooks/backend/useNonce'
import styled from 'styled-components'

import { ClaimTicketTimeLeft } from './ClaimTicketTimeLeft'

export interface IClaimeVoucherSectionProps {
  setDisplayClaimTicketForm: (v: boolean) => void
  displayClaimTicketForm: boolean
}
export const ClaimTicketSection = ({
  setDisplayClaimTicketForm,
  displayClaimTicketForm,
}: IClaimeVoucherSectionProps) => {
  const state = useAuctionState()
  const [error, setError] = useState<string | undefined>()
  const [message, setMessage] = useState<string | undefined>()
  const { getNonce } = useNonce(setError)
  const { claimTicket, firstName, setFirstName, lastName, setLastName, email, setEmail, claimTicketStatus } =
    useClaimTicket()
  const shouldHideActions = claimTicketStatus === 'success'

  const handleClaimTicket = useCallback(async () => {
    if (firstName === '') {
      setError('Missing first name')
      return
    }
    if (lastName === '') {
      setError('Missing last name')
      return
    }
    if (email === '') {
      setError('Missing email')
      return
    }

    const nonce = await getNonce()
    if (!nonce) {
      return
    }

    const claimTicketResponse = await claimTicket(nonce)
    if (!claimTicketResponse) {
      return
    }

    if ('error' in claimTicketResponse) {
      setError(claimTicketResponse.error)
    } else {
      setError(undefined)
      setMessage(claimTicketResponse?.message)
      setDisplayClaimTicketForm(false)
    }
  }, [getNonce, claimTicket, setDisplayClaimTicketForm, firstName, lastName, email])

  return (
    <VoucherOption>
      {error && <ErrorNotifications error={error} setError={setError} onClick={handleClaimTicket} />}
      {message && <Message>{message}</Message>}
      {!displayClaimTicketForm && !shouldHideActions && (
        <Button view="primary" onClick={() => setDisplayClaimTicketForm(true)} wide>
          Claim Ticket
        </Button>
      )}
      {displayClaimTicketForm && !shouldHideActions && (
        <>
          <h2>Claim Ticket</h2>
          <div>
            Please fill in this form with your correct information for your ticket! You will receive it through mail
            soon!
          </div>
          <ClaimTicketForm>
            <FormField>
              <FormLabel htmlFor="firstName">First Name:</FormLabel>
              <FormInput id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </FormField>
            <FormField>
              <FormLabel htmlFor="lastName">Last Name:</FormLabel>
              <FormInput id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </FormField>
            <FormField>
              <FormLabel htmlFor="email">Email:</FormLabel>
              <FormInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
          </ClaimTicketForm>
          <Button view="primary" onClick={handleClaimTicket} wide>
            Claim Ticket
          </Button>
        </>
      )}
      {state !== 'ClaimingClosed' && <ClaimTicketTimeLeft />}
    </VoucherOption>
  )
}

const VoucherOption = styled(WinOption)`
  row-gap: 20px;
`

const ClaimTicketForm = styled.div``

const FormField = styled(FormRow)``

const FormLabel = styled.label`
  width: 70%;
  text-align: right;
  padding-right: 10px;
`

const FormInput = styled.input`
  min-width: 250px;
`

const Message = styled.h2`
  font-size: 30px;
`
