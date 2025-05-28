// src/components/Register.js
import React, { useState } from "react";
import { registerWithEmail } from "../firebase/authMethods";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const result = await registerWithEmail(email, password);
      console.log("Registered:", result.user);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
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
        <button onClick={handleRegister}>Register</button>
      </div>
    </div>
  );
}

export default Register;
