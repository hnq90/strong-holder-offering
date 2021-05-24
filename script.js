const Web3 = require('web3');
const momaAbi = require('./abi/Moma.json');
const fs = require('fs');
require('dotenv').config();

const web3 = new Web3(process.env.RPC);
const moma = new web3.eth.Contract(momaAbi, process.env.MOMA_ADDRESS);
const addressZero = '0x0000000000000000000000000000000000000000';
const blockStart = process.env.BLOCK_START;

let holders = [];

async function main() {
  try {
    console.time('timer');
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
          let senderData = holders.find((holder) => holder.address === sender);

          if (!senderData) {
            let balanceSender = await moma.methods.balanceOf(sender).call();
            balanceSender = web3.utils.fromWei(balanceSender, 'ether');
            if (balanceSender > 0) {
              holders.push({ address: sender, balance: balanceSender });
            }
          }
        }

        if (receiverCode === '0x' && receiver !== addressZero) {
          let receiverData = holders.find((holder) => holder.address === receiver);

          if (!receiverData) {
            let balanceReceiver = await moma.methods.balanceOf(receiver).call();
            balanceReceiver = web3.utils.fromWei(balanceReceiver, 'ether');
            if (balanceReceiver > 0) {
              holders.push({ address: sender, balance: balanceReceiver });
            }
          }
        }
      }
    }

    holders = holders.filter((holder) => holder.address !== addressZero);
    holders = holders.sort((a, b) => (a.balance < b.balance ? 1 : a.balance > b.balance ? -1 : 0));
    holders = JSON.stringify(holders);
    fs.writeFileSync('holders.json', holders);
    console.log('DONE');
    console.timeEnd('timer');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
