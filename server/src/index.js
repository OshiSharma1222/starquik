const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stellarRoutes = require('./routes/stellar');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stellar', stellarRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', network: process.env.STELLAR_NETWORK });
});

app.listen(PORT, () => {
  console.log(`StarQuik Server running on port ${PORT}`);
  console.log(` Connected to Stellar ${process.env.STELLAR_NETWORK}`);
});
