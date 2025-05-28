const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const axios = require('axios'); // Added missing import
const Url = require('../models/Url');
const ClickLog = require('../models/ClickLog');
const uaParser = require('ua-parser-js');
const geoip = require('geoip-lite');

// GEO SERVICES CONFIGURATION
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
    token: null, // ip-api.com generally does not require a token for basic usage
    parser: data => ({
      country: data.country || 'Unknown', // `country` field from ip-api
      city: data.city || 'Unknown'       // `city` field from ip-api
    })
  },
  GEOLITE: {
    endpoint: ip => `https://geolite.info/geoip/v2.1/city/${ip}`,
    token: process.env.MAXMIND_TOKEN, // MaxMind GeoLite requires a license key/token
    parser: data => ({
      country: data.country?.names?.en || 'Unknown', // nested country name for GeoLite
      city: data.city?.names?.en || 'Unknown'       // nested city name for GeoLite
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

  const cacheKey = `geo-${ip}`;
  // Retrieve from cache. Ensure cached object is valid and not undefined/null.
  const cachedLocation = ipCache.get(cacheKey);
  if (cachedLocation && cachedLocation.country && cachedLocation.city) {
    return cachedLocation;
  }

  // Try geoip-lite first (fastest, local database)
  try {
    const geo = geoip.lookup(ip);
    if (geo && geo.country) {
      const location = { country: geo.country, city: geo.city || 'Unknown' };
      ipCache.set(cacheKey, location);
      // Set a timeout to clear the cache entry after TTL
      setTimeout(() => ipCache.delete(cacheKey), CACHE_TTL);
      return location;
    }
  } catch (error) {
    console.warn('GeoIP-lite lookup failed (local DB issue or IP not found):', error.message);
  }

  // Fallback to external services
  for (const [serviceName, service] of Object.entries(GEO_SERVICES)) {
    // Skip GEOLITE if token is not provided
    if (serviceName === 'GEOLITE' && !service.token) {
      console.warn(`Skipping GEOLITE service for ${ip}: MAXMIND_TOKEN is not set.`);
      continue;
    }
    // Skip IPINFO if token is not provided (though ipinfo.io has a free tier)
    if (serviceName === 'IPINFO' && !service.token) {
      console.warn(`Skipping IPINFO service for ${ip}: IPINFO_TOKEN is not set.`);
      continue;
    }

    try {
      const response = await axios.get(service.endpoint(ip), {
        params: service.token ? { token: service.token } : {},
        timeout: 3000, // 3-second timeout for external API calls
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'URLShortener/1.0 (Contact: your-email@example.com)' // Good practice to identify your app
        }
      });

      // Check for common error responses from external APIs (e.g., status: 'fail' from ip-api)
      if (response.data && response.data.status === 'fail') {
        throw new Error(response.data.message || `API service ${serviceName} returned a failure status.`);
      }

      const location = service.parser(response.data);
      if (location.country === 'Unknown' && location.city === 'Unknown') {
        // If parser returns all unknown, it's not a useful result, try next service
        throw new Error(`Service ${serviceName} returned unknown location.`);
      }

      ipCache.set(cacheKey, location);
      setTimeout(() => ipCache.delete(cacheKey), CACHE_TTL);
      return location;
    } catch (error) {
      console.warn(`[${serviceName}] Geolocation failed for ${ip}:`, error.message);
    }
  }

  console.warn(`All geolocation services failed for IP: ${ip}. Defaulting to Unknown.`);
  return { country: 'Unknown', city: 'Unknown' };
}

// Helper function to extract client IP
function getClientIP(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs. The first one is usually the client.
    return xForwardedFor.split(',')[0].trim();
  }
  // Fallback to other headers and remoteAddress
  return req.headers['x-real-ip'] || // Common when behind a reverse proxy like Nginx
             req.connection?.remoteAddress || // Standard Node.js way
             req.socket?.remoteAddress ||
             req.ip || // Express's default IP property
             'Unknown'; // Fallback if no IP is found
}


// MAIN REDIRECT ROUTE
router.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  console.log(`[${shortId}] Redirect request received.`); // Debug log at the very start

  let url; // Declare url outside try/catch to be accessible in outer catch block

  try {
    url = await Url.findOne({ shortId });

    if (!url) {
      console.log(`[${shortId}] URL not found.`);
      return res.status(404).send("Not found");
    }

    // Update click count
    url.clicks++;
    await url.save();
    console.log(`[${shortId}] Url.clicks updated to ${url.clicks}.`); // Debug log

    // Extract client information
    const ip = getClientIP(req);
    const ua = uaParser(req.headers['user-agent'] || '');

    console.log(`[${shortId}] Client IP: ${ip}, User-Agent: ${req.headers['user-agent'] || 'N/A'}`); // Debug log

    // Get geolocation (with fallback)
    let geo = { country: 'Unknown', city: 'Unknown' };
    try {
      geo = await getGeoLocation(ip);
      console.log(`[${shortId}] Geo lookup result:`, geo); // Debug log
    } catch (geoError) {
      console.warn(`[${shortId}] Geolocation helper failed:`, geoError.message);
      // Keep geo as Unknown if getGeoLocation fails
    }

    // Prepare click log data
    const clickLogData = {
      shortId,
      ip: ip || 'Unknown', // Ensure IP is always set, even if getClientIP returns null
      country: geo.country || 'Unknown',
      city: geo.city || 'Unknown',
      device: ua.device?.type || 'Desktop', // Default to 'Desktop' if device type is not found
      browser: ua.browser?.name || 'Unknown', // Default to 'Unknown' if browser name is not found
      os: ua.os?.name || 'Unknown',       // Default to 'Unknown' if OS name is not found
      timestamp: new Date()
    };

    console.log(`[${shortId}] Attempting to create ClickLog with data:`, clickLogData); // PRE-CREATE LOG

    // *** POTENTIAL ERROR AREA - TEMPORARILY REMOVED TRY...CATCH FOR DEBUGGING ***
    // This will cause the server to crash if ClickLog.create fails, but will give you the exact error.
    // REMEMBER TO REVERT THIS AFTER DEBUGGING!
    const clickLog = await ClickLog.create(clickLogData);
    console.log(`[${shortId}] Click log created successfully:`, clickLog._id); // POST-CREATE SUCCESS LOG

    // *** ORIGINAL TRY...CATCH BLOCK (COMMENTED OUT FOR DEBUGGING) ***
    /*
    try {
      const clickLog = await ClickLog.create(clickLogData);
      console.log(`[${shortId}] Click log created successfully:`, clickLog._id); // Debug log
    } catch (logError) {
      console.error(`[${shortId}] Failed to create click log:`, logError.message);
      if (logError.code === 11000) { // MongoDB duplicate key error code
        console.error(`[${shortId}] MongoDB Duplicate Key Error! Likely a unique index constraint violation. Key:`, logError.keyValue);
      } else if (logError.name === 'ValidationError') { // Mongoose validation error
        console.error(`[${shortId}] Mongoose Validation Error:`, logError.errors);
      }
      // Don't fail the redirect if logging fails
    }
    */
    // *** END ORIGINAL TRY...CATCH BLOCK ***


    console.log(`[${shortId}] Redirecting to: ${url.originalUrl}`); // Debug log
    res.redirect(url.originalUrl);

  } catch (err) {
    console.error(`[${shortId}] Redirect error (unhandled ClickLog.create error, or other):`, err); // Catch all errors, including uncaught from ClickLog.create
    // Try to redirect anyway if we can find the URL (using the 'url' variable declared outside)
    if (url && url.originalUrl) {
      console.log(`[${shortId}] Fallback redirect to:`, url.originalUrl);
      return res.redirect(url.originalUrl);
    }
    res.status(500).send("Server error");
  }
});

// POST /api/urls/shorten
router.post('/shorten', async (req, res) => {
  const { originalUrl, createdBy } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required' });
  }

  // NOTE: You have URL validation in your Url.js model (using validator.isURL).
  // This regex is redundant and potentially less robust. Consider removing it and relying
  // on the Mongoose schema validation for cleaner separation of concerns.
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
    res.json({
      shortUrl: `${req.protocol}://${req.get('host')}/${shortId}`, // Corrected to just shortId directly from root
      shortId: shortId,
      originalUrl: originalUrl
    });
  } catch (err) {
    console.error('Shorten URL error:', err);
    // If validator.isURL is used in schema, a ValidationError might occur here
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message, details: err.errors });
    }
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
});

// Analytics endpoint with improved error handling
router.get('/analytics/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    console.log(`Analytics request for shortId: ${shortId}`);

    const urlDoc = await Url.findOne({ shortId });

    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const clickLogs = await ClickLog.find({ shortId }).sort({ timestamp: -1 });
    console.log(`Found ${clickLogs.length} click logs for ${shortId}`);

    // Generate analytics summary
    const countryStats = {};
    const deviceStats = {};
    const browserStats = {};
    const dailyStats = {};

    clickLogs.forEach(log => {
      // Use logical OR for defaults if logs somehow have missing data
      countryStats[log.country || 'Unknown'] = (countryStats[log.country || 'Unknown'] || 0) + 1;
      deviceStats[log.device || 'Unknown'] = (deviceStats[log.device || 'Unknown'] || 0) + 1;
      browserStats[log.browser || 'Unknown'] = (browserStats[log.browser || 'Unknown'] || 0) + 1;

      const date = (log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    res.json({
      url: {
        originalUrl: urlDoc.originalUrl,
        shortId: urlDoc.shortId,
        totalClicks: urlDoc.clicks, // This is the counter in Url model
        createdAt: urlDoc.createdAt
      },
      analytics: {
        totalLogs: clickLogs.length, // This is the count from ClickLogs
        countryStats,
        deviceStats,
        browserStats,
        dailyStats,
        recentClicks: clickLogs.slice(0, 10) // Last 10 clicks
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
});

// Get all links for a user (by user ID)
router.get('/user/links/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const urls = await Url.find({ createdBy: uid }).sort({ createdAt: -1 });

    // Add click counts for each URL
    const urlsWithStats = await Promise.all(
      urls.map(async (url) => {
        // Use a more robust count: the `clicks` field in Url model should match this.
        // If they differ, it means ClickLog creation is failing.
        const clickCount = await ClickLog.countDocuments({ shortId: url.shortId });
        return {
          ...url.toObject(),
          actualClicks: clickCount // Actual count from logs
        };
      })
    );

    res.json(urlsWithStats);
  } catch (err) {
    console.error('Fetch user links error:', err);
    res.status(500).json({ error: 'Failed to fetch user links' });
  }
});

// Delete URL endpoint
router.delete('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token and get userId (implement this function based on your auth system)
    let userId;
    try {
      userId = verifyTokenAndGetUserId(token); // THIS IS YOUR TODO
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

    // Delete URL and associated click logs
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

// DEBUG ROUTES (Remove in production)
// Adding a log to confirm NODE_ENV
console.log(`[DEBUG] NODE_ENV is: ${process.env.NODE_ENV}. Debug routes are ${process.env.NODE_ENV === 'development' ? 'ENABLED' : 'DISABLED'}.`);

if (process.env.NODE_ENV === 'development') {
  // Test route to create a sample click log
  router.post('/test-clicklog', async (req, res) => {
    try {
      const testLog = await ClickLog.create({
        shortId: 'test123',
        ip: '127.0.0.1',
        country: 'Test Country',
        city: 'Test City',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows',
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Test click log created',
        data: testLog
      });
    } catch (error) {
      console.error('Test clicklog error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Debug route to check existing click logs
  router.get('/debug/clicklogs/:shortId?', async (req, res) => {
    try {
      const { shortId } = req.params;
      const filter = shortId ? { shortId } : {};

      const logs = await ClickLog.find(filter).limit(20).sort({ timestamp: -1 });
      const count = await ClickLog.countDocuments(filter);

      res.json({
        filter,
        totalLogs: count,
        recentLogs: logs
      });
    } catch (error) {
      console.error('Debug clicklogs error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

// Placeholder for token verification function
function verifyTokenAndGetUserId(token) {
  // TODO: Implement your JWT/Firebase token verification here
  // This should decode the token and return the user ID
  // For now, throwing an error to remind you to implement this
  console.warn('WARNING: verifyTokenAndGetUserId is not implemented!');
  throw new Error('Token verification not implemented');
}

module.exports = router;
