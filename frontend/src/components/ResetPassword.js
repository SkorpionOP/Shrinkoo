// src/components/ResetPassword.js
import React, { useState } from "react";
import { sendResetEmail } from "../firebase/authMethods";

function ResetPassword() {
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    try {
      await sendResetEmail(email);
      alert("Password reset email sent!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button onClick={handleReset}>Send Reset Link</button>
      </div>
    </div>
  );
}

export default ResetPassword;
