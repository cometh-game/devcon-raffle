import { Colors, hexOpacity } from './colors'

export const web3Modal = `
 #WEB3_CONNECT_MODAL_ID {
    .web3modal-modal-hitbox {
      background-color: ${hexOpacity(Colors.Blue, 0.8)};
    }

    .web3modal-modal-card{
      border-radius: unset;
    }

    .web3modal-provider-container{
      font-family: 'Roboto', Helvetica, Arial, sans-serif;
      border-radius: unset;
    }

    .web3modal-provider-name{
      font-family: 'Jetbrains Mono', 'Space Mono', 'Roboto Mono', monospace;
      padding-bottom: 10px;
    }
  }
`

export const web3ModalInstallMetaMaskFlexOrder = `
  #WEB3_CONNECT_MODAL_ID {
   .web3modal-modal-card :nth-child(1) { order: 2}
   .web3modal-modal-card :nth-child(2) { order: 3}
   .web3modal-modal-card :nth-child(3) { order: 4}
   .web3modal-modal-card :nth-child(4) { order: 1}
 }
`
