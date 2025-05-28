import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";

// Sign in with Google
export const loginWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// Sign in with GitHub
export const loginWithGitHub = () => {
  const provider = new GithubAuthProvider();
  return signInWithPopup(auth, provider);
};

// Email/Password login
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// Register with email
export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

// Reset password
export const sendResetEmail = (email) => sendPasswordResetEmail(auth, email);

// Logout function
export const logoutUser = async () => {
  await signOut(auth);
  // Clear any cached authentication data
  if (window.localStorage) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('firebase:authUser:')) {
        localStorage.removeItem(key);
      }
    });
  }
  // Force a complete refresh
  window.location.reload();
};