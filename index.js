const Web3 = require('web3');
const momaAbi = require('./abi/Moma.json');
const mongoose = require('mongoose');
const Holders = require('./models/Holders');
const fs = require('fs');
require('dotenv').config();

const web3 = new Web3(process.env.RPC);
const moma = new web3.eth.Contract(momaAbi, process.env.MOMA_ADDRESS);
const addressZero = '0x0000000000000000000000000000000000000000';
const blockStart = 12281716;

mongoose.connect(
  process.env.MONGODB_URI,
  { useUnifiedTopology: true, useNewUrlParser: true },
  (error) => {
    if (error) console.log(error);
  }
);

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

async function main() {
  try {
    let events = await moma.getPastEvents('Transfer', {
      filter: {},
      fromBlock: blockStart,
    });

    for (let i = 0; i < events.length; i++) {
      let event = events[i];
      if (event.event === 'Transfer') {
        let sender = event.returnValues.from;
        let receiver = event.returnValues.to;

        let senderCode = await web3.eth.getCode(sender);
        let receiverCode = await web3.eth.getCode(receiver);

        if (senderCode === '0x' && sender !== addressZero) {
          let senderData = await Holders.findOne({ address: sender });

          if (!senderData) {
            let balanceSender = await moma.methods.balanceOf(sender).call();
            balanceSender = web3.utils.fromWei(balanceSender, 'ether');
            if (balanceSender > 0) {
              let newHolders = new Holders({
                address: sender,
                balance: balanceSender,
              });

              await newHolders.save();
            }
          }
        }

        if (receiverCode === '0x' && receiver !== addressZero) {
          let receiverData = await Holders.findOne({ address: receiver });

          if (!receiverData) {
            let balanceReceiver = await moma.methods.balanceOf(receiver).call();
            balanceReceiver = web3.utils.fromWei(balanceReceiver, 'ether');
            if (balanceReceiver > 0) {
              let newHolders = new Holders({
                address: receiver,
                balance: balanceReceiver,
              });

              await newHolders.save();
            }
          }
        }
      }
    }

    let data = await Holders.find({}, { _id: 0, __v: 0 }).sort({ balance: 'desc' });
    data = JSON.stringify(data);
    fs.writeFileSync('holders.json', data);

    console.log('DONE');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
