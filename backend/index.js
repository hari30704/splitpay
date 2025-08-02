const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MongoClient } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Enable CORS for all origins (development)
app.use(express.json()); // For parsing JSON bodies

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// MongoDB setup
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'splitpay';
let db;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Multer setup for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Helper: convert buffer to base64
function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

// Login endpoint
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required.' });
  }
  try {
    const user = await db.collection('login').findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    // Don't send password back
    const { password: pw, ...userData } = user;
    res.json(userData);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Register endpoint
app.post('/register', async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Name, phone, and password are required.' });
  }
  try {
    const existing = await db.collection('login').findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered.' });
    }
    await db.collection('login').insertOne({ name, phone, password });
    res.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to analyze a receipt from uploaded file
app.post('/analyze-receipt', upload.single('bill'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const mimeType = req.file.mimetype;
  const base64Image = bufferToBase64(req.file.buffer);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      {
        text: `Extract all product names and their prices from this receipt. Return as JSON like:
[
  { "product": "Item name", "price": "₹amount" }
]`,
      },
    ]);

    const response = await result.response;
    const text = await response.text();

    res.json({ raw: text });
    console.log(text);
  } catch (err) {
    console.error("GENAI ERROR:", err);
    res.status(500).json({ error: err.message || 'Failed to process receipt image.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
