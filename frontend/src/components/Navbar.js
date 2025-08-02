import React from "react";
import "../App.css";

function Navbar({ onViewTransactions }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">SplitPay</div>
      <ul className="navbar-links">
        <li onClick={onViewTransactions} style={{ cursor: 'pointer' }}>View Transactions</li>
        <li>About Us</li>
        <li>Contact Us</li>
      </ul>
    </nav>
  );
}

export default Navbar; 