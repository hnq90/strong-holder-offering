const { ethers, network } = require('hardhat');

const mongoose = require('mongoose');
const ETHWhiteList = require('../models/ETHWhiteList');
const BSCWhiteList = require('../models/BSCWhiteList');

const fs = require('fs');
require('dotenv').config();

const { ETH_MAINNET, BSC_MAINNET, MOMA_TOTAL_VALID } = require('./constant');

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
  try {
    let data = await ETHWhiteList.find();
    let result = [];

    for (let i = 0; i < data.length; i++) {
      let ethTotalMoma =
        data[i].momaBalance +
        data[i].amountMomaInFarm +
        data[i].amountMomaVesting +
        ETH_MAINNET.LP_MOMA_RATE * (data[i].lpBalance + data[i].amountLPInFarm);

      if (ethTotalMoma >= MOMA_TOTAL_VALID) {
        result.push(data[i].address);
        continue;
      }

      let bscData = await BSCWhiteList.findOne({ address: data[i].address });
      if (bscData) {
        let bscTotalMoma =
          bscData.momaBalance +
          bscData.amountMomaInFarm +
          bscData.amountMomaVesting +
          BSC_MAINNET.LP_MOMA_RATE * (bscData.lpBalance + bscData.amountLPInFarm);
        if (bscTotalMoma + ethTotalMoma >= MOMA_TOTAL_VALID) {
          result.push(data[i].address);
        }
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
        continue;
      }

      let ethData = await ETHWhiteList.findOne({ address: data[i].address });
      if (ethData) {
        let ethTotalMoma =
          ethData.momaBalance +
          ethData.amountMomaInFarm +
          ethData.amountMomaVesting +
          ETH_MAINNET.LP_MOMA_RATE * (ethData.lpBalance + ethData.amountLPInFarm);
        if (ethTotalMoma + bscTotalMoma >= MOMA_TOTAL_VALID) {
          result.push(data[i].address);
        }
      }
    }

    result = getRandom(result, 50);

    let resultByTokenId = {};

    for (let i = 0; i <= 4; i++) {
      resultByTokenId[i.toString()] = [];
      for (let j = 0; j <= 9; j++) {
        resultByTokenId[i.toString()].push(result[10 * i + j]);
      }
    }

    resultByTokenId = JSON.stringify(resultByTokenId);
    fs.writeFileSync('./results/List.json', resultByTokenId);

    console.log('DONE');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len) throw new RangeError('GetRandom: more elements taken than available');
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

main();
