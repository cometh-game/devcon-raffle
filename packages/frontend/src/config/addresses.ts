import { ChainId } from '@usedapp/core'

import { SupportedChainId } from '../constants/chainIDs'

import { getStringEnv } from './getEnv'

export const ADDRESSES: Record<string, Record<SupportedChainId, string>> = {
  multicall: {
    [ChainId.Mainnet]: '0xE3a1C68E8270c36071729e0ad6DDDA25859FE7bb',
    [ChainId.Goerli]: '0xE3a1C68E8270c36071729e0ad6DDDA25859FE7bb',
    [ChainId.Hardhat]: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  devcon: {
    [ChainId.Mainnet]: '0x7ed22eCC9744bB15F6B3C2938f56cD06630AF645',
    [ChainId.Goerli]: '0x57f7c052aF9AA9B03452C19A41EBB2A885C0732D',
    [ChainId.Hardhat]: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
}

export function getAddresses() {
  const addresses = ADDRESSES
  const devcon = getStringEnv('VITE_TESTNET_DEVCON')
  if (devcon) {
    addresses['devcon'][ChainId.Mainnet] = devcon
  }
  return addresses
}
