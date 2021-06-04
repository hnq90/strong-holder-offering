const { ethers, network } = require('hardhat');

const mongoose = require('mongoose');
const ETHWhiteList = require('../models/ETHWhiteList');
const BSCWhiteList = require('../models/BSCWhiteList');

const fs = require('fs');
require('dotenv').config();

const { ETH_MAINNET, BSC_MAINNET, MOMA_TOTAL_VALID } = require('./constant');

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
  try {
    let data = await ETHWhiteList.find();
    let result = [];
    let accMoma = [];

    for (let i = 0; i < data.length; i++) {
      let ethTotalMoma =
        data[i].momaBalance +
        data[i].amountMomaInFarm +
        data[i].amountMomaVesting +
        ETH_MAINNET.LP_MOMA_RATE * (data[i].lpBalance + data[i].amountLPInFarm);

      let bscTotalMoma = 0;
      let bscData = await BSCWhiteList.findOne({ address: data[i].address });
      if (bscData) {
        bscTotalMoma =
          bscData.momaBalance +
          bscData.amountMomaInFarm +
          bscData.amountMomaVesting +
          BSC_MAINNET.LP_MOMA_RATE * (bscData.lpBalance + bscData.amountLPInFarm);
      }

      if (bscTotalMoma + ethTotalMoma >= MOMA_TOTAL_VALID) {
        result.push(data[i].address);
        accMoma.push({ address: data[i].address, accMoma: bscTotalMoma + ethTotalMoma });
      }
    }

    data = await BSCWhiteList.find();

    for (let i = 0; i < data.length; i++) {
      if (result.includes(data[i].address)) continue;

      let bscTotalMoma =
        data[i].momaBalance +
        data[i].amountMomaInFarm +
        data[i].amountMomaVesting +
        BSC_MAINNET.LP_MOMA_RATE * (data[i].lpBalance + data[i].amountLPInFarm);

      if (bscTotalMoma >= MOMA_TOTAL_VALID) {
        result.push(data[i].address);
        accMoma.push({ address: data[i].address, accMoma: bscTotalMoma });
      }
    }

    console.log(accMoma.length + ' addresses valid');
    accMoma = JSON.stringify(accMoma);
    fs.writeFileSync('./results/List.json', accMoma);

    console.log('DONE');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
