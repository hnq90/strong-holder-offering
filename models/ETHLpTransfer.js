const mongoose = require('mongoose');
const { Schema } = mongoose;

const ETHLpTransferScheme = new Schema(
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
    collection: 'ethlptransfer',
  }
);

module.exports = mongoose.model('ETHLpTransfer', ETHLpTransferScheme);
