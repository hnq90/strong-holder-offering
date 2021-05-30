require('dotenv').config();
require('@nomiclabs/hardhat-waffle');

task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: {
    version: '0.8.3',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: 'localhost',
  networks: {
    bscmainnet: {
      url: `https://bsc-dataseed.binance.org/`,
      accounts: [process.env.BSC_MAINNET_PRIVATE_KEY],
      gasLimit: 30000000,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.RINKEBY_PRIVATE_KEY],
      gasLimit: '6721975',
    },
    ethmainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.ETH_MAINNET_PRIVATE_KEY],
      gasLimit: '6721975',
    },
  },

  gas: 40000000,
  gasPrice: 10000000000,
  mocha: {
    timeout: 100000,
  },
};
