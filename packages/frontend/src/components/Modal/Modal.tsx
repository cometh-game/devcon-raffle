import * as Dialog from '@radix-ui/react-dialog'
import { ReactNode, useCallback } from 'react'
import { CloseButton } from 'src/components/Buttons/CloseButton'
import { hexOpacity, Colors } from 'src/styles/colors'
import styled from 'styled-components'

export interface ModalProps {
  isShown: boolean | undefined
  onRequestClose: () => void
  title?: string
  children: ReactNode
}

export const Modal = ({ isShown, onRequestClose, title, children }: ModalProps) => {
  const closeModal = useCallback(() => isShown && onRequestClose(), [isShown, onRequestClose])

  return (
    <Dialog.Root open={isShown} onOpenChange={closeModal}>
      <Dialog.Portal>
        <Overlay>
          <Content>
            <Header>
              <Title>{title}</Title>
              <CloseButton size={24} color={Colors.Black} onClick={closeModal} />
            </Header>
            {children}
          </Content>
        </Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const Overlay = styled(Dialog.Overlay)`
  background-color: ${hexOpacity(Colors.Blue, 0.8)};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  place-items: center;
  z-index: 100;
`

const Content = styled(Dialog.Content)`
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 24px;
  width: 408px;
  padding: 24px;
  background-color: ${Colors.White};
`

export const ContentRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  column-gap: 16px;
`
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  overflow: hidden;
`

const Title = styled(Dialog.Title)`
  font-family: 'Jetbrains Mono', 'Space Mono', 'Roboto Mono', monospace;
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
  color: ${Colors.Black};
`
