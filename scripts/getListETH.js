const { ethers, network } = require('hardhat');

const Web3 = require('web3');
const erc20Abi = require('../abi/ERC20.json');
const lpFarmAbi = require('../abi/LPFarm.json');
const mongoose = require('mongoose');
const ETHWhiteList = require('../models/ETHWhiteList');
const ETHMomaHolders = require('../models/ETHMomaHolders');
const ETHLpTransfer = require('../models/ETHLpTransfer');
const fs = require('fs');
require('dotenv').config();

const { ETH_MAINNET, MOMA_TOTAL_VALID } = require('./constant');

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

      for (let j = 0; j < lpFarmAddresses.length; j++) {
        let farm = new web3.eth.Contract(lpFarmAbi, lpFarmAddresses[j]);
        let userInfo = await farm.methods.userInfo(receiver).call();
        amountLPInFarm = amountLPInFarm + parseFloat(web3.utils.fromWei(userInfo.amount));
        amountMomaInFarm =
          amountMomaInFarm +
          parseFloat(web3.utils.fromWei(await farm.methods.pendingReward(receiver).call()));
      }

      let newRecord = new ETHWhiteList({
        address: receiver,
        momaBalance: momaBalance,
        lpBalance: lpBalance,
        amountLPInFarm: amountLPInFarm,
        amountMomaInFarm: amountMomaInFarm,
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

        for (let j = 0; j < lpFarmAddresses.length; j++) {
          let farm = new web3.eth.Contract(lpFarmAbi, lpFarmAddresses[j]);
          let userInfo = await farm.methods.userInfo(receiver).call();
          amountLPInFarm = amountLPInFarm + parseFloat(web3.utils.fromWei(userInfo.amount));
          amountMomaInFarm =
            amountMomaInFarm +
            parseFloat(web3.utils.fromWei(await farm.methods.pendingReward(receiver).call()));
        }

        let newRecord = new ETHWhiteList({
          address: receiver,
          momaBalance: 0,
          lpBalance: lpBalance,
          amountLPInFarm: amountLPInFarm,
          amountMomaInFarm: amountMomaInFarm,
        });

        await newRecord.save();
      }
    }

    // let data = await ETHWhiteList.find();
    // let result = [];

    // for (let i = 0; i < data.length; i++) {
    //   if (
    //     data[i].momaBalance +
    //       data[i].amountMomaInFarm +
    //       ETH_MAINNET.LP_MOMA_RATE * (data[i].lpBalance + data[i].amountLPInFarm) >=
    //     MOMA_TOTAL_VALID
    //   ) {
    //     result.push({
    //       address: data[i].address,
    //       momaAmount: data[i].momaBalance + data[i].amountMomaInFarm,
    //       lpAmount: data[i].lpBalance + data[i].amountLPInFarm,
    //     });
    //     if (result.length == 50) {
    //       break;
    //     }
    //   }
    // }
    // result = JSON.stringify(result);
    // fs.writeFileSync('./results/ETHWhiteList.json', result);

    console.log('DONE');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
