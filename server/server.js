const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expenseTracker';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/categories', require('./routes/categoriesRoutes'));
app.use('/api/accounts', require('./routes/accountsRoutes'));
app.use('/api/recurring', require('./routes/recurringRoutes'));
app.use('/api/budgets', require('./routes/budgetsRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));
app.use('/api/safe-to-spend', require('./routes/safeToSpendRoutes'));
app.use('/api/import-export', require('./routes/importExportRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));

app.get('/', (req, res) => res.send('Expense Tracker API'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));