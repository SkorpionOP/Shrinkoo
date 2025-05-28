const mongoose = require('mongoose');
const validator = require('validator'); // Don't forget to 'npm install validator' if you haven't

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    validate: {
      validator: (value) => validator.isURL(value, {
        protocols: ['http', 'https', 'ftp'], // Add common protocols
        require_protocol: true, // Ensure protocol is present
        require_host: true,
        require_valid_protocol: true
      }),
      message: 'Invalid URL format'
    },
    trim: true // Good practice to trim whitespace
  },
  shortId: {
    type: String,
    required: true,
    unique: true, // This automatically creates a unique index
    trim: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    required: false, // Set to true if login is mandatory for all links
    index: true, // Keep this index for user-specific queries
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // Auto-delete after 7 days (604800 seconds) - confirm if this is desired
  }
});

// Remove urlSchema.index({ shortId: 1 }); as unique: true already handles it.
// Keep the createdBy index as it's useful and not redundant.
// If you want to explicitly define the shortId index with specific options,
// you would remove `unique: true` from the field and do `urlSchema.index({ shortId: 1 }, { unique: true });`
// But generally, `unique: true` on the field is simpler for simple unique indexes.

// Optional: Add index for frequently queried fields (only for createdBy now)
urlSchema.index({ createdBy: 1 }); // Helps with user-specific queries

// Ensure Url model is only defined once (similar to ClickLog)
const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);

module.exports = Url;
