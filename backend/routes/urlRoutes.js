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

  // Try geoip-lite first (fastest, local database)
  try {
    const geo = geoip.lookup(ip);
    if (geo && geo.country) {
      const location = { country: geo.country, city: geo.city || 'Unknown' };
      ipCache.set(cacheKey, location);
      setTimeout(() => ipCache.delete(cacheKey), CACHE_TTL);
      return location;
    }
  } catch (error) {
    console.warn('GeoIP-lite lookup failed:', error.message);
  }

  // Fallback to external services
  for (const [serviceName, service] of Object.entries(GEO_SERVICES)) {
    if (serviceName === 'GEOLITE' && !service.token) continue;

    try {
      const response = await axios.get(service.endpoint(ip), {
        params: service.token ? { token: service.token } : {},
        timeout: 3000,
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

// Helper function to extract client IP
function getClientIP(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         'Unknown';
}

// MAIN REDIRECT ROUTE - FIXED (Only one handler now)
router.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    console.log(`Redirect request for shortId: ${shortId}`); // Debug log
    
    const url = await Url.findOne({ shortId });

    if (!url) {
      console.log(`URL not found for shortId: ${shortId}`);
      return res.status(404).send("Not found");
    }

    // Update click count
    url.clicks++;
    await url.save();
    console.log(`Updated clicks to ${url.clicks} for ${shortId}`); // Debug log

    // Extract client information
    const ip = getClientIP(req);
    const ua = uaParser(req.headers['user-agent'] || '');
    
    console.log(`Client info - IP: ${ip}, UA: ${req.headers['user-agent']}`); // Debug log

    // Get geolocation (with fallback)
    let geo = { country: 'Unknown', city: 'Unknown' };
    try {
      geo = await getGeoLocation(ip);
      console.log(`Geo lookup result:`, geo); // Debug log
    } catch (geoError) {
      console.warn('Geolocation failed:', geoError.message);
    }

    // Create click log entry
    const clickLogData = {
      shortId,
      ip: ip || 'Unknown',
      country: geo.country || 'Unknown',
      city: geo.city || 'Unknown',
      device: ua.device?.type || 'Desktop',
      browser: ua.browser?.name || 'Unknown',
      os: ua.os?.name || 'Unknown',
      timestamp: new Date()
    };

    console.log('Creating click log with data:', clickLogData); // Debug log

    try {
      const clickLog = await ClickLog.create(clickLogData);
      console.log('Click log created successfully:', clickLog._id); // Debug log
    } catch (logError) {
      console.error('Failed to create click log:', logError);
      // Don't fail the redirect if logging fails
    }

    console.log(`Redirecting to: ${url.originalUrl}`); // Debug log
    res.redirect(url.originalUrl);
    
  } catch (err) {
    console.error('Redirect error:', err);
    
    // Try to redirect anyway if we can find the URL
    try {
      const url = await Url.findOne({ shortId: req.params.shortId });
      if (url) {
        console.log('Fallback redirect to:', url.originalUrl);
        return res.redirect(url.originalUrl);
      }
    } catch (fallbackError) {
      console.error('Fallback redirect failed:', fallbackError);
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
    res.json({ 
      shortUrl: `${req.protocol}://${req.get('host')}/api/urls/${shortId}`,
      shortId: shortId,
      originalUrl: originalUrl
    });
  } catch (err) {
    console.error('Shorten URL error:', err);
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
      // Country stats
      countryStats[log.country] = (countryStats[log.country] || 0) + 1;
      
      // Device stats
      deviceStats[log.device] = (deviceStats[log.device] || 0) + 1;
      
      // Browser stats
      browserStats[log.browser] = (browserStats[log.browser] || 0) + 1;
      
      // Daily stats
      const date = log.timestamp.toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });
    
    res.json({
      url: {
        originalUrl: urlDoc.originalUrl,
        shortId: urlDoc.shortId,
        totalClicks: urlDoc.clicks,
        createdAt: urlDoc.createdAt
      },
      analytics: {
        totalLogs: clickLogs.length,
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
      // You need to implement this function based on your authentication system
      userId = verifyTokenAndGetUserId(token);
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
  throw new Error('Token verification not implemented');
}

module.exports = router;
