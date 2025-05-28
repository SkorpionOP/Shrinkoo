import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaGithub, FaArrowLeft, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import "../firebase/firebase"; // make sure firebase is initialized
import "./log.css";
import { AuthContext } from "../context/AuthContext";

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

const LoginPage = () => {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();
  const { loginAsGuest } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account created!");
      setView("login");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset link sent to your email.");
      setView("login");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/home");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGithubLogin = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
      navigate("/home");
    } catch (error) {
      alert(error.message);
    }
  };


  return (
    <div className="login-container">
      <motion.div
        className="login-box"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {view !== "login" && (
            <motion.div
              className="back-button"
              onClick={() => setView("login")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FaArrowLeft />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.h2 layout transition={{ duration: 0.2 }}>
          {view === "login" && "Welcome Back!"}
          {view === "signup" && "Create Account"}
          {view === "forgot" && "Reset Password"}
        </motion.h2>

        <AnimatePresence mode="wait">
          <motion.form
            key={view}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            onSubmit={
              view === "login"
                ? handleLogin
                : view === "signup"
                ? handleSignup
                : handleForgotPassword
            }
          >
            {view === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </>
            )}
            {(view === "login" || view === "signup") && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </>
            )}
            {view === "forgot" && (
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="main-action"
            >
              {view === "login"
                ? "Login"
                : view === "signup"
                ? "Sign Up"
                : "Reset Password"}
            </motion.button>

            {view === "login" && (
              <>
                <div className="social-login">
  <motion.button
    type="button"
    className="google-btn"
    whileHover={{ scale: 1.05 }}
    onClick={handleGoogleLogin}
  >
    <FaGoogle /> Continue with Google
  </motion.button>
  <motion.button
    type="button"
    className="github-btn"
    whileHover={{ scale: 1.05 }}
    onClick={handleGithubLogin}
  >
    <FaGithub /> Continue with GitHub
  </motion.button>
  <motion.button
  type="button"
  className="guest-btn"
  whileHover={{ scale: 1.05 }}
  onClick={() => {
    loginAsGuest();
    navigate('/dashboard');
  }}
>
  <FaUser /> Continue as Guest
</motion.button>

</div>

                <div className="aux-links">
                  <button type="button" onClick={() => setView("signup")}>
                    Create Account
                  </button>
                  <button type="button" onClick={() => setView("forgot")}>
                    Forgot Password?
                  </button>
                </div>
              </>
            )}
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;