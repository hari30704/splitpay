import React, { useState } from "react";
import "../App.css";

function Register({ onRegisterSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password })
      });
      const data = await response.json();
      setLoading(false);
      if (!response.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onRegisterSuccess) onRegisterSuccess();
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="right-section login-section">
      {success ? (
        <div className="register-success" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: 48, color: '#27ae60', marginBottom: 12 }}>✔️</div>
          <div style={{ fontSize: 20, color: '#27ae60', fontWeight: 600 }}>Registration successful!</div>
        </div>
      ) : (
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">Register</h2>
          <div className="login-form-row">
            <label htmlFor="register-name">Name</label>
            <input
              id="register-name"
              type="text"
              className="login-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="login-form-row">
            <label htmlFor="register-phone">Phone.no</label>
            <input
              id="register-phone"
              type="tel"
              className="login-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>
          <div className="login-form-row">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              className="login-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <div className="login-form-row">
            <label htmlFor="register-confirm">Confirm</label>
            <input
              id="register-confirm"
              type="password"
              className="login-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
          </div>
          <button
            type="submit"
            className="add-split-btn login-btn"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}
        </form>
      )}
    </div>
  );
}

export default Register; 