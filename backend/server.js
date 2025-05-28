const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const urlRoutes = require('./routes/urlRoutes'); // ✅ Only declared once
const Url = require('./models/Url'); // Import the Url model

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow only specific frontend origin (replace with your frontend URL)
const allowedOrigins = [
  'https://link-shrinker-frontend.vercel.app',
  'http://localhost:3000',// Replace with your actual frontend URL
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

// Middleware
app.use(cors(corsOptions));  // Use specific CORS configuration
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/urls', urlRoutes); // Add "/api/urls" to the base of the URL to avoid clashes

// Route for redirecting shortened URLs
app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;

  try {
    const urlDoc = await Url.findOne({ shortId });

    if (!urlDoc) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Increase the click count
    urlDoc.clicks++;
    await urlDoc.save();

    // Redirect to the original URL
    return res.redirect(urlDoc.originalUrl);
  } catch (err) {
    res.status(500).json({ error: 'Failed to redirect' });
  }
});

// Catch all route handler for non-existent routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MongoDB URI is not defined in .env');
    process.exit(1); // Exit if the DB URI is not set
  }
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
