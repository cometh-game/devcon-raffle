import { useEffect, useState } from 'react'
import { useVoucherRedeemDeadline } from 'src/hooks/useVoucherRedeemDeadline'
import { Colors } from 'src/styles/colors'
import { setIntervalImmediately } from 'src/utils'
import { formatTimeLeft } from 'src/utils/formatters'
import styled from 'styled-components'

export const ClaimTicketTimeLeft = () => {
  const redeemDeadline = useVoucherRedeemDeadline()
  const [timeLeft, setTimeLeft] = useState(formatTimeLeft(redeemDeadline))

  useEffect(() => {
    const interval = setIntervalImmediately(() => setTimeLeft(formatTimeLeft(redeemDeadline)), 1_000)
    return () => clearInterval(interval)
  }, [redeemDeadline])

  return (
    <TimeRow>
      <RemainingTime>{timeLeft}</RemainingTime>
      <span>left to claim your ticket</span>
    </TimeRow>
  )
}

const TimeRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex-wrap: wrap;
  column-gap: 16px;
  row-gap: 8px;
  line-height: 1;
  color: ${Colors.White};
`
const RemainingTime = styled.span`
  font-size: 24px;
  font-weight: 700;
  font-family: 'Jetbrains Mono', 'Space Mono', 'Roboto Mono', monospace;
`
