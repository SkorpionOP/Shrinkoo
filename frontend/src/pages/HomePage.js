import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './modern.css';

const HomePage = ({ uid }) => {
  const [userUrls, setUserUrls] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState('');

  // Configure axios with authentication
  const axiosWithAuth = () => {
    // Get token from localStorage if available
    const token = localStorage.getItem('authToken');
return axios.create({
  baseURL: 'https://link-shrinker-backend.onrender.com', // Fix: close the string properly
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

  };

  // Fetch URLs created by this user
  const fetchUserUrls = async () => {
    if (!uid || uid === "guest") {
      setIsLoading(false);
      return;
    }

    setError('');
    try {
      const res = await axiosWithAuth().get(`/api/urls/user/links/${uid}`);
      setUserUrls(res.data);
    } catch (err) {
      setError('Error fetching your shortened URLs.');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Handle deleting a URL
  // In HomePage.js
const handleDelete = async (shortId) => {
  setError('');
  setDeleteStatus(`Deleting URL...`);
  
  try {
    const response = await axiosWithAuth().delete(`/urls/${shortId}`);
    
    setUserUrls(prev => prev.filter(url => url.shortId !== shortId));
    setDeleteStatus('URL deleted successfully');
    
    setTimeout(() => setDeleteStatus(''), 3000);
  } catch (err) {
    console.error('Delete error:', err);
    
    let errorMsg = 'Failed to delete URL';
    if (err.response) {
      if (err.response.status === 401) {
        errorMsg = 'Please login again';
        localStorage.removeItem('authToken');
      } else if (err.response.data?.error) {
        errorMsg = err.response.data.error;
      }
    }
    
    setError(errorMsg);
    setDeleteStatus('');
  }
};

  return (
    <div className="home-container">
      <h2>Your Shortened URLs</h2>

      {error && <p className="error-message">{error}</p>}
      {deleteStatus && <p className="status-message">{deleteStatus}</p>}

      {isLoading ? (
        <p>Loading...</p>
      ) : uid === "guest" ? (
        <p>Please log in to view your shortened URLs.</p>
      ) : userUrls.length === 0 ? (
        <p>No URLs shortened yet. Start by shortening a link!</p>
      ) : (
        <div className="url-list">
          <ul>
            {userUrls.map((url) => (
              <li key={url.shortId} className="url-item">
                <div className="url-info">
                  <h3>Original URL:</h3>
                  <a
                    href={url.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="original-url"
                  >
                    {url.originalUrl}
                  </a>
                  
                  <h3>Shortened URL:</h3>
                  <a 
                    href={`https://link-shrinker-backend.onrender.com
/${url.shortId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="short-url"
                  >
                    {`https://link-shrinker-backend.onrender.com
/${url.shortId}`}
                  </a>
                  
                  <p className="click-count">Clicks: {url.clicks}</p>
                </div>
                
                <div className="url-actions">
                  <button 
                    onClick={() => handleDelete(url.shortId)} 
                    className="delete-button"
                    aria-label={`Delete shortened URL for ${url.originalUrl}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HomePage;
