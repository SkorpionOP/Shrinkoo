const mongoose = require('mongoose');
const validator = require('validator');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    validate: {
      validator: (value) => validator.isURL(value),
      message: 'Invalid URL format'
    }
  },
  shortId: {
    type: String,
    required: true,
    unique: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // Auto-delete after 7 days (604800 seconds)
  }
});

// Optional: Add index for frequently queried fields
urlSchema.index({ shortId: 1 }); // Helps with short URL lookups
urlSchema.index({ createdBy: 1 }); // Helps with user-specific queries

module.exports = mongoose.model('Url', urlSchema);
