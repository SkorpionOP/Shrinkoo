const mongoose = require('mongoose');

const clickLogSchema = new mongoose.Schema({
  shortId: String,
  ip: String,
  country: String,
  device: String,
  timestamp: Date,
});

// Ensure ClickLog model is only defined once
const ClickLog = mongoose.models.ClickLog || mongoose.model('ClickLog', clickLogSchema);

module.exports = ClickLog;
