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
    baseURL: 'https://link-shrinker-backend.onrender.com',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

// Custom styles
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

// Fallback data for multiple links
const FALLBACK_DATA = [
  {
    _id: "fallback1",
    originalUrl: "https://example.com/original-url",
    shortId: "demo1",
    clicks: 1284,
    createdAt: new Date().toISOString(),
    logs: Array.from({ length: 30 }, (_, i) => ({
      _id: `fallback1-${i}`,
      shortId: "demo1",
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: "Unknown",
      device: ["mobile", "desktop"][Math.floor(Math.random() * 2)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }))
  },
  {
    _id: "fallback2",
    originalUrl: "https://another-example.com",
    shortId: "demo2",
    clicks: 567,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    logs: Array.from({ length: 20 }, (_, i) => ({
      _id: `fallback2-${i}`,
      shortId: "demo2",
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: "Unknown",
      device: ["mobile", "desktop"][Math.floor(Math.random() * 2)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }))
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const UrlAnalytics = ({ uid }) => {
  const [data, setData] = useState([]);
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

      // Debug: Log uid and token
      const token = localStorage.getItem('authToken');
      console.log('Fetching data with:', { uid, token });

      try {
        // Fetch list of user links
        const linksRes = await axiosWithAuth().get(`/api/urls/user/links/${uid}`);
        console.log('Links response:', linksRes.data);

        if (Array.isArray(linksRes.data) && linksRes.data.length > 0) {
          // Fetch analytics for each link
          const analyticsPromises = linksRes.data.map(link =>
            axiosWithAuth().get(`/api/urls/analytics/${link.shortId}`)
              .catch(err => {
                console.error(`Analytics error for ${link.shortId}:`, err);
                return { data: { shortId: link.shortId, logs: [] } }; // Fallback for failed analytics
              })
          );
          const analyticsResponses = await Promise.all(analyticsPromises);
          const analyticsData = analyticsResponses.map(res => res.data);
          console.log('Analytics data:', analyticsData);
          setData(analyticsData);
          return;
        } else {
          setError("No links found. Create some links to see analytics.");
        }
      } catch (apiError) {
        console.error('API error:', apiError);
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

      setData(FALLBACK_DATA);
      setUsingFallback(true);
    } catch (err) {
      console.error("Fetch error:", err);
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
      await axiosWithAuth().delete(`/urls/${shortId}`);
      setData(prev => prev.filter(url => url.shortId !== shortId));
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
    if (!data || !Array.isArray(data)) return null;

    // Filter data based on selected link
    const filteredData = selectedLink === "all"
      ? data
      : data.filter(link => link.shortId === selectedLink);

    if (filteredData.length === 0) return null;

    // Aggregate logs
    const allLogs = filteredData.flatMap(link => link.logs || []);
    const originalUrl = selectedLink === "all"
      ? "All Links"
      : filteredData[0].originalUrl;

    // Device distribution
    const deviceData = allLogs.reduce((acc, log) => {
      const device = log.device ? log.device.toLowerCase() : 'unknown';
      const normalizedDevice = 
        device.includes('mobile') ? 'Mobile' :
        device.includes('desktop') ? 'Desktop' :
        'Other';
      
      acc[normalizedDevice] = (acc[normalizedDevice] || 0) + 1;
      return acc;
    }, {});

    // Time distribution (last 7 days)
    const now = new Date();
    const timeData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return {
        date: dateStr,
        clicks: allLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return (
            logDate.getDate() === date.getDate() &&
            logDate.getMonth() === date.getMonth() &&
            logDate.getFullYear() === date.getFullYear()
          );
        }).length
      };
    });

    // Country distribution
    const countryData = allLogs.reduce((acc, log) => {
      const country = log.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const sortedCountries = Object.entries(countryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
      originalUrl,
      totalClicks: filteredData.reduce((sum, link) => sum + (link.clicks || 0), 0),
      uniqueVisitors: new Set(allLogs.map(log => log.ip)).size,
      createdAt: selectedLink === "all"
        ? "Multiple Dates"
        : new Date(filteredData[0].createdAt).toLocaleDateString(),
      deviceData: Object.entries(deviceData).map(([name, value]) => ({ name, value })),
      timeData,
      countryData: sortedCountries,
      usingFallback,
      logs: allLogs
    };
  };

  const analytics = processAnalytics();

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
              <span>Showing demo data. The analytics API is currently unavailable.</span>
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
              >
                <option value="all">All Links</option>
                {data.map(link => (
                  <option key={link.shortId} value={link.shortId}>
                    {link.originalUrl} ({link.shortId})
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
                <p className="metric-value">{analytics.countryData.length}</p>
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
                    <th>Device</th>
                    <th>Short ID</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.logs.slice(0, 5).map((log, index) => (
                    <tr key={index}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.country || 'Unknown'}</td>
                      <td className="capitalize">{log.device || 'Unknown'}</td>
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
                    <th>Clicks</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((link, index) => (
                    <tr key={index}>
                      <td>{link.shortId}</td>
                      <td className="url-cell">
                        <a 
                          href={link.originalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {link.originalUrl.length > 40 
                            ? `${link.originalUrl.substring(0, 40)}...` 
                            : link.originalUrl}
                          <ExternalLink size={14} />
                        </a>
                      </td>
                      <td>{link.clicks}</td>
                      <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(link.shortId)}
                          className="delete-btn"
                        >
                          <Trash2 size={16} />
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