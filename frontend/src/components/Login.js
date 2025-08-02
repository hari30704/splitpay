import React, { useState } from "react";
import "../App.css";

function Login({ onLogin, onShowRegister }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });
      const data = await response.json();
      setLoading(false);
      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      if (onLogin) onLogin(data); // Pass user data
    } catch (err) {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="right-section login-section">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Login</h2>
        <div className="login-form-row">
          <label htmlFor="login-phone">Phone.no</label>
          <input
            id="login-phone"
            type="tel"
            className="login-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
          />
        </div>
        <div className="login-form-row">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="login-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          className="add-split-btn login-btn"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}
      </form>
      <div className="login-register-link" style={{ marginTop: 18, fontSize: '1rem' }}>
        Don't have an account?{' '}
        <span
          className="register-link"
          style={{ color: '#FF7F50', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={onShowRegister}
        >
          Register
        </span>
      </div>
    </div>
  );
}

export default Login; 