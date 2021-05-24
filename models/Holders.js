const mongoose = require('mongoose');
const { Schema } = mongoose;

const HoldersSchema = new Schema({
  address: {
    type: String,
    unique: true,
  },
  balance: {
    type: Number,
  },
});

module.exports = mongoose.model('Holders', HoldersSchema);
