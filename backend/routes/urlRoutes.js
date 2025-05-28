const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Url = require('../models/Url');
const ClickLog = require('../models/ClickLog');  // Import ClickLog model
const uaParser = require('ua-parser-js');
const geoip = require('geoip-lite');


// Redirect to original URL
router.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  const url = await Url.findOne({ shortId });

  if (!url) return res.status(404).send("Not found");

  url.clicks++;
  await url.save();

  // Log click
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip) || {};
  const ua = uaParser(req.headers['user-agent']);

  await ClickLog.create({
    shortId,
    ip,
    country: geo.country || 'Unknown',
    device: ua.device.type || 'Desktop',
    timestamp: new Date(),
  });

  res.redirect(url.originalUrl);
});

// POST /api/urls/shorten
router.post('/shorten', async (req, res) => {
  const { originalUrl, createdBy } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required' });
  }

  // Simple URL validation using a regular expression
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  if (!urlRegex.test(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  let shortId = nanoid(6); // Generate a short ID (e.g., "abc123")

  try {
    // Ensure the generated shortId is unique before saving
    let urlDoc = await Url.findOne({ shortId });
    while (urlDoc) {
      shortId = nanoid(6); // Regenerate shortId if it already exists
      urlDoc = await Url.findOne({ shortId });
    }

    // Create a new URL document and save it to the database
    const newUrl = new Url({ originalUrl, shortId, createdBy });
    await newUrl.save();

    // Return the shortened URL
    res.json({ shortUrl: `${req.protocol}://${req.get('host')}/api/urls/${shortId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
});

// GET /api/urls/analytics/:shortId (Get analytics for a shortened URL)
const GEO_SERVICES = {
  IPINFO: {
    endpoint: ip => `https://ipinfo.io/${ip}/json`,
    token: process.env.IPINFO_TOKEN,
    parser: data => ({
      country: data.country || 'Unknown',
      city: data.city || 'Unknown'
    })
  },
  IPAPI: {
    endpoint: ip => `http://ip-api.com/json/${ip}`,
    token: null,
    parser: data => ({
      country: data.country || 'Unknown',
      city: data.city || 'Unknown'
    })
  },
  GEOLITE: {
    endpoint: ip => `https://geolite.info/geoip/v2.1/city/${ip}`,
    token: process.env.MAXMIND_TOKEN,
    parser: data => ({
      country: data.country?.names?.en || 'Unknown',
      city: data.city?.names?.en || 'Unknown'
    })
  }
};

// Cache configuration
const ipCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Helper function to get geolocation
async function getGeoLocation(ip) {
  if (!ip || ip.match(/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1|127\.)/)) {
    return { country: 'Private Network', city: 'Local' };
  }

  // Check cache first
  const cacheKey = `geo-${ip}`;
  if (ipCache.has(cacheKey)) {
    return ipCache.get(cacheKey);
  }

  // Try services in order
  for (const [serviceName, service] of Object.entries(GEO_SERVICES)) {
    if (serviceName === 'GEOLITE' && !service.token) continue;

    try {
      const response = await axios.get(service.endpoint(ip), {
        params: service.token ? { token: service.token } : {},
        timeout: 2000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'URLShortener/1.0'
        }
      });

      const location = service.parser(response.data);
      ipCache.set(cacheKey, location);
      setTimeout(() => ipCache.delete(cacheKey), CACHE_TTL);
      return location;
    } catch (error) {
      console.warn(`[${serviceName}] Geolocation failed for ${ip}:`, error.message);
    }
  }

  return { country: 'Unknown', city: 'Unknown' };
}

// Redirect to original URL
router.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const url = await Url.findOne({ shortId });

    if (!url) return res.status(404).send("Not found");

    url.clicks++;
    await url.save();

    // Log click with improved IP handling
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0].trim();
    const ua = uaParser(req.headers['user-agent']);
    const geo = await getGeoLocation(ip);

    await ClickLog.create({
      shortId,
      ip,
      country: geo.country,
      city: geo.city,
      device: ua.device.type || 'Desktop',
      browser: ua.browser.name || 'Unknown',
      os: ua.os.name || 'Unknown',
      timestamp: new Date()
    });

    res.redirect(url.originalUrl);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send("Server error");
  }
});

// Analytics endpoint with improved error handling
router.get('/analytics/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const urlDoc = await Url.findOne({ shortId });
    
    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const clickLogs = await ClickLog.find({ shortId }).sort({ timestamp: -1 });
    
    res.json({
      originalUrl: urlDoc.originalUrl,
      shortId: urlDoc.shortId,
      clicks: urlDoc.clicks,
      createdAt: urlDoc.createdAt,
      logs: clickLogs.map(log => log.toObject()) // No need for real-time enrichment
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
});;


// Optional: Get all links for a user (by user ID)
router.get('/user/links/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const urls = await Url.find({ createdBy: uid });
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user links' });
  }
});

// In your backend routes (Express)
router.delete('/urls/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token and get userId (you should implement this function)
    let userId;
    try {
      userId = verifyTokenAndGetUserId(token);  // Custom function to verify JWT
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const url = await Url.findOne({ shortId });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (url.createdBy !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this URL' });
    }

    await Url.deleteOne({ shortId });
    await ClickLog.deleteMany({ shortId });

    res.status(200).json({ message: 'URL deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      error: 'Failed to delete URL',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


module.exports = router;
