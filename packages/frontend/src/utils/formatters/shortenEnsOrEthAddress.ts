import { shortenEthAddress } from 'src/utils/formatters'
export const shortenEnsOrEthAddress = (address: string) => {
  if (address.startsWith('0x')) {
    return shortenEthAddress(address)
  } else {
    return address.substring(0, 16)
  }
}
