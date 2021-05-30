const { ethers, network } = require('hardhat');

const Web3 = require('web3');
const erc20Abi = require('../abi/ERC20.json');
const lpFarmAbi = require('../abi/LPFarm.json');
const momaFarmAbi = require('../abi/MomaFarm.json');
const mongoose = require('mongoose');
const BSCWhitelist = require('../models/BSCWhitelist');
const BscMomaTransfer = require('../models/BscMomaTransfer');
const BSCLpTransfer = require('../models/BSCLpTransfer');
const fs = require('fs');
require('dotenv').config();

const { BSC_MAINNET, MOMA_TOTAL_VALID } = require('./constant');

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
  if (network.name !== 'bscmainnet') {
    throw Error('Invalid network');
  }

  const web3 = new Web3(network.config.url);
  const moma = new web3.eth.Contract(erc20Abi, BSC_MAINNET.MOMA_ADDRESS);
  const lp = new web3.eth.Contract(erc20Abi, BSC_MAINNET.LP_ADDRESS);
  const lpFarmAddresses = BSC_MAINNET.LP_FARM_ADDRESSES.map((address) => address.toLowerCase());
  const momaFarmAddresses = BSC_MAINNET.MOMA_FARM_ADDRRESS.map((address) => address.toLowerCase());

  try {
    let momaTransfer = await BscMomaTransfer.find({});

    for (let i = 0; i < momaTransfer.length - 1; i++) {
      let transfer = momaTransfer[i];
      let receiver = transfer['"To"'].toLowerCase().replace('"', '');
      receiver = receiver.replace('"', '');
      let receiverCode = await web3.eth.getCode(receiver);

      if (receiverCode !== '0x' || receiver === addressZero) continue;

      let receiverData = await BSCWhitelist.findOne({ address: receiver });
      if (!receiverData) {
        let momaBalance = parseFloat(
          web3.utils.fromWei(await moma.methods.balanceOf(receiver).call())
        );
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

        for (let j = 0; j > momaFarmAddresses.length; j++) {
          let farm = new web3.eth.Contract(momaFarmAbi, momaFarmAddresses[j]);
          let userInfo = await farm.methods.userInfo(receiver).call();
          amountMomaInFarm = amountMomaInFarm + parseFloat(web3.utils.fromWei(userInfo.amount));
          amountMomaInFarm =
            amountMomaInFarm +
            parseFloat(web3.utils.fromWei(await farm.methods.pendingMoma(receiver).call()));
        }

        let newRecord = new BSCWhitelist({
          address: receiver,
          momaBalance: momaBalance,
          lpBalance: lpBalance,
          amountLPInFarm: amountLPInFarm,
          amountMomaInFarm: amountMomaInFarm,
        });

        await newRecord.save();
      }
    }

    let lpTransfer = await BSCLpTransfer.find({});

    for (let i = 0; i < lpTransfer.length - 1; i++) {
      let transfer = lpTransfer[i];
      let receiver = transfer['"To"'].toLowerCase().replace('"', '');
      receiver = receiver.replace('"', '');
      let receiverCode = await web3.eth.getCode(receiver);

      if (receiverCode !== '0x' || receiver === addressZero) continue;

      let receiverData = await BSCWhitelist.findOne({ address: receiver });
      if (!receiverData) {
        let lpBalance = parseFloat(web3.utils.fromWei(await lp.methods.balanceOf(receiver).call()));
        let amountLPInFarm = 0;

        for (let j = 0; j < lpFarmAddresses.length; j++) {
          let farm = new web3.eth.Contract(lpFarmAbi, lpFarmAddresses[j]);
          let userInfo = await farm.methods.userInfo(receiver).call();
          amountLPInFarm = amountLPInFarm + parseFloat(web3.utils.fromWei(userInfo.amount));
        }

        let newRecord = new BSCWhitelist({
          address: receiver,
          momaBalance: 0,
          lpBalance: lpBalance,
          amountLPInFarm: amountLPInFarm,
        });

        await newRecord.save();
      }
    }

    // let data = await BSCWhitelist.find();
    // let result = [];

    // for (let i = 0; i < data.length; i++) {
    //   if (
    //     data[i].momaBalance +
    //       data[i].amountMomaInFarm +
    //       BSC_MAINNET.LP_MOMA_RATE * (data[i].lpBalance + data[i].amountLPInFarm) >=
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
    // fs.writeFileSync('./results/BSCWhitelist.json', result);

    console.log('DONE');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
