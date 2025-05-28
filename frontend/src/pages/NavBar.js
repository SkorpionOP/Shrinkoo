import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// Import icons for a richer UI
import { FaBars, FaTimes, FaLink, FaChartLine, FaQrcode, FaHome, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext'; // Ensure this path is correct for your AuthContext
import './NavBar.css'; // Import the custom CSS file

const NavBar = () => { // Removed showWelcomeLink prop as it's no longer needed for 'Welcome' link
  // Access authentication state and logout function from AuthContext
  const { uid, isGuest, logout } = useContext(AuthContext);
  // Determine if a user is authenticated (logged in or guest)
  const isAuthenticated = Boolean(uid) || isGuest;

  // State to control the visibility of the mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Hook to get the current URL path for highlighting active links
  const location = useLocation();
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Define all navigation menu items as a single source of truth
  // This array makes it easy to add, remove, or reorder menu items.
  const menuItems = [
    // 'Welcome' link is now unconditionally included
    { path: '/welcome', label: 'Welcome', icon: <FaHome /> },
    { path: '/dashboard', label: 'Dashboard', icon: <FaChartLine /> },
    { path: '/shorten', label: 'Shrink', icon: <FaLink /> },
    { path: '/qrcode', label: 'QR Code', icon: <FaQrcode /> },
    { path: '/analytics', label: 'Analytics', icon: <FaChartLine /> },
    // Conditionally add 'Logout' or 'Login' based on authentication status
    ...(isAuthenticated
      ? [{ path: null, label: 'Logout', icon: <FaSignOutAlt />, action: async () => {
          await logout(); // Call the logout function from AuthContext
          closeMobileMenu(); // Close the mobile menu after logging out
          navigate('/login'); // Redirect to the login page
        } }]
      : [{ path: '/login', label: 'Login', icon: <FaSignInAlt /> }])
  ];

  // Effect to automatically close the mobile menu when the window is resized to a desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) { // Standard breakpoint for desktop (md in Tailwind)
        setIsMobileMenuOpen(false); // Close the mobile menu
      }
    };
    window.addEventListener('resize', handleResize); // Add event listener
    return () => window.removeEventListener('resize', handleResize); // Cleanup on component unmount
  }, []);

  // Effect to close the mobile menu when a click occurs outside of the menu or the toggle button
  useEffect(() => {
    if (isMobileMenuOpen) {
      const handleOutsideClick = (e) => {
        // Check if the click target is not within the navbar menu or the mobile menu button
        // Use .closest() for robust checking against parent elements
        if (!e.target.closest('.mobile-nav-menu') && !e.target.closest('.mobile-menu-button')) {
          setIsMobileMenuOpen(false); // Close the mobile menu
        }
      };
      document.addEventListener('click', handleOutsideClick); // Add event listener
      return () => document.removeEventListener('click', handleOutsideClick); // Cleanup on component unmount
    }
  }, [isMobileMenuOpen]); // Dependency array: runs when isMobileMenuOpen changes

  // Function to toggle the mobile menu's open/closed state
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  // Function to explicitly close the mobile menu
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Helper function to render individual menu items for both desktop and mobile menus
  const renderMenuItem = (item, index, isMobile = false) => {
    // Determine if the current menu item's path matches the current URL
    const isActive = location.pathname === item.path;
    // Choose appropriate class based on whether it's a mobile or desktop item
    const linkClassName = isMobile ? 'mobile-nav-link' : 'navbar-link';
    const itemClassName = isMobile ? 'mobile-nav-item' : 'navbar-item';

    // Special handling for the 'Logout' button, which has an action instead of a path
    if (item.label === 'Logout') {
      return (
        <li key={index} className={itemClassName}>
          <button
            onClick={item.action}
            className={`${linkClassName} logout-button`}
          >
            {item.icon} {item.label}
          </button>
        </li>
      );
    }

    // Render a Link for other navigation items
    return (
      <li key={index} className={itemClassName}>
        <Link
          to={item.path}
          className={`${linkClassName} ${isActive ? 'active' : ''}`}
          onClick={closeMobileMenu} // Close mobile menu when a link is clicked
        >
          {item.icon} {item.label}
        </Link>
      </li>
    );
  };

  return (
    <nav className="navbar"> {/* Navbar container with styling and flex properties */}
      <div className="navbar-brand">
        {/* Logo with full text for desktop and abbreviated for mobile */}
        <Link to="/dashboard" className="navbar-logo" onClick={closeMobileMenu}>
          <span className="hidden sm:block">Shrinkoo</span>
        </Link>
      </div>

      {/* Desktop Menu - visible on medium and larger screens */}
      <ul className="navbar-menu hidden md:flex">
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </ul>

      {/* Mobile Menu Button - visible on small screens */}
      <button
        className="mobile-menu-button md:hidden"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {/* Toggle between hamburger and close icon */}
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Menu - shown conditionally on small screens */}
      {/* This is rendered outside the main flex container to allow absolute positioning */}
      <ul className={`mobile-nav-menu md:hidden ${isMobileMenuOpen ? 'open' : ''}`}>
        {menuItems.map((item, index) => renderMenuItem(item, index, true))} {/* Pass true for isMobile */}
      </ul>
    </nav>
  );
};

export default NavBar;
