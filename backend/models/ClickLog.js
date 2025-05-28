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
    required: false, // <--- CHANGE THIS: IP might be 'Unknown' or not available
    trim: true,
    default: 'Unknown' // Add a default for safety
  },
  country: {
    type: String,
    required: false, // <--- CHANGE THIS: Country might be 'Unknown'
    trim: true,
    default: 'Unknown' // Add a default for safety
  },
  city: {
    type: String,
    trim: true,
    default: 'Unknown' // Already good, but ensures it's always set
  },
  device: {
    type: String,
    required: false, // <--- CHANGE THIS: Device might be 'Unknown' or 'Desktop'
    trim: true,
    default: 'Unknown' // Add a default for safety
  },
  browser: {
    type: String,
    required: false, // <--- CHANGE THIS: Browser might be 'Unknown'
    trim: true,
    default: 'Unknown' // Add a default for safety
  },
  os: {
    type: String,
    required: false, // <--- CHANGE THIS: OS might be 'Unknown'
    trim: true,
    default: 'Unknown' // Add a default for safety
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true, // This should always be present
    index: true // Add an index for time-based queries
  },
}, {
  timestamps: false // You're managing timestamp manually, so set to false
});

const ClickLog = mongoose.models.ClickLog || mongoose.model('ClickLog', clickLogSchema);

module.exports = ClickLog;
