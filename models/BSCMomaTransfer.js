const mongoose = require('mongoose');
const { Schema } = mongoose;

const BSCMomaTransferScheme = new Schema(
  {
    '"Txhash"': {
      type: String,
    },
    '"Blockno"': {
      type: String,
    },
    '"UnixTimestamp"': {
      type: String,
    },
    '"DateTime"': {
      type: String,
    },
    '"From"': {
      type: String,
    },
    '"To"': {
      type: String,
    },
    '"Quantity"': {
      type: String,
    },
  },
  {
    collection: 'bscmomatransfer',
  }
);

module.exports = mongoose.model('BSCMomaTransfer', BSCMomaTransferScheme);
