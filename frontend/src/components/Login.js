// src/components/Login.js
import React, { useState } from "react";
import {
  loginWithGoogle,
  loginWithGitHub,
  loginWithEmail,
} from "../firebase/authMethods";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async () => {
    try {
      const result = await loginWithEmail(email, password);
      console.log("Logged in:", result.user);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <button onClick={loginWithGoogle}>Login with Google</button>
      <button onClick={loginWithGitHub}>Login with GitHub</button>
      <div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button onClick={handleEmailLogin}>Login</button>
      </div>
    </div>
  );
}

export default Login;
