// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase/firebase'; // Adjust the import if necessary
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        navigate('/login'); // Redirect to login page if not authenticated
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login'); // Redirect after logout
  };

  return (
    <div className="home-container">
      <h2>Welcome, {user?.displayName || user?.email}!</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Home;
