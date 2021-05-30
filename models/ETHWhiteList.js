const mongoose = require('mongoose');
const { Schema } = mongoose;

const ETHWhiteListSchema = new Schema({
  address: {
    type: String,
    unique: true,
  },
  momaBalance: {
    type: Number,
  },
  lpBalance: {
    type: Number,
  },
  amountLPInFarm: {
    type: Number,
  },
  amountMomaInFarm: {
    type: Number,
  },
});

module.exports = mongoose.model('ETHWhiteList', ETHWhiteListSchema);
