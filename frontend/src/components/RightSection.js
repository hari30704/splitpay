import React, { useState } from "react";
import "../App.css";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function RightSection({
  showMemberForm,
  numMembers,
  inputValue,
  handleAddSplit,
  handleNumMembersSubmit,
  setInputValue,
  members,
  currentMember,
  handleMemberInputChange,
  handleAddMember,
  showAvatarsWithNames,
  avatarStackStep,
  showBillUpload,
  user
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [parsedResult, setParsedResult] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  // assignments: { [productIdx]: [memberName, ...] }
  const [assignments, setAssignments] = useState({});
  const [memberTotals, setMemberTotals] = useState(null);
  const [transactionSaved, setTransactionSaved] = useState(false);

  // Handle bill upload POST to backend
  const handleBillUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadResult(null);
    setUploadError(null);
    setParsedResult(null);
    const file = e.target.elements.bill.files[0];
    if (!file) {
      setUploadError("No file selected.");
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append("bill", file);
    try {
      const response = await fetch("http://localhost:5000/analyze-receipt", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload and analyze bill.");
      }
      const data = await response.json();
      setUploadResult(data.raw);
      // Try to parse as JSON
      try {
        // First try to find JSON array format (most common)
        const jsonStart = data.raw.indexOf("[");
        const jsonEnd = data.raw.lastIndexOf("]");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = data.raw.substring(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonString);
          setParsedResult(parsed);
          setShopInfo({
            shopName: "Receipt Analysis",
            billName: "Receipt"
          });
          // Reset assignments
          setAssignments({});
        } else {
          // Try object format
          const jsonStart = data.raw.indexOf("{");
          const jsonEnd = data.raw.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = data.raw.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonString);
            setParsedResult(parsed.products || []);
            setShopInfo({
              shopName: parsed.shopName || "Receipt Analysis",
              billName: parsed.billName || "Receipt"
            });
            // Reset assignments
            setAssignments({});
          } else {
            // If no JSON found, show raw result
            setParsedResult(null);
            setShopInfo(null);
          }
        }
      } catch (err) {
        console.error("JSON parsing error:", err);
        setParsedResult(null);
        setShopInfo(null);
      }
    } catch (err) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Add a new assignment row for a product
  const handleAddAssignmentRow = (productIdx) => {
    setAssignments((prev) => {
      const current = prev[productIdx] || [];
      return { ...prev, [productIdx]: [...current, ""] };
    });
  };

  // Handle assignment change for a specific row
  const handleAssignmentChange = (productIdx, rowIdx, memberName) => {
    setAssignments((prev) => {
      const arr = prev[productIdx] ? [...prev[productIdx]] : [];
      arr[rowIdx] = memberName;
      return { ...prev, [productIdx]: arr };
    });
  };

  // Remove duplicate members in dropdown
  const getAvailableMembers = (productIdx, currentAssignments) => {
    return members.filter(
      (m) => !currentAssignments.includes(m.name)
    );
  };

  // Add the remove handler function:
  const handleRemoveAssignmentRow = (productIdx, rowIdx) => {
    setAssignments((prev) => {
      const arr = prev[productIdx] ? [...prev[productIdx]] : [];
      arr.splice(rowIdx, 1);
      return { ...prev, [productIdx]: arr.length ? arr : [""] };
    });
  };

  // Handle uploading a new receipt
  const handleUploadNew = () => {
    setParsedResult(null);
    setShopInfo(null);
    setUploadResult(null);
    setUploadError(null);
    setAssignments({});
    setMemberTotals(null);
    setTransactionSaved(false);
  };

  // Check if all products have at least one member assigned
  const allAssigned = parsedResult && parsedResult.every((_, pIdx) => {
    const assigned = assignments[pIdx] || [];
    return assigned.filter(Boolean).length > 0;
  });

  // Calculate totals for each member and save transaction
  const handleCalculate = async () => {
    if (!parsedResult) return;
    const totals = {};
    parsedResult.forEach((item, pIdx) => {
      let price = 0;
      // Try to extract number from price string (e.g., '₹100.00')
      const match = (item.price || '').replace(/,/g, '').match(/([\d.]+)/);
      if (match) price = parseFloat(match[1]);
      const assigned = (assignments[pIdx] || []).filter(Boolean);
      if (assigned.length > 0 && price > 0) {
        const share = price / assigned.length;
        assigned.forEach(member => {
          totals[member] = (totals[member] || 0) + share;
        });
      }
    });
    setMemberTotals(totals);

    // Save transaction to database
    try {
      // Prepare transaction data
      const totalAmount = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
      
      // Create price allocation array
      const priceAllocation = Object.entries(totals).map(([memberName, allocatedAmount]) => {
        const member = members.find(m => m.name === memberName);
        return {
          personName: memberName,
          personPhone: member?.phone || '',
          allocatedAmount: allocatedAmount,
          products: [] // Will be populated below
        };
      });

      // Add products to each person's allocation
      parsedResult.forEach((item, pIdx) => {
        const assigned = (assignments[pIdx] || []).filter(Boolean);
        if (assigned.length > 0) {
          assigned.forEach(memberName => {
            const allocation = priceAllocation.find(a => a.personName === memberName);
            if (allocation) {
              allocation.products.push(item.product);
            }
          });
        }
      });

      const transactionData = {
        userPhone: user?.phone || localStorage.getItem('userPhone'),
        groupDetails: {
          groupName: shopInfo?.shopName || 'Split Group',
          members: members
        },
        products: parsedResult.map(item => ({
          productName: item.product,
          price: parseFloat((item.price || '').replace(/,/g, '').match(/([\d.]+)/)?.[1] || 0)
        })),
        priceAllocation: priceAllocation,
        totalAmount: totalAmount
      };

      // Save to database
      const response = await fetch('http://localhost:5000/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });

      if (response.ok) {
        console.log('Transaction saved successfully!');
        setTransactionSaved(true);
        // Hide success message after 3 seconds
        setTimeout(() => setTransactionSaved(false), 3000);
      } else {
        console.error('Failed to save transaction');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  // Show member input form if not all members are added
  if (
    showMemberForm &&
    numMembers > 0 &&
    members.length < numMembers
  ) {
    return (
      <div className="right-section">
        <form className="member-form" onSubmit={handleAddMember}>
          <label>Enter details for member {members.length + 1}:</label>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={currentMember.name}
            onChange={handleMemberInputChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={currentMember.phone}
            onChange={handleMemberInputChange}
            required
          />
          <button type="submit">Add Member</button>
        </form>
        {members.length > 0 && (
          <div className="members-list">
            {members.map((member, idx) => (
              <div className="member-avatar-row" key={idx}>
                <div className="member-avatar">
                  {getInitials(member.name)}
                </div>
                <span className="member-name">{member.name}{user && member.phone === user.phone ? ' (me)' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Animation: show avatars with names (fade in)
  if (showAvatarsWithNames) {
    return (
      <div className="right-section">
        <div className="avatars-row fade-in">
          {members.map((member, idx) => (
            <div className="avatar-with-name" key={idx}>
              <div className="member-avatar large-avatar">
                {getInitials(member.name)}
              </div>
              <span className="member-name show-name">{member.name}{user && member.phone === user.phone ? ' (me)' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Stepwise stacking animation and bill upload
  if (avatarStackStep >= 0 && avatarStackStep <= members.length) {
    return (
      <div className="right-section">
        {/* Stacked avatars at top-left */}
        <div className="stacked-avatars-container">
          {members.slice(0, avatarStackStep).map((member, idx) => (
            <div
              className="member-avatar overlap-avatar stacked"
              key={idx}
              style={{ left: `${idx * 32}px`, zIndex: members.length - idx }}
            >
              {getInitials(member.name)}
            </div>
          ))}
        </div>
        {/* Remaining avatars/names in row, with fade-out for current step */}
        {avatarStackStep < members.length && (
          <div className="avatars-row stacking-row">
            {members.slice(avatarStackStep).map((member, idx) => {
              const globalIdx = avatarStackStep + idx;
              const isFading = idx === 0; // Only the first in the row is fading
              return (
                <div className="avatar-with-name" key={globalIdx}>
                  <div className={`member-avatar large-avatar${isFading ? " fade-avatar" : ""}`}>
                    {getInitials(member.name)}
                  </div>
                  <span className={`member-name show-name${isFading ? " fade-name" : ""}`}>{member.name}{user && member.phone === user.phone ? ' (me)' : ''}</span>
                </div>
              );
            })}
          </div>
        )}
        {/* Instructional text above the bill upload container */}
        {showBillUpload && !parsedResult && (
          <div style={{ 
            marginBottom: '1.5rem', 
            textAlign: 'center',
            color: '#282828',
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#FF7F50' }}>
              📷 Upload your receipt or bill image to get started
            </p>
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
              Supported formats: JPG, PNG, PDF
            </p>
          </div>
        )}
        
        {/* Bill upload container always shown when showBillUpload is true */}
        {showBillUpload && (
          <div className="bill-upload-container fade-in">
            {/* Upload New button at the top right when results are available */}
            {parsedResult && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <button 
                  className="upload-new-btn" 
                  onClick={handleUploadNew}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: '#ff7f50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Upload New
                </button>
              </div>
            )}
            
            {/* Receipt Header */}
            {parsedResult && parsedResult.length > 0 && (
              <div className="receipt-header" style={{ 
                marginBottom: '2rem', 
                padding: '1.5rem', 
                backgroundColor: '#ffffff', 
                borderRadius: '12px',
                border: '2px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  textAlign: 'center', 
                  borderBottom: '2px solid #ff7f50', 
                  paddingBottom: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h2 style={{ 
                    margin: '0 0 0.5rem 0', 
                    color: '#333', 
                    fontSize: '1.5rem',
                    fontWeight: '600'
                  }}>
                    📋 Receipt Details
                  </h2>
                  <p style={{ 
                    margin: '0', 
                    color: '#666', 
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}>
                    {shopInfo?.shopName || 'Receipt Analysis'}
                  </p>
                </div>
                
                {/* Products List */}
                <div className="products-list" style={{ marginTop: '1rem' }}>
                  <h4 style={{ 
                    margin: '0 0 1rem 0', 
                    color: '#333', 
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '0.5rem'
                  }}>
                    🛒 Products Found
                  </h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {parsedResult.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        margin: '0.5rem 0',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ 
                            fontWeight: '500', 
                            color: '#333',
                            fontSize: '1rem'
                          }}>
                            {item.product}
                          </span>
                        </div>
                        <div style={{ 
                          textAlign: 'right',
                          minWidth: '80px'
                        }}>
                          <span style={{ 
                            fontWeight: '600', 
                            color: '#ff7f50',
                            fontSize: '1rem'
                          }}>
                            {item.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Upload form - only show when no results */}
            {!parsedResult && (
              <form onSubmit={handleBillUpload}>
                <input type="file" name="bill" accept="image/*,application/pdf" required />
                <button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</button>
              </form>
            )}
            
            {parsedResult ? (
              <div className="upload-result">
                {/* Member Assignment Section */}
                <div className="assignment-section" style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '2px solid #e9ecef',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{
                    margin: '0 0 1.5rem 0',
                    color: '#333',
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    borderBottom: '2px solid #ff7f50',
                    paddingBottom: '0.75rem'
                  }}>
                    👥 Assign Members to Products
                  </h3>
                  
                  <div className="product-list">
                    {parsedResult.map((item, pIdx) => {
                      const assigned = assignments[pIdx] || [""];
                      const canAdd = assigned.filter(Boolean).length < members.length;
                      return (
                        <div className="product-assign-row" key={pIdx} style={{
                          marginBottom: '1.5rem',
                          padding: '1rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e9ecef'
                        }}>
                          <div className="product-info" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '1px solid #dee2e6'
                          }}>
                            <span className="product-name" style={{
                              fontWeight: '600',
                              color: '#333',
                              fontSize: '1.1rem'
                            }}>
                              {item.product}
                            </span>
                            <span className="product-price" style={{
                              fontWeight: '600',
                              color: '#ff7f50',
                              fontSize: '1.1rem'
                            }}>
                              {item.price}
                            </span>
                          </div>
                          <div className="assign-members-row">
                            <div className="assign-members-col">
                              {assigned.map((member, aIdx) => (
                                <div className="assign-member-wrapper" key={aIdx} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '0.5rem',
                                  gap: '0.5rem'
                                }}>
                                  <select
                                    className="member-select"
                                    value={member || ""}
                                    onChange={e => handleAssignmentChange(pIdx, aIdx, e.target.value)}
                                    style={{
                                      flex: 1,
                                      padding: '0.5rem',
                                      borderRadius: '6px',
                                      border: '1px solid #ced4da',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    <option value="" disabled>Select member</option>
                                    {getAvailableMembers(pIdx, assigned.filter((_, i) => i !== aIdx)).map((m, mIdx) => (
                                      <option key={mIdx} value={m.name}>{m.name}{user && m.phone === user.phone ? ' (me)' : ''}</option>
                                    ))}
                                  </select>
                                  {assigned.length > 1 && (
                                    <button
                                      type="button"
                                      className="remove-member-btn"
                                      onClick={() => handleRemoveAssignmentRow(pIdx, aIdx)}
                                      title="Remove this member"
                                      style={{
                                        padding: '0.5rem 0.75rem',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {Boolean(assigned[assigned.length - 1]) && canAdd && (
                              <button
                                type="button"
                                className="add-member-btn"
                                onClick={() => handleAddAssignmentRow(pIdx)}
                                title="Add another member"
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: '#ff7f50',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  cursor: 'pointer',
                                  fontSize: '1.2rem',
                                  fontWeight: 'bold',
                                  marginTop: '0.75rem',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 6px rgba(255,127,80,0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '40px',
                                  height: '40px',
                                  minWidth: '40px'
                                }}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button
                    className="calculate-btn"
                    onClick={handleCalculate}
                    disabled={!allAssigned}
                    style={{ 
                      padding: '1rem 2.5rem', 
                      fontSize: '1.2rem', 
                      fontWeight: '600',
                      backgroundColor: allAssigned ? '#ff7f50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: allAssigned ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      boxShadow: allAssigned ? '0 4px 12px rgba(255,127,80,0.3)' : 'none'
                    }}
                  >
                    💰 Calculate Split
                  </button>
                  {transactionSaved && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      borderRadius: '8px',
                      border: '1px solid #c3e6cb',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      ✅ Transaction saved successfully! You can view it in "View Transactions"
                    </div>
                  )}
                </div>
                
                {memberTotals && (
                  <div className="member-totals-list" style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <h4 style={{
                      margin: '0 0 1.5rem 0',
                      color: '#333',
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      textAlign: 'center',
                      borderBottom: '2px solid #28a745',
                      paddingBottom: '0.75rem'
                    }}>
                      💳 Amount to Pay
                    </h4>
                    {Object.entries(memberTotals).map(([member, total]) => (
                      <div className="member-total-row" key={member} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        margin: '0.5rem 0',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}>
                        <span className="member-total-name" style={{
                          fontWeight: '600',
                          color: '#333',
                          fontSize: '1.1rem'
                        }}>
                          {member}{user && member === user.name ? ' (me)' : ''}
                        </span>
                        <span className="member-total-price" style={{
                          fontWeight: '700',
                          color: '#28a745',
                          fontSize: '1.2rem'
                        }}>
                          ₹{total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : uploadResult ? (
              <div className="upload-result">
                <h4>Analysis Result (Raw):</h4>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{uploadResult}</pre>
              </div>
            ) : null}
            {uploadError && <div className="upload-error">{uploadError}</div>}
          </div>
        )}
      </div>
    );
  }

  // Default: show Add Split button or number of members form
  return (
    <div className="right-section">
      {!showMemberForm && (
        <button className="add-split-btn" onClick={handleAddSplit}>
          Add Split
        </button>
      )}
      {showMemberForm && numMembers === 0 && (
        <form className="num-members-form" onSubmit={handleNumMembersSubmit}>
          <label htmlFor="numMembers">Number of Members:</label>
          <input
            id="numMembers"
            type="number"
            min="1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            required
          />
          <button type="submit">Next</button>
        </form>
      )}
    </div>
  );
}

export default RightSection; 