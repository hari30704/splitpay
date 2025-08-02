const { MongoClient } = require('mongodb');

// Transaction Schema Structure
const transactionSchema = {
  // Primary key - user's phone number
  userPhone: {
    type: String,
    required: true,
    index: true
  },
  
  // Group details
  groupDetails: {
    groupName: String,
    members: [
      {
        name: String,
        phone: String
      }
    ]
  },
  
  // Products from receipt
  products: [
    {
      productName: String,
      price: Number
    }
  ],
  
  // Price allocation to each person
  priceAllocation: [
    {
      personName: String,
      personPhone: String,
      allocatedAmount: Number,
      products: [String] // Array of product names assigned to this person
    }
  ],
  
  // Transaction metadata
  totalAmount: Number,
  date: {
    type: Date,
    default: Date.now
  },
  
  // Receipt image (optional)
  receiptImage: String, // Base64 encoded image
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  }
};

// Helper functions for transaction operations
class TransactionModel {
  constructor(db) {
    this.collection = db.collection('transactions');
  }

  // Create a new transaction
  async createTransaction(transactionData) {
    try {
      const result = await this.collection.insertOne({
        ...transactionData,
        date: new Date()
      });
      return result;
    } catch (error) {
      throw new Error(`Error creating transaction: ${error.message}`);
    }
  }

  // Get all transactions for a user
  async getUserTransactions(userPhone) {
    try {
      const transactions = await this.collection
        .find({ userPhone })
        .sort({ date: -1 })
        .toArray();
      return transactions;
    } catch (error) {
      throw new Error(`Error fetching user transactions: ${error.message}`);
    }
  }

  // Get a specific transaction by ID
  async getTransactionById(transactionId) {
    try {
      const transaction = await this.collection.findOne({ _id: transactionId });
      return transaction;
    } catch (error) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }
  }

  // Update transaction status
  async updateTransactionStatus(transactionId, status) {
    try {
      const result = await this.collection.updateOne(
        { _id: transactionId },
        { $set: { status } }
      );
      return result;
    } catch (error) {
      throw new Error(`Error updating transaction status: ${error.message}`);
    }
  }

  // Delete a transaction
  async deleteTransaction(transactionId) {
    try {
      const result = await this.collection.deleteOne({ _id: transactionId });
      return result;
    } catch (error) {
      throw new Error(`Error deleting transaction: ${error.message}`);
    }
  }
}

module.exports = { TransactionModel, transactionSchema }; 