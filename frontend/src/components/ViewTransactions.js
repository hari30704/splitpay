import React, { useState, useEffect } from 'react';
import './ViewTransactions.css';

function ViewTransactions({ onBackToMain }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Get user phone from localStorage (assuming it's stored after login)
  const userPhone = localStorage.getItem('userPhone');

  useEffect(() => {
    if (userPhone) {
      fetchTransactions();
    } else {
      setError('User not logged in');
      setLoading(false);
    }
  }, [userPhone]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/transactions/user/${userPhone}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const closeModal = () => {
    setSelectedTransaction(null);
  };

  if (loading) {
    return (
      <div className="view-transactions">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-transactions">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchTransactions} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-transactions">
      <div className="transactions-header">
        <div className="header-content">
          <button className="back-btn" onClick={onBackToMain}>
            ← Back to Split
          </button>
          <div className="header-text">
            <h1>Transaction History</h1>
            <p>Your past split payments and receipts</p>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="no-transactions">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No transactions yet</h3>
            <p>Start splitting bills with friends to see your transaction history here.</p>
          </div>
        </div>
      ) : (
        <div className="transactions-grid">
          {transactions.map((transaction) => (
            <div
              key={transaction._id}
              className="transaction-card"
              onClick={() => handleTransactionClick(transaction)}
            >
              <div className="transaction-header">
                <div className="transaction-info">
                  <h3>{transaction.groupDetails?.groupName || 'Unnamed Group'}</h3>
                  <p className="transaction-date">{formatDate(transaction.date)}</p>
                </div>
                <div className="transaction-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(transaction.status) }}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
              
              <div className="transaction-details">
                <div className="amount-info">
                  <span className="total-amount">
                    {formatCurrency(transaction.totalAmount)}
                  </span>
                  <span className="member-count">
                    {transaction.groupDetails?.members?.length || 0} members
                  </span>
                </div>
                
                <div className="products-preview">
                  <p className="products-title">Products:</p>
                  <div className="products-list">
                    {transaction.products?.slice(0, 3).map((product, index) => (
                      <span key={index} className="product-item">
                        {product.productName} - {formatCurrency(product.price)}
                      </span>
                    ))}
                    {transaction.products?.length > 3 && (
                      <span className="more-products">
                        +{transaction.products.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>Group Information</h3>
                <p><strong>Group Name:</strong> {selectedTransaction.groupDetails?.groupName || 'Unnamed Group'}</p>
                <p><strong>Date:</strong> {formatDate(selectedTransaction.date)}</p>
                <p><strong>Status:</strong> 
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedTransaction.status) }}>
                    {selectedTransaction.status}
                  </span>
                </p>
              </div>

              <div className="detail-section">
                <h3>Group Members</h3>
                <div className="members-list">
                  {selectedTransaction.groupDetails?.members?.map((member, index) => (
                    <div key={index} className="member-item">
                      <span className="member-name">{member.name}</span>
                      <span className="member-phone">{member.phone}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Products & Prices</h3>
                <div className="products-detail">
                  {selectedTransaction.products?.map((product, index) => (
                    <div key={index} className="product-detail-item">
                      <span className="product-name">{product.productName}</span>
                      <span className="product-price">{formatCurrency(product.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="total-section">
                  <strong>Total Amount: {formatCurrency(selectedTransaction.totalAmount)}</strong>
                </div>
              </div>

              <div className="detail-section">
                <h3>Price Allocation</h3>
                <div className="allocation-list">
                  {selectedTransaction.priceAllocation?.map((allocation, index) => (
                    <div key={index} className="allocation-item">
                      <div className="allocation-header">
                        <span className="person-name">{allocation.personName}</span>
                        <span className="allocated-amount">{formatCurrency(allocation.allocatedAmount)}</span>
                      </div>
                      <div className="allocated-products">
                        {allocation.products?.map((product, pIndex) => (
                          <span key={pIndex} className="allocated-product">
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewTransactions; 