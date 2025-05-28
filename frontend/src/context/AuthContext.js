import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [uid, setUid] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setIsGuest(false);
        localStorage.removeItem('guest'); // Ensure guest flag is cleared for authenticated users
      } else {
        // Only set guest if explicitly selected
        if (localStorage.getItem('guest') === 'true') {
          setUid('guest');
          setIsGuest(true);
        } else {
          setUid(null);
          setIsGuest(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsGuest = () => {
    localStorage.setItem('guest', 'true');
    setUid('guest');
    setIsGuest(true);
  };

  const logout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth); // Sign out from Firebase
      localStorage.removeItem('guest'); // Clear guest flag
      setUid(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ uid, isGuest, loginAsGuest, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};