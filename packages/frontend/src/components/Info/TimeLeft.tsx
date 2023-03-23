import { useEffect, useState } from 'react'
import { useAuctionState, useAuctionTime } from 'src/hooks'
import { setIntervalImmediately } from 'src/utils'
import { formatEndDate, formatTimeLeft } from 'src/utils/formatters'
import styled from 'styled-components'

export const TimeLeft = () => {
  const timestamp = useAuctionTime()
  const state = useAuctionState()

  const [timeLeft, setTimeLeft] = useState(formatTimeLeft(timestamp))

  useEffect(() => {
    const interval = setIntervalImmediately(() => setTimeLeft(formatTimeLeft(timestamp)), 1_000)
    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <TimeBox>
      <TimeRow>
        <span>{state === 'AwaitingBidding' ? 'Till start' : ' Time left'}</span>
        <RemainingTime>{timeLeft}</RemainingTime>
      </TimeRow>
      <TimeRow>
        {state === 'AwaitingBidding' ? 'Starts on' : ' Ends on'}{' '}
        <RemainingTime>{formatEndDate(timestamp)}</RemainingTime>
      </TimeRow>
    </TimeBox>
  )
}

const TimeBox = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 4px;
  font-family: 'Jetbrains Mono', 'Space Mono', 'Roboto Mono', monospace;

  @media screen and (min-width: 1800px) {
    flex-direction: row;
    align-items: center;
    column-gap: 40px;
  }
`
const TimeRow = styled.div`
  display: flex;
  align-items: center;
  column-gap: 8px;
`

export const RemainingTime = styled.span`
  font-weight: 700;
`
