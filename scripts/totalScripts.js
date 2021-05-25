const Web3 = require('web3');
const erc20Abi = require('../abi/ERC20.json');
const lpFarmAbi = require('../abi/LPFarm.json');
const momaFarmAbi = require('../abi/MomaFarm.json');
const mongoose = require('mongoose');
const WhiteList = require('../models/WhiteList');
const fs = require('fs');
require('dotenv').config();

const {
  MOMA_ADDRESS,
  MOMA_DEPLOY_BLOCK,
  LP_FARM_ADDRESS,
  MOMA_FARM_ADDRRESS,
  LP_ADDRESS,
  VAULT_ADDRESSES,
  MOMA_TOTAL_VALID,
  LP_MOMA_RATE
} = require('./constant');

const web3 = new Web3(process.env.RPC);
const addressZero = '0x0000000000000000000000000000000000000000';
const moma = new web3.eth.Contract(erc20Abi, MOMA_ADDRESS);
const lp = new web3.eth.Contract(erc20Abi, LP_ADDRESS);
const lpFarmAddresses = LP_FARM_ADDRESS.map(address => address.toLowerCase());
const momaFarmAddresses = MOMA_FARM_ADDRRESS.map(address => address.toLowerCase());
const vaultAddresses = VAULT_ADDRESSES.map(address => address.toLowerCase());

mongoose.connect(
  process.env.MONGODB_URI,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
  },
  error => {
    if (error) console.log(error);
  }
);

async function main() {
  try {
    let momaEvents = await moma.getPastEvents('Transfer', {
      filter: {},
      fromBlock: MOMA_DEPLOY_BLOCK
    });

    for (let i = 0; i < momaEvents.length; i++) {
      let event = momaEvents[i];
      let receiver = event.returnValues.to.toLowerCase();

      if (
        receiver === addressZero ||
        lpFarmAddresses.includes(receiver) ||
        momaFarmAddresses.includes(receiver) ||
        vaultAddresses.includes(receiver) ||
<<<<<<< b60ea28ee7157acc77174eacff1cc21e7825960a
        receiver === LP_ADDRESS.toLowerCase()
=======
        receiver == LP_ADDRESS.toLowerCase()
>>>>>>> Get LP Holder and Farmer
      )
        continue;

      let receiverData = await WhiteList.findOne({ address: receiver });

      if (!receiverData) {
        let momaBalance = web3.utils.fromWei(
          await moma.methods.balanceOf(receiver).call(),
          'ether'
        );
        let lpBalance = web3.utils.fromWei(await lp.methods.balanceOf(receiver).call(), 'ether');
        let amountLPInFarm = 0;
        let amountMomaInFarm = 0;

        for (let j = 0; j < lpFarmAddresses.length; j++) {
          let farm = new web3.eth.Contract(lpFarmAbi, lpFarmAddresses[j]);
          let userInfo = await farm.methods.userInfo(receiver).call();
          amountLPInFarm = amountLPInFarm + web3.utils.fromWei(userInfo.amount);
          amountMomaInFarm =
            amountMomaInFarm +
            web3.utils.fromWei(await farm.methods.pendingReward(receiver).call());
        }

        for (let j = 0; j < momaFarmAddresses.length; j++) {
          let farm = new web3.eth.Contract(momaFarmAbi, momaFarmAddresses[j]);
          let userInfo = await farm.methods.userInfo(receiver).call();
          amountMomaInFarm = amountMomaInFarm + web3.utils.fromWei(userInfo.amount);
          amountMomaInFarm =
            amountMomaInFarm + web3.utils.fromWei(await farm.methods.pendingMoma(receiver).call());
        }

        let newHolders = new WhiteList({
          address: receiver,
          momaBalance: momaBalance,
          lpBalance: lpBalance,
          amountLPInFarm: amountLPInFarm,
          amountMomaInFarm: amountMomaInFarm
        });

        await newHolders.save();
      }
    }

    let lpEvents = await lp.getPastEvents('Transfer', {
      filter: {},
      fromBlock: MOMA_DEPLOY_BLOCK
    });

    for (let i = 0; i < lpEvents.length; i++) {
      let event = momaEvents[i];
      let receiver = event.returnValues.to.toLowerCase();

      if (receiver === addressZero || lpFarmAddresses.includes(receiver)) continue;

      let receiverData = await WhiteList.findOne({ address: receiver });
      if (!receiverData) {
        let lpBalance = web3.utils.fromWei(await lp.methods.balanceOf(receiver).call(), 'ether');
        let amountLPInFarm = 0;
        let amountMomaInFarm = 0;

        for (let j = 0; j < lpFarmAddresses.length; j++) {
          let farm = new web3.eth.Contract(lpFarmAbi, lpFarmAddresses[j]);
          let userInfo = await farm.methods.userInfo(receiver).call();
          amountLPInFarm = amountLPInFarm + web3.utils.fromWei(userInfo.amount);
          amountMomaInFarm =
            amountMomaInFarm +
            web3.utils.fromWei(await farm.methods.pendingReward(receiver).call());
        }

        let newHolders = new WhiteList({
          address: receiver,
          momaBalance: 0,
          lpBalance: lpBalance,
          amountLPInFarm: amountLPInFarm,
          amountMomaInFarm: amountMomaInFarm
        });

        await newHolders.save();
      }
    }

    let data = await WhiteList.find().sort({ address: 'desc' });
    let results = [];

    for (let i = 0; i < data.length; i++) {
      if (
        data[i].momaBalance +
          data[i].amountMomaInFarm +
          LP_MOMA_RATE * (data[i].lpBalance + data[i].amountLPInFarm) >=
        MOMA_TOTAL_VALID
      )
        results.push({
          address: data[i].address,
          momaAmount: data[i].momaBalance + data[i].amountMomaInFarm,
          lpAmount: data[i].lpBalance + data[i].amountLPInFarm
        });
    }

    results = JSON.stringify(results);
    fs.writeFileSync('./results/WhiteList.json', results);

    console.log('DONE');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
