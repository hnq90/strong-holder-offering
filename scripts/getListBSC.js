const { network } = require('hardhat');

const Web3 = require('web3');
const erc20Abi = require('../abi/ERC20.json');
const lpFarmAbi = require('../abi/LPFarm.json');
const vestingAbi = require('../abi/Vesting.json');
const momaFarmAbi = require('../abi/MomaFarm.json');
const mongoose = require('mongoose');
const BSCWhiteList = require('../models/BSCWhiteList');
const BSCMomaTransfer = require('../models/BSCMomaTransfer');
const BSCLpTransfer = require('../models/BSCLpTransfer');
require('dotenv').config();

const { BSC_MAINNET } = require('./constant');

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
    let momaTransfer = await BSCMomaTransfer.find({});

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

    let momaFarms = [];
    for (let j = 0; j < momaFarmAddresses.length; j++) {
      let farm = new web3.eth.Contract(momaFarmAbi, momaFarmAddresses[j]);
      momaFarms.push(farm);
    }

    for (let i = 0; i < momaTransfer.length - 1; i++) {
      let transfer = momaTransfer[i];
      let receiver = transfer['"To"'].toLowerCase().replace('"', '');
      receiver = receiver.replace('"', '');
      let receiverCode = await web3.eth.getCode(receiver);

      if (receiverCode !== '0x' || receiver === addressZero) continue;

      let receiverData = await BSCWhiteList.findOne({ address: receiver });
      if (!receiverData) {
        let momaBalance = parseFloat(
          web3.utils.fromWei(await moma.methods.balanceOf(receiver).call())
        );
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
                  await lpFarms[j].vesting.methods.getTotalAmountLockedByUser(receiver).call()
                )
              );
          }
        }

        for (let j = 0; j < momaFarmAddresses.length; j++) {
          let userInfo = await momaFarms[j].methods.userInfo(receiver).call();
          amountMomaInFarm = amountMomaInFarm + parseFloat(web3.utils.fromWei(userInfo.amount));
          amountMomaInFarm =
            amountMomaInFarm +
            parseFloat(web3.utils.fromWei(await momaFarms[j].methods.pendingMoma(receiver).call()));
        }

        let newRecord = new BSCWhiteList({
          address: receiver,
          momaBalance: momaBalance,
          lpBalance: lpBalance,
          amountLPInFarm: amountLPInFarm,
          amountMomaInFarm: amountMomaInFarm,
          amountMomaVesting: amountMomaVesting,
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

      let receiverData = await BSCWhiteList.findOne({ address: receiver });
      if (!receiverData) {
        let lpBalance = parseFloat(web3.utils.fromWei(await lp.methods.balanceOf(receiver).call()));
        let amountLPInFarm = 0;
        let amountMomaVesting = 0;

        for (let j = 0; j < lpFarmAddresses.length; j++) {
          let userInfo = await lpFarms[j].farm.methods.userInfo(receiver).call();
          amountLPInFarm = amountLPInFarm + parseFloat(web3.utils.fromWei(userInfo.amount));

          if (lpFarms[j].vesting !== null) {
            amountMomaVesting =
              amountMomaVesting +
              parseFloat(
                web3.utils.fromWei(
                  await lpFarms[j].vesting.methods.getTotalAmountLockedByUser(receiver).call()
                )
              );
          }
        }

        let newRecord = new BSCWhiteList({
          address: receiver,
          momaBalance: 0,
          lpBalance: lpBalance,
          amountLPInFarm: amountLPInFarm,
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
