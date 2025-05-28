import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './modern.css';

const DashboardPage = ({ uid }) => {
  const [userUrls, setUserUrls] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState('');
  const isGuest = uid === 'guest';

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

  const fetchUserUrls = async () => {
    setError('');
    if (isGuest) {
      setUserUrls([]);
      setIsLoading(false);
      return;
    }

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
  }, [uid]);

  const handleDelete = async (shortId) => {
    if (isGuest) {
      setError("Guest users can't delete URLs.");
      return;
    }

    setError('');
    setDeleteStatus(`Deleting URL...`);
    
    try {
      await axiosWithAuth().delete(`/urls/${shortId}`);
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
    <div className="dashboard-container">
      <h2>{isGuest ? 'Guest Dashboard' : 'Your Shortened URLs'}</h2>

      {isGuest && (
        <p className="guest-info">
          You are in guest mode. Your data will not be saved.{' '}
          <a href="/login">Log in</a> to start tracking your URLs.
        </p>
      )}

      {error && <p className="error-message">{error}</p>}
      {deleteStatus && <p className="status-message">{deleteStatus}</p>}

      {isLoading ? (
        <p>Loading...</p>
      ) : userUrls.length === 0 ? (
        <p>{isGuest ? 'Guests do not have access to saved URLs.' : 'No URLs shortened yet. Start by shortening a link!'}</p>
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
                    href={`https://shrinkoo.onrender.com/${url.shortId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="short-url"
                  >
                    {`https://shrinkoo.onrender.com/${url.shortId}`}
                  </a>

                  <p className="click-count">Clicks: {url.clicks}</p>
                </div>

                {!isGuest && (
                  <div className="url-actions">
                    <button 
                      onClick={() => handleDelete(url.shortId)} 
                      className="delete-button"
                      aria-label={`Delete shortened URL for ${url.originalUrl}`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
