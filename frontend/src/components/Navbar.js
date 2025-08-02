import React from "react";
import "../App.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">SplitPay</div>
      <ul className="navbar-links">
        <li>View Transactions</li>
        <li>About Us</li>
        <li>Contact Us</li>
      </ul>
    </nav>
  );
}

export default Navbar; 