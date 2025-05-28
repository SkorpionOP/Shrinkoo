const mongoose = require('mongoose');

const clickLogSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    trim: true,
    index: true // Add an index for faster lookups on shortId
  },
  ip: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  city: { // Added city as per your urlRoutes.js usage
    type: String,
    trim: true,
    default: 'Unknown'
  },
  device: {
    type: String,
    required: true,
    trim: true
  },
  browser: { // Added browser as per your urlRoutes.js usage
    type: String,
    trim: true,
    default: 'Unknown'
  },
  os: { // Added os as per your urlRoutes.js usage
    type: String,
    trim: true,
    default: 'Unknown'
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically set creation time
    required: true,
    index: true // Add an index for time-based queries
  },
}, {
  timestamps: false // You're managing timestamp manually, so set to false
});

const ClickLog = mongoose.models.ClickLog || mongoose.model('ClickLog', clickLogSchema);

module.exports = ClickLog;
