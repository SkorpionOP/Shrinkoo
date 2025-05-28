import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import {
  Link as LinkIcon, Users, Clock, Smartphone, Globe, RefreshCw,
  MapPin, AlertCircle, Loader2, Trash2, ExternalLink
} from "lucide-react"


import "./Analytics.css";
import "./modern.css";

// Configure axios with authentication
const axiosWithAuth = () => {
  const token = localStorage.getItem('authToken');
  return axios.create({
    baseURL: 'https://shrinkoo.onrender.com',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

// Custom styles (keep as is)
const styles = {
  container: "home-container",
  errorMessage: "error-message",
  statusMessage: "status-message",
  alertBanner: "bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded",
  header: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
  title: "text-2xl font-bold flex items-center gap-2",
  subtitle: "text-gray-600",
  button: "flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
  deleteButton: "delete-button",
  cardGrid: "grid grid-cols-1 md:grid-cols-4 gap-4",
  card: "bg-white p-6 rounded-lg shadow",
  cardContent: "flex items-center gap-3",
  cardLabel: "text-gray-500 text-sm",
  cardValue: "text-2xl font-bold",
  chartGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  chartCard: "bg-white p-6 rounded-lg shadow",
  chartTitle: "flex items-center gap-2 text-lg font-medium mb-4",
  chartContainer: "h-80",
  fullWidthCard: "bg-white p-6 rounded-lg shadow",
  tableContainer: "bg-white p-6 rounded-lg shadow overflow-x-auto",
  table: "min-w-full divide-y divide-gray-200",
  tableHeader: "bg-gray-50",
  tableHeaderCell: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
  tableBody: "bg-white divide-y divide-gray-200",
  tableCell: "px-6 py-4 whitespace-nowrap text-sm text-gray-500",
  loadingContainer: "flex flex-col items-center justify-center h-64 gap-4",
  loadingIcon: "animate-spin h-12 w-12 text-blue-500",
  loadingText: "text-gray-600",
  errorContainer: "flex flex-col items-center justify-center h-64 gap-4",
  errorIcon: "h-12 w-12 text-red-500",
  select: "px-4 py-2 border rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
};

// Fallback data for multiple links (updated to match new backend structure)
const FALLBACK_DATA = [
  {
    url: {
      _id: "fallback1",
      originalUrl: "https://example.com/original-url",
      shortId: "demo1",
      totalClicks: 1284, // Changed from 'clicks' to 'totalClicks'
      createdAt: new Date().toISOString(),
    },
    analytics: { // New nested structure
      totalLogs: 30,
      countryStats: { US: 20, CA: 10 },
      deviceStats: { Mobile: 15, Desktop: 15 },
      browserStats: { Chrome: 20, Firefox: 10 },
      dailyStats: {
        [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: 5,
        [new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: 10,
        [new Date().toISOString().split('T')[0]]: 15
      },
      recentClicks: Array.from({ length: 10 }, (_, i) => ({ // Top 10 recent logs
        _id: `fallback1-${i}`,
        shortId: "demo1",
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country: ["US", "CA"][Math.floor(Math.random() * 2)],
        city: "Unknown",
        device: ["Mobile", "Desktop"][Math.floor(Math.random() * 2)],
        browser: ["Chrome", "Firefox"][Math.floor(Math.random() * 2)],
        os: ["Windows", "Mac"][Math.floor(Math.random() * 2)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
    }
  },
  {
    url: {
      _id: "fallback2",
      originalUrl: "https://another-example.com",
      shortId: "demo2",
      totalClicks: 567,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    analytics: {
      totalLogs: 20,
      countryStats: { DE: 15, FR: 5 },
      deviceStats: { Tablet: 5, Desktop: 15 },
      browserStats: { Safari: 10, Edge: 10 },
      dailyStats: {
        [new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: 8,
        [new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: 12,
      },
      recentClicks: Array.from({ length: 5 }, (_, i) => ({
        _id: `fallback2-${i}`,
        shortId: "demo2",
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country: ["DE", "FR"][Math.floor(Math.random() * 2)],
        city: "Unknown",
        device: ["Tablet", "Desktop"][Math.floor(Math.random() * 2)],
        browser: ["Safari", "Edge"][Math.floor(Math.random() * 2)],
        os: ["Android", "iOS"][Math.floor(Math.random() * 2)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
    }
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const UrlAnalytics = ({ uid }) => {
  const [data, setData] = useState([]); // This will now hold an array of objects like { url: {...}, analytics: {...} }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedLink, setSelectedLink] = useState("all");

  const fetchData = async (retryCount = 2) => {
    if (!uid || uid === "guest") {
      setError("Please log in to view your URL analytics.");
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUsingFallback(false);

      const token = localStorage.getItem('authToken');
      console.log('Fetching data with:', { uid, token });

      try {
        // Fetch list of user links (from /api/urls/user/links/:uid)
        const linksRes = await axiosWithAuth().get(`/api/urls/user/links/${uid}`);
        console.log('Links response (from /user/links):', linksRes.data);

        if (Array.isArray(linksRes.data) && linksRes.data.length > 0) {
          // Fetch analytics for each link (from /api/urls/analytics/:shortId)
          const analyticsPromises = linksRes.data.map(link =>
            axiosWithAuth().get(`/api/urls/analytics/${link.shortId}`)
              .catch(err => {
                console.error(`Analytics error for ${link.shortId}:`, err);
                // Return a structure that matches the successful response, even if empty
                return {
                  data: {
                    url: link, // Use the link info we already have
                    analytics: {
                      totalLogs: 0,
                      countryStats: {},
                      deviceStats: {},
                      browserStats: {},
                      dailyStats: {},
                      recentClicks: []
                    }
                  }
                };
              })
          );
          const analyticsResponses = await Promise.all(analyticsPromises);
          // The response for each analytics call is already in the desired format: { url: {}, analytics: {} }
          const combinedData = analyticsResponses.map(res => res.data);
          console.log('Combined Analytics Data (after individual calls):', combinedData);
          setData(combinedData);
          return;
        } else {
          setError("No links found. Create some links to see analytics.");
        }
      } catch (apiError) {
        console.error('API error (fetching links or analytics):', apiError);
        if (retryCount > 0) {
          console.warn(`Retrying API call (${retryCount} attempts left)...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchData(retryCount - 1);
        }
        if (apiError.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
          localStorage.removeItem('authToken');
        } else {
          setError(apiError.response?.data?.error || "Failed to fetch analytics data.");
        }
      }

      // If API calls fail after retries, use fallback data
      setData(FALLBACK_DATA);
      setUsingFallback(true);
    } catch (err) {
      console.error("General fetch error:", err);
      setError(err.message || "Failed to fetch analytics data.");
      setData(FALLBACK_DATA);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shortId) => {
    setError('');
    setDeleteStatus(`Deleting URL...`);

    try {
      // The delete endpoint is now `/:shortId` directly under `/api/urls`
      await axiosWithAuth().delete(`/api/urls/${shortId}`); // Changed URL
      setData(prev => prev.filter(item => item.url.shortId !== shortId)); // Adjust filter
      setDeleteStatus('URL deleted successfully');
      setTimeout(() => setDeleteStatus(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      let errorMsg = 'Failed to delete URL';
      if (err.response) {
        if (err.response.status === 401) {
          errorMsg = 'Authentication failed. Please log in again.';
          localStorage.removeItem('authToken');
        } else if (err.response.data?.error) {
          errorMsg = err.response.data.error;
        }
      }
      setError(errorMsg);
      setDeleteStatus('');
    }
  };

  useEffect(() => {
    fetchData();
  }, [uid]);

  const processAnalytics = () => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Filter data based on selected link
    const filteredData = selectedLink === "all"
      ? data
      : data.filter(item => item.url.shortId === selectedLink);

    if (filteredData.length === 0) return null;

    let totalClicks = 0;
    let uniqueVisitors = new Set();
    const countryStats = {};
    const deviceStats = {};
    const browserStats = {};
    const dailyStats = {};
    const recentClicks = []; // This will hold the aggregated recent clicks

    filteredData.forEach(item => {
      totalClicks += (item.url.totalClicks || 0); // Use url.totalClicks
      // Aggregate detailed analytics from each item's analytics object
      if (item.analytics) {
        // Aggregate country stats
        for (const country in item.analytics.countryStats) {
          countryStats[country] = (countryStats[country] || 0) + item.analytics.countryStats[country];
        }
        // Aggregate device stats
        for (const device in item.analytics.deviceStats) {
          deviceStats[device] = (deviceStats[device] || 0) + item.analytics.deviceStats[device];
        }
        // Aggregate browser stats
        for (const browser in item.analytics.browserStats) {
          browserStats[browser] = (browserStats[browser] || 0) + item.analytics.browserStats[browser];
        }
        // Aggregate daily stats
        for (const date in item.analytics.dailyStats) {
          dailyStats[date] = (dailyStats[date] || 0) + item.analytics.dailyStats[date];
        }
        // Aggregate recent clicks
        recentClicks.push(...item.analytics.recentClicks);
        // Collect unique IPs for unique visitors
        item.analytics.recentClicks.forEach(log => uniqueVisitors.add(log.ip));
      }
    });

    // Sort recentClicks by timestamp descending and take the top 10/whatever
    recentClicks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const aggregatedRecentClicks = recentClicks.slice(0, 10); // Show top 10 overall recent clicks

    // Format dailyStats for Recharts BarChart (last 7 days logic)
    const now = new Date();
    const timeData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0]; // Format to YYYY-MM-DD for key matching
      const displayDateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        date: displayDateStr,
        clicks: dailyStats[dateStr] || 0 // Get clicks from aggregated dailyStats
      };
    });

    // Sort and slice country data
    const sortedCountries = Object.entries(countryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
      originalUrl: selectedLink === "all" ? "All Links" : filteredData[0].url.originalUrl,
      shortId: selectedLink === "all" ? "all" : filteredData[0].url.shortId,
      totalClicks,
      uniqueVisitors: uniqueVisitors.size,
      createdAt: selectedLink === "all"
        ? "Multiple Dates"
        : new Date(filteredData[0].url.createdAt).toLocaleDateString(),
      deviceData: Object.entries(deviceStats).map(([name, value]) => ({ name, value })),
      timeData,
      countryData: sortedCountries,
      usingFallback,
      logs: aggregatedRecentClicks // Use the aggregated recent clicks
    };
  };

  const analytics = processAnalytics();

  // Helper to get short URL (for display in table)
  const getShortUrl = (shortId) => `https://shrinkoo.onrender.com/api/urls/${shortId}`;

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1 className="analytics-title">
          <LinkIcon className="text-blue-500" /> URL Analytics
        </h1>
        {error && <div className="analytics-error">{error}</div>}
        {deleteStatus && <div className="analytics-status">{deleteStatus}</div>}
      </header>

      {loading ? (
        <div className="analytics-loading">
          <Loader2 className="animate-spin" />
          <p>Loading analytics data...</p>
        </div>
      ) : uid === "guest" ? (
        <div className="analytics-guest">
          <p>Please log in to view your URL analytics.</p>
        </div>
      ) : !analytics ? (
        <div className="analytics-empty">
          <p>No analytics data available. Create some links to see analytics.</p>
        </div>
      ) : (
        <>
          {analytics.usingFallback && (
            <div className="analytics-alert">
              <AlertCircle />
              <span>Showing demo data. The analytics API is currently unavailable or returned no data.</span>
            </div>
          )}

          <div className="analytics-controls">
            <div className="analytics-selection">
              <h2>
                <LinkIcon className="text-blue-500" /> Analytics Overview
              </h2>

              <select
                value={selectedLink}
                onChange={(e) => setSelectedLink(e.target.value)}
                className={styles.select} // Apply select styling
              >
                <option value="all">All Links</option>
                {data.map(item => (
                  <option key={item.url.shortId} value={item.url.shortId}>
                    {item.url.originalUrl.length > 40
                      ? `${item.url.originalUrl.substring(0, 40)}...`
                      : item.url.originalUrl} ({item.url.shortId})
                  </option>
                ))}
              </select>
            </div>
            <button onClick={fetchData} className="refresh-button">
              <RefreshCw /> Refresh
            </button>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon bg-blue-100">
                <Users className="text-blue-600" />
              </div>
              <div>
                <p className="metric-label">Total Clicks</p>
                <p className="metric-value">{analytics.totalClicks}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon bg-green-100">
                <Globe className="text-green-600" />
              </div>
              <div>
                <p className="metric-label">Unique Visitors</p>
                <p className="metric-value">{analytics.uniqueVisitors}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon bg-purple-100">
                <Clock className="text-purple-600" />
              </div>
              <div>
                <p className="metric-label">Created</p>
                <p className="metric-value">{analytics.createdAt}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon bg-red-100">
                <MapPin className="text-red-600" />
              </div>
              <div>
                <p className="metric-label">Countries</p>
                <p className="metric-value">{Object.keys(analytics.countryData).length}</p> {/* Use actual count of keys */}
              </div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-card">
              <div className="chart-header">
                <Clock />
                <h3>Daily Clicks (Last 7 Days)</h3>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.timeData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <Smartphone />
                <h3>Device Distribution</h3>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.deviceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics.deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <div className="section-header">
              <MapPin />
              <h3>Recent Activity</h3>
            </div>
            <div className="activity-table">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Country</th>
                    <th>City</th> {/* Added City */}
                    <th>Device</th>
                    <th>Browser</th> {/* Added Browser */}
                    <th>OS</th> {/* Added OS */}
                    <th>Short ID</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.logs.map((log, index) => (
                    <tr key={index}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.country || 'Unknown'}</td>
                      <td>{log.city || 'Unknown'}</td> {/* Display City */}
                      <td className="capitalize">{log.device || 'Unknown'}</td>
                      <td>{log.browser || 'Unknown'}</td> {/* Display Browser */}
                      <td>{log.os || 'Unknown'}</td> {/* Display OS */}
                      <td>{log.shortId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="links-summary">
            <div className="section-header">
              <LinkIcon />
              <h3>All Links Summary</h3>
            </div>
            <div className="links-table">
              <table>
                <thead>
                  <tr>
                    <th>Short ID</th>
                    <th>Original URL</th>
                    <th>Clicks (Actual)</th> {/* Changed label */}
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => ( // Iterate through `data` directly
                    <tr key={index}>
                      <td>{item.url.shortId}</td>
                      <td className="url-cell">
                        <a
                          href={item.url.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.url.originalUrl.length > 40
                            ? `${item.url.originalUrl.substring(0, 40)}...`
                            : item.url.originalUrl}
                          <ExternalLink size={14} />
                        </a>
                      </td>
                      <td>{item.url.totalClicks}</td> {/* Use item.url.totalClicks */}
                      <td>{new Date(item.url.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(item.url.shortId)}
                          className="delete-btn"
                        >
                          <Trash2 size={16} />
                        </button>
                        {/* Add copy short URL button */}
                        <button
                          onClick={() => navigator.clipboard.writeText(getShortUrl(item.url.shortId))}
                          className="copy-btn ml-2" // Add some margin
                          title="Copy Short URL"
                        >
                          <LinkIcon size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UrlAnalytics;
