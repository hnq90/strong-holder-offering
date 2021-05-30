const mongoose = require('mongoose');
const { Schema } = mongoose;

const ETHMomaHoldersScheme = new Schema(
  {
    '"HolderAddress"': {
      type: String,
    },
    '"Balance"': {
      type: String,
    },
    '"PendingBalanceUpdate"': {
      type: String,
    },
  },
  {
    collection: 'ethmomaholders',
  }
);

module.exports = mongoose.model('ETHMomaTransfer', ETHMomaHoldersScheme);
