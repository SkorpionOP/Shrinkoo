const mongoose = require('mongoose');
const validator = require('validator'); // for URL validation

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    validate: {
      validator: (value) => validator.isURL(value),  // Validate that it's a valid URL
      message: 'Invalid URL format'  // Error message for invalid URL format
    }
  },
  shortId: {
    type: String,
    required: true,
    unique: true  // This automatically creates an index on the shortId
  },
  clicks: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String, // Firebase UID or email
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Remove the explicit index declaration for shortId
// urlSchema.index({ shortId: 1 });  // No longer needed

module.exports = mongoose.model('Url', urlSchema);

