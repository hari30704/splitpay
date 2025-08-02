import React, { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import LeftSection from "./components/LeftSection";
import RightSection from "./components/RightSection";
import Login from "./components/Login";
import Register from "./components/Register";
import ViewTransactions from "./components/ViewTransactions";

function App() {
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [numMembers, setNumMembers] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [members, setMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState({ name: "", phone: "" });
  const [showAvatarsWithNames, setShowAvatarsWithNames] = useState(false);
  const [avatarStackStep, setAvatarStackStep] = useState(-1); // -1: not started, 0+: stacking
  const [showBillUpload, setShowBillUpload] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'transactions'

  useEffect(() => {
    if (numMembers > 0 && members.length === numMembers) {
      setShowAvatarsWithNames(true);
      setAvatarStackStep(-1);
      setShowBillUpload(false);
      const timer1 = setTimeout(() => {
        setShowAvatarsWithNames(false);
        setAvatarStackStep(0);
      }, 1000);
      return () => clearTimeout(timer1);
    }
  }, [members, numMembers]);

  useEffect(() => {
    if (avatarStackStep >= 0 && avatarStackStep < members.length) {
      const timer = setTimeout(() => {
        setAvatarStackStep((step) => step + 1);
      }, 600);
      return () => clearTimeout(timer);
    } else if (avatarStackStep === members.length) {
      const timer = setTimeout(() => {
        setShowBillUpload(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [avatarStackStep, members.length]);

  const handleAddSplit = () => {
    setShowMemberForm(true);
    // If not already added, add the logged-in user as the first member
    setMembers([{ name: user?.name || '', phone: user?.phone || '' }]);
  };

  const handleNumMembersSubmit = (e) => {
    e.preventDefault();
    if (Number(inputValue) > 0) {
      // Always add 1 for the user
      setNumMembers(Number(inputValue) + 1);
      // If not already added, add the logged-in user as the first member
      setMembers([{ name: user?.name || '', phone: user?.phone || '' }]);
    }
  };

  const handleMemberInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMember((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (currentMember.name && currentMember.phone) {
      setMembers((prev) => [...prev, currentMember]);
      setCurrentMember({ name: "", phone: "" });
    }
  };

  const handleBillUpload = (e) => {
    alert("Bill uploaded!");
  };

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
    setLoggedIn(true);
  };

  // Handle register navigation
  const handleShowRegister = () => setShowRegister(true);
  const handleRegisterSuccess = () => setShowRegister(false);

  // Handle view transactions
  const handleViewTransactions = () => {
    setCurrentView('transactions');
  };

  // Handle back to main view
  const handleBackToMain = () => {
    setCurrentView('main');
  };

  if (!loggedIn) {
    if (showRegister) {
      return <Register onRegisterSuccess={handleRegisterSuccess} />;
    }
    return <Login onLogin={handleLogin} onShowRegister={handleShowRegister} />;
  }

  return (
    <div className="app-container">
      <Navbar onViewTransactions={handleViewTransactions} />
      {currentView === 'transactions' ? (
        <ViewTransactions onBackToMain={handleBackToMain} />
      ) : (
        <div className="main-content">
          <LeftSection />
          <RightSection
            showMemberForm={showMemberForm}
            numMembers={numMembers}
            inputValue={inputValue}
            handleAddSplit={handleAddSplit}
            handleNumMembersSubmit={handleNumMembersSubmit}
            setInputValue={setInputValue}
            members={members}
            currentMember={currentMember}
            handleMemberInputChange={handleMemberInputChange}
            handleAddMember={handleAddMember}
            showAvatarsWithNames={showAvatarsWithNames}
            avatarStackStep={avatarStackStep}
            showBillUpload={showBillUpload}
            handleBillUpload={handleBillUpload}
            user={user}
          />
        </div>
      )}
    </div>
  );
}

export default App;
