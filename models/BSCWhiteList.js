const mongoose = require('mongoose');
const { Schema } = mongoose;

const BSCWhiteListSchema = new Schema({
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

module.exports = mongoose.model('BSCWhiteList', BSCWhiteListSchema);
