import React, { useState, useEffect, useContext } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation, // Keep useLocation if needed elsewhere in AppContent
} from 'react-router-dom';
import './pages/modern.css';

// Import pages
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard'; // Renamed from HomePage based on your App.js
import QRCodeGenerator from './pages/qrGen';
import UrlAnalytics from './pages/UrlAnalytics';
import UrlShortener from './pages/shortUrl';
import LandingPage from './pages/LandingPage';

// Import the new NavBar component
import NavBar from './pages/NavBar'; // Ensure this path is correct

// Import AuthProvider and AuthContext
import { AuthProvider, AuthContext } from './context/AuthContext';


function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

const AppContent = () => {
  const { uid, isGuest, loading } = useContext(AuthContext); // Removed logout as it's handled in NavBar now
  const [isFirstVisit, setIsFirstVisit] = useState(false); // Keep this state if used elsewhere
  const isLoggedIn = Boolean(uid);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  if (loading) {
    return <div className="loading-container">Loading...</div>; // You might want to style this better
  }

  return (
    <div className="app-container">
      {/* Render the NavBar component here */}
      {/* showWelcomeLink prop removed as 'Welcome' link is now always in NavBar */}
      {(isLoggedIn || isGuest) && <NavBar />}

      <div className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn || isGuest ? (
                <Navigate to="/dashboard" replace />
              ) : isFirstVisit ? (
                <LandingPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/welcome" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              isLoggedIn || isGuest ? (
                <DashboardPage uid={uid} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/shorten"
            element={
              isLoggedIn || isGuest ? (
                <UrlShortener uid={uid} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/qrcode"
            element={
              isLoggedIn || isGuest ? (
                <QRCodeGenerator />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/analytics"
            element={
              isLoggedIn || isGuest ? (
                <UrlAnalytics uid={uid} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              isLoggedIn || isGuest ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route path="*" element={<h2>404: Page Not Found</h2>} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
