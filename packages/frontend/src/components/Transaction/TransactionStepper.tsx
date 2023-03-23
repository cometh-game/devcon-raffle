import { useMemo } from 'react'
import { heading } from 'src/components/Auction/AuctionTransaction'
import { CrossIcon } from 'src/components/Icons'
import { Transactions } from 'src/components/Transaction/TransactionEnum'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

const header = {
  [Transactions.Place]: 'Bid',
  [Transactions.Bump]: 'Bid Bump',
  [Transactions.Withdraw]: 'Withdraw',
}

const description = {
  [Transactions.Place]: 'Initiate and confirm bid transaction in your wallet.',
  [Transactions.Bump]: 'Initiate and confirm bump transaction in your wallet.',
  [Transactions.Withdraw]: 'Initiate and confirm withdraw transaction in your wallet.',
}

const transactionSteps = (action: Transactions) => {
  return [
    {
      default: {
        name: `${heading[action]}`,
        description: `${description[action]}`,
      },
    },
    {
      default: {
        name: 'Finalized',
        description: 'The transaction has been confirmed on the blockchain.',
      },
      failed: {
        name: 'Failed',
        description: 'Transaction failed.',
      },
    },
  ]
}

type StepType = 'neutral' | 'success' | 'failure'

interface StepContent<StepName extends string> {
  name: StepName
  description: string
}

export interface Step<StepName extends string> {
  default: StepContent<StepName>
  failed?: StepContent<StepName>
}

export interface StepperProps<StepName extends string> {
  current: StepName
  action: Transactions
  isFailed: boolean
}

export const TransactionStepper = <StepName extends string>({ current, action, isFailed }: StepperProps<StepName>) => {
  const steps = transactionSteps(action)
  const currentStepIndex = useMemo(
    () => steps.findIndex((step) => [step.default.name, step.failed?.name].includes(current)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, steps.length]
  )
  return (
    <StepperContainer>
      <StepperHeader>Finalize {header[action]}</StepperHeader>
      <StepperList>
        {steps.map((item, index) => {
          const status = index === currentStepIndex ? 'current' : index < currentStepIndex ? 'completed' : 'next'
          const isLast = index === steps.length - 1
          const { step, type } = pickStepVersion(item, isLast, isFailed)
          return <StepperListItem key={index} step={step} status={status} type={isLast ? type : 'success'} />
        })}
      </StepperList>
    </StepperContainer>
  )
}

function pickStepVersion<Name extends string>(item: Step<Name>, isLast: boolean, IsFailed: boolean) {
  const [step, type]: [StepContent<Name>, StepType] =
    item.failed && IsFailed ? [item.failed, 'failure'] : [item.default, isLast ? 'success' : 'neutral']
  return { step, type }
}

type StepStatus = 'current' | 'completed' | 'next'

interface ListItemProps<T extends string> {
  step: StepContent<T>
  status: StepStatus
  type: StepType
}

const StepperListItem = <StepName extends string>({ step, status, type }: ListItemProps<StepName>) => (
  <StepperListItemContainer type={type} status={status}>
    <StepperBullet type={type} status={status}>
      {type === 'failure' && <CrossIcon size={15} color={Colors.BlueDark} />}
    </StepperBullet>
    <StepperItemName>{step.name}</StepperItemName>
    <StepperItemDescription current={status === 'current'}>{step.description}</StepperItemDescription>
  </StepperListItemContainer>
)

const StepperContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 313px;
  padding: 82px 20px 82px 0;
  background-color: ${Colors.BlueDark};

  @media only screen and (max-width: 900px) {
    width: 100%;
  }
`
const StepperHeader = styled.h3`
  margin: 0 0 24px 24px;
  color: ${Colors.White};
`

const StepperList = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0 0 0 -7px;
  padding: 0;

  @media only screen and (max-width: 900px) {
    margin-left: 16px;
  }
`

function getItemColor(props: DisplayTypeProps) {
  switch (props.status) {
    case 'current':
      switch (props.type) {
        case 'neutral':
          return Colors.GreenDark
        case 'success':
          return Colors.GreenDark
        case 'failure':
          return Colors.Red
      }
      break
    default:
      return Colors.GreenDark
  }
}

const StepperListItemContainer = styled.li<DisplayTypeProps>`
  display: grid;
  position: relative;
  grid-template-areas:
    'icon header'
    'icon description';
  grid-template-columns: 18px auto;
  grid-column-gap: 12px;
  grid-row-gap: 4px;
  margin-top: 36px;
  color: ${getItemColor};
  transition: all 0.25s ease;

  &:before {
    content: '';
    position: absolute;
    left: 9px;
    top: 17px;
    width: 2px;
    height: calc(100% + 19px);
    background-color: ${(props) => (props.status === 'current' ? Colors.White : Colors.GreenDark)};
    transform: translateX(-50%);
    pointer-events: none;
  }

  &:first-child {
    margin-top: 0px;
  }

  &:last-child {
    &:before {
      content: unset;
    }
  }
`
interface DisplayTypeProps {
  type: StepType
  status: StepStatus
}

const StepperBullet = styled.div<DisplayTypeProps>`
  grid-area: icon;
  display: flex;
  align-items: center;
  width: 17px;
  height: 17px;
  border: 2px solid currentColor;
  border-radius: 50%;
  background-color: ${({ type, status }) => {
    switch (status) {
      case 'current':
        switch (type) {
          case 'neutral':
            return Colors.BlueDark
          case 'failure':
            return Colors.Red
          case 'success':
            return Colors.GreenDark
        }
        break
      case 'completed':
        return Colors.GreenDark
    }
  }};

  color: ${({ type, status }) => {
    switch (status) {
      case 'current':
        switch (type) {
          case 'neutral':
            return Colors.GreenDark
          case 'failure':
            return Colors.Red
          case 'success':
            return Colors.GreenDark
        }
        break
      case 'completed':
        return Colors.GreenDark
      default:
        return Colors.White
    }
  }};
`

const StepperItemName = styled.span`
  grid-area: header;
  font-size: 16px;
  line-height: 1;
  font-weight: 600;
  color: inherit;
`

interface ItemDescriptionProps {
  current?: boolean
}

const StepperItemDescription = styled.span<ItemDescriptionProps>`
  grid-area: description;
  color: ${Colors.White};
  opacity: ${(props) => (props.current ? 1 : 0.7)};
  transition: all 0.25s ease;
`
