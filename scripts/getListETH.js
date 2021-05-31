const { network } = require('hardhat');

const Web3 = require('web3');
const erc20Abi = require('../abi/ERC20.json');
const lpFarmAbi = require('../abi/LPFarm.json');
const vestingAbi = require('../abi/Vesting.json');
const mongoose = require('mongoose');
const ETHWhiteList = require('../models/ETHWhiteList');
const ETHMomaHolders = require('../models/ETHMomaHolders');
const ETHLpTransfer = require('../models/ETHLpTransfer');
require('dotenv').config();

const { ETH_MAINNET } = require('./constant');

const addressZero = '0x0000000000000000000000000000000000000000';

mongoose.connect(
  process.env.MONGODB_URI,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  },
  (error) => {
    if (error) console.log(error);
  }
);

async function main() {
  if (network.name !== 'ethmainnet') {
    throw Error('Invalid network');
  }

  const web3 = new Web3(network.config.url);
  const lp = new web3.eth.Contract(erc20Abi, ETH_MAINNET.LP_ADDRESS);
  const lpFarmAddresses = ETH_MAINNET.LP_FARM_ADDRESSES.map((address) => address.toLowerCase());

  try {
    let momaHolders = await ETHMomaHolders.find({});

    let lpFarms = [];

    for (let j = 0; j < lpFarmAddresses.length; j++) {
      let farm = new web3.eth.Contract(lpFarmAbi, lpFarmAddresses[j]);
      let vestingAddress = await farm.methods.vesting().call();
      if (vestingAddress !== addressZero) {
        lpFarms.push({ farm: farm, vesting: new web3.eth.Contract(vestingAbi, vestingAddress) });
      } else {
        lpFarms.push({ farm: farm, vesting: null });
      }
    }

    for (let i = 0; i < momaHolders.length - 1; i++) {
      let holder = momaHolders[i];

      let receiver = holder['"HolderAddress"'].toLowerCase().replace('"', '');
      receiver = receiver.replace('"', '');
      let receiverCode = await web3.eth.getCode(receiver);

      if (receiverCode !== '0x' || receiver === addressZero) continue;

      let momaBalance = holder['"Balance"'].toLowerCase().replace('"', '');
      momaBalance = momaBalance.replace('"', '');

      momaBalance = parseFloat(momaBalance);

      let lpBalance = parseFloat(web3.utils.fromWei(await lp.methods.balanceOf(receiver).call()));
      let amountLPInFarm = 0;
      let amountMomaInFarm = 0;
      let amountMomaVesting = 0;

      for (let j = 0; j < lpFarmAddresses.length; j++) {
        let userInfo = await lpFarms[j].farm.methods.userInfo(receiver).call();
        amountLPInFarm = amountLPInFarm + parseFloat(web3.utils.fromWei(userInfo.amount));
        amountMomaInFarm =
          amountMomaInFarm +
          parseFloat(
            web3.utils.fromWei(await lpFarms[j].farm.methods.pendingReward(receiver).call())
          );
        if (lpFarms[j].vesting !== null) {
          amountMomaVesting =
            amountMomaVesting +
            parseFloat(
              web3.utils.fromWei(
                await lpFarms[j].vesting.methods.getVestingTotalClaimableAmount(receiver).call()
              )
            );
        }
      }

      let newRecord = new ETHWhiteList({
        address: receiver,
        momaBalance: momaBalance,
        lpBalance: lpBalance,
        amountLPInFarm: amountLPInFarm,
        amountMomaInFarm: amountMomaInFarm,
        amountMomaVesting: amountMomaVesting,
      });

      await newRecord.save();
    }

    let lpTransfer = await ETHLpTransfer.find({});

    for (let i = 0; i < lpTransfer.length - 1; i++) {
      let transfer = lpTransfer[i];
      let receiver = transfer['"To"'].toLowerCase().replace('"', '');
      receiver = receiver.replace('"', '');
      let receiverCode = await web3.eth.getCode(receiver);

      if (receiverCode !== '0x' || receiver === addressZero) continue;

      let receiverData = await ETHWhiteList.findOne({ address: receiver });
      if (!receiverData) {
        let lpBalance = parseFloat(web3.utils.fromWei(await lp.methods.balanceOf(receiver).call()));
        let amountLPInFarm = 0;
        let amountMomaInFarm = 0;
        let amountMomaVesting = 0;

        for (let j = 0; j < lpFarmAddresses.length; j++) {
          let userInfo = await lpFarms[j].farm.methods.userInfo(receiver).call();
          amountLPInFarm = amountLPInFarm + parseFloat(web3.utils.fromWei(userInfo.amount));
          amountMomaInFarm =
            amountMomaInFarm +
            parseFloat(web3.utils.fromWei(await farm[j].methods.pendingReward(receiver).call()));
          if (lpFarms[j].vesting !== null) {
            amountMomaVesting =
              amountMomaVesting +
              parseFloat(
                web3.utils.fromWei(
                  await lpFarms[j].vesting.methods.getVestingTotalClaimableAmount(receiver).call()
                )
              );
          }
        }

        let newRecord = new ETHWhiteList({
          address: receiver,
          momaBalance: 0,
          lpBalance: lpBalance,
          amountLPInFarm: amountLPInFarm,
          amountMomaInFarm: amountMomaInFarm,
          amountMomaVesting: amountMomaVesting,
        });

        await newRecord.save();
      }
    }

    console.log('DONE');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
