import React from "react";
import "../App.css";

function LeftSection() {
  return (
    <div className="left-section">
      <div className="illustration-quote-row">
        <img
          src="/one.png"
          alt="SplitPay Illustration"
          className="illustration"
        />
        <div className="quote">
          <h2>"Splitting bills, multiplying happiness!"</h2>
          <p>Make group payments effortless with SplitPay.</p>
        </div>
      </div>
    </div>
  );
}

export default LeftSection; 