const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // CRITICAL: Listen to Cloud Port or 5000

// Middleware
app.use(cors()); // Allow requests from anywhere
app.use(express.json());

// Database Connection
const connectToMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};
connectToMongo();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/categories', require('./routes/categoryRoutes'));
// Health Check (For the Cloud to know we are alive)
app.get('/', (req, res) => {
  res.send("Expense Tracker Backend is Running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});