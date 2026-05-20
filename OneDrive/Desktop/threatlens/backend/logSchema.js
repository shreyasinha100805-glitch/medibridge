const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  event_type: String,
  ip: String,
  user: String,
  location: String,
  severity: String,
  details: String,
  embedding: [Number]
});

module.exports = mongoose.model('Log', logSchema);