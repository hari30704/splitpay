const express = require('express');
const router = express.Router();
const { TransactionModel } = require('../models/Transaction');

// Initialize transaction model
let transactionModel;

// Middleware to initialize transaction model
const initializeTransactionModel = (req, res, next) => {
  if (!transactionModel) {
    transactionModel = new TransactionModel(req.app.locals.db);
  }
  next();
};

// Apply middleware to all routes
router.use(initializeTransactionModel);

// Create a new transaction
router.post('/create', async (req, res) => {
  try {
    const {
      userPhone,
      groupDetails,
      products,
      priceAllocation,
      totalAmount,
      receiptImage
    } = req.body;

    // Validate required fields
    if (!userPhone || !groupDetails || !products || !priceAllocation || !totalAmount) {
      return res.status(400).json({
        error: 'Missing required fields: userPhone, groupDetails, products, priceAllocation, totalAmount'
      });
    }

    const transactionData = {
      userPhone,
      groupDetails,
      products,
      priceAllocation,
      totalAmount,
      receiptImage: receiptImage || null,
      status: 'pending'
    };

    const result = await transactionModel.createTransaction(transactionData);
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transactionId: result.insertedId
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get all transactions for a user
router.get('/user/:userPhone', async (req, res) => {
  try {
    const { userPhone } = req.params;
    
    if (!userPhone) {
      return res.status(400).json({
        error: 'User phone number is required'
      });
    }

    const transactions = await transactionModel.getUserTransactions(userPhone);
    
    res.json({
      success: true,
      transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get a specific transaction by ID
router.get('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }

    const transaction = await transactionModel.getTransactionById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Update transaction status
router.patch('/:transactionId/status', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status } = req.body;
    
    if (!transactionId || !status) {
      return res.status(400).json({
        error: 'Transaction ID and status are required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: pending, completed, cancelled'
      });
    }

    const result = await transactionModel.updateTransactionStatus(transactionId, status);
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction status updated successfully'
    });

  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete a transaction
router.delete('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }

    const result = await transactionModel.deleteTransaction(transactionId);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router; 