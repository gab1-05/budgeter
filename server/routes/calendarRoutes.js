const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const RecurringSchedule = require('../models/RecurringSchedule');

router.use(auth);

// Get calendar events for a date range
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

    const [transactions, recurring] = await Promise.all([
      Transaction.find({
        user: req.userId,
        date: { $gte: start, $lte: end }
      }).populate('category', 'name color icon').populate('account', 'name type').lean(),
      RecurringSchedule.find({
        user: req.userId,
        isActive: true,
        nextRunAt: { $gte: start, $lte: end }
      }).populate('account', 'name type').populate('category', 'name color icon').lean()
    ]);

    // Combine and format events
    const events = [
      ...transactions.map(tx => ({
        id: tx._id,
        type: 'transaction',
        title: tx.description || tx.category?.name || 'Transaction',
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        account: tx.account
      })),
      ...recurring.map(r => ({
        id: r._id,
        type: 'recurring',
        title: r.name,
        date: r.nextRunAt,
        amount: r.amount,
        type: r.type,
        category: r.category,
        frequency: r.frequency,
        isRecurring: true
      }))
    ];

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(events);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get events for a specific day
router.get('/day/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const [transactions, recurring] = await Promise.all([
      Transaction.find({
        user: req.userId,
        date: { $gte: start, $lte: end }
      }).populate('category', 'name color icon').populate('account', 'name type').lean(),
      RecurringSchedule.find({
        user: req.userId,
        isActive: true,
        nextRunAt: { $gte: start, $lte: end }
      }).populate('account', 'name type').populate('category', 'name color icon').lean()
    ]);

    res.json({ transactions, recurring });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;