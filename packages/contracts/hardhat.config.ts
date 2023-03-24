import 'hardhat-deploy'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import './abi-exporter'
import 'tsconfig-paths/register'
import 'hardhat-gas-reporter'
import 'scripts/tasks/nodeTasks'
import 'scripts/tasks/auctionRaffle/ethereumTasks'
import 'scripts/tasks/auctionRaffle/hardhatTasks'
import 'scripts/tasks/auctionRaffle/rinkebyTasks'
import 'scripts/tasks/auctionRaffle/arbitrumTasks'

import mocharc from './.mocharc.json'
import compiler from './.compiler.json'

require('dotenv').config({ path: '../../.env' })

const zeroPrivateKey = '0x0000000000000000000000000000000000000000000000000000000000000000'

module.exports = {
  paths: {
    sources: './contracts',
    artifacts: './build',
    cache: './cache'
  },
  abiExporter: {
    path: './build',
    flat: true,
    spacing: 2
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      initialDate: '2022-01-01T00:00:00',
      allowUnlimitedContractSize: true,
      accounts: {
        count: 120
      },
    },
    goerli: {
      url: 'https://goerli.blockpi.network/v1/rpc/public',
      //url: 'https://rpc.ankr.com/eth_goerli',
      accounts: [process.env.DEPLOYER || zeroPrivateKey]
    },
    rinkeby: {
      url: 'https://rinkeby.arbitrum.io/rpc',
      accounts: [process.env.DEPLOYER || zeroPrivateKey]
    },
    mumbai: {
      url: 'https://rpc.ankr.com/polygon_mumbai',
      accounts: [process.env.DEPLOYER || zeroPrivateKey]
    },
    ethereum: {
      url: 'https://eth-mainnet.alchemyapi.io/v2/j_dccrP25UjZv5uYxh1mcjEl5o8nWZaf',
      accounts: [process.env.DEPLOYER || zeroPrivateKey]
    },
    arbitrum: {
      url: `https://arb1.arbitrum.io/rpc`,
      accounts: [process.env.DEPLOYER || zeroPrivateKey]
    }
  },
  typechain: {
    outDir: 'build/types',
    target: 'ethers-v5'
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    compilers: [compiler]
  },
  mocha: {
    ...mocharc,
    timeout: 400000
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  }
}
