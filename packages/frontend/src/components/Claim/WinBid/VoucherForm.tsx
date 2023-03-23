import { Button, CopyButton } from 'src/components/Buttons'
import { FormHeading } from 'src/components/Form/Form'
import { InputLabel } from 'src/components/Form/Input'
import { useVoucherRedeemDeadline } from 'src/hooks/useVoucherRedeemDeadline'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

import { ClaimTicketTimeLeft } from './ClaimTicketTimeLeft'
import { WinnerForm } from './WinBidForm'

interface Props {
  voucher: string
  withdrawnBid: boolean
}

export const VoucherForm = ({ voucher, withdrawnBid }: Props) => {
  const redeemTimestamp = useVoucherRedeemDeadline()
  const isVoucherExpired = !redeemTimestamp?.mul(1000).gt(Date.now())

  return (
    <WinnerForm>
      <VoucherFormHeading voucher={voucher} withdrawnBid={withdrawnBid}>
        Here is your voucher code
      </VoucherFormHeading>
      <VoucherIdWrapper>
        <VoucherIdBox>
          <VoucherIdText>{voucher}</VoucherIdText>
          <CopyButton value={voucher} side="top" text="Copy voucher code" />
        </VoucherIdBox>
        <VoucherIdLabel isVoucherExpired={isVoucherExpired}>
          {isVoucherExpired ? 'Voucher redeem period expired' : 'Enter this code in the sales system'}
        </VoucherIdLabel>
      </VoucherIdWrapper>

      <Button
        view="primary"
        onClick={() => window.open('https://tickets.devcon.org/', '_blank')}
        wide
        disabled={isVoucherExpired}
      >
        Go to sales system
      </Button>
      {!isVoucherExpired && <ClaimTicketTimeLeft />}
    </WinnerForm>
  )
}

const VoucherIdWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  row-gap: 8px;
`

interface LabelProps {
  isVoucherExpired: boolean
}

const VoucherIdLabel = styled(InputLabel)<LabelProps>`
  justify-content: center;
  line-height: 14px;
  margin-bottom: 8px;
  color: ${({ isVoucherExpired }) => (isVoucherExpired ? Colors.Red : Colors.White)};
`

const VoucherFormHeading = styled(FormHeading)<Props>`
  font-size: ${({ voucher, withdrawnBid }) => (voucher && !withdrawnBid ? '24px' : '40px')};
  line-height: ${({ voucher, withdrawnBid }) => (voucher && !withdrawnBid ? 1 : 1.2)};
  margin-bottom: 16px;
  text-align: center;
`

const VoucherIdBox = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background-color: ${Colors.White};
  padding: 8px 12px;
  height: 40px;
`

const VoucherIdText = styled.span`
  flex: 1;
  color: ${Colors.Grey};
`
