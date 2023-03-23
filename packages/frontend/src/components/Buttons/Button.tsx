import { ReactNode } from 'react'
import { LoadingIcon } from 'src/components/Icons'
import { Colors } from 'src/styles/colors'
import styled, { css } from 'styled-components'

export interface ButtonProps {
  children: ReactNode
  className?: string
  view?: 'primary' | 'secondary'
  wide?: boolean
  disabled?: boolean
  isLoading?: boolean
  onClick?: () => void
}

export const Button = ({ children, className, view = 'primary', wide, disabled, isLoading, onClick }: ButtonProps) => {
  return (
    <ButtonContainer
      className={className}
      view={view}
      wide={wide}
      disabled={disabled || isLoading}
      isLoading={isLoading}
      onClick={onClick}
    >
      {isLoading ? <LoadingIcon /> : children}
    </ButtonContainer>
  )
}

const commonButtonStyles = css<ButtonProps>`
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  width: ${({ wide }) => (wide ? '100%' : '289px')};
  height: 40px;
  margin: 0;
  padding: 8px;
  border: none;
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  outline: none;
  overflow: hidden;
  transition: all 0.25s ease;

  &:disabled {
    opacity: 0.5;
  }
`

const PrimaryButtonStyles = css<ButtonProps>`
  ${commonButtonStyles}

  background-color: ${Colors.GreenLight};
  color: ${Colors.Blue};
  font-weight: 500;

  &:hover,
  &:focus-visible {
    background-color: ${Colors.Green};
  }

  &:active {
    background-color: ${Colors.GreenDark};
  }
`

const SecondaryButtonStyles = css<ButtonProps>`
  ${commonButtonStyles}

  background-color: ${Colors.White};
  color: ${Colors.Blue};
  border: 1px solid ${Colors.Blue};

  &:hover,
  &:focus-visible {
    background-color: ${Colors.BlueLight};
  }

  &:active {
    background-color: ${Colors.BlueLight};
  }
`

export const ButtonContainer = styled.button<ButtonProps>`
  ${({ view }) => {
    switch (view) {
      case 'primary':
      default:
        return PrimaryButtonStyles
      case 'secondary':
        return SecondaryButtonStyles
    }
  }};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`
