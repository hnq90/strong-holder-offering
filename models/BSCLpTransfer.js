const mongoose = require('mongoose');
const { Schema } = mongoose;

const BSCLpTransferScheme = new Schema(
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
    collection: 'bsclptransfer',
  }
);

module.exports = mongoose.model('BSCLpTransfer', BSCLpTransferScheme);
