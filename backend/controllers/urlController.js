// controllers/urlController.js
const Url = require('../models/Url');
const { nanoid } = require('nanoid');

// Shorten URL method
exports.shortenUrl = async (req, res) => {
  const { originalUrl, userId } = req.body;
  const shortId = nanoid(8); // Create a random shortId with nanoid

  try {
    // Check if the URL already exists for the user (optional)
    const existingUrl = await Url.findOne({ originalUrl, userId });
    if (existingUrl) {
      return res.status(400).json({ message: 'This URL has already been shortened' });
    }

    // Save the new shortened URL to the database
    const newUrl = await Url.create({ originalUrl, shortId, userId });
    res.status(201).json({ shortUrl: `${process.env.BASE_URL}/${shortId}` });
  } catch (err) {
    console.error('Error shortening URL:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Redirect to original URL method
exports.redirectUrl = async (req, res) => {
  const { shortId } = req.params;

  try {
    // Find the URL by shortId and increment the click count
    const url = await Url.findOneAndUpdate(
      { shortId },
      { $inc: { clicks: 1 } }, // Increment click count by 1
      { new: true } // Return the updated URL document
    );

    if (url) {
      return res.redirect(url.originalUrl); // Redirect to the original URL
    }

    // If the URL is not found, return a 404 error
    res.status(404).json({ error: 'URL not found' });
  } catch (err) {
    console.error('Error redirecting URL:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};
