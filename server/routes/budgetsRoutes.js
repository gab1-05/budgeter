const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');

router.use(auth);

// Get all budgets with progress
router.get('/', async (req, res) => {
  try {
    const { period } = req.query;
    const filter = { user: req.userId };
    if (period) filter.period = period;

    const budgets = await Budget.find(filter)
      .populate('category', 'name type color')
      .sort({ createdAt: -1 });

    // Calculate spent for each budget
    const now = new Date();
    const results = await Promise.all(budgets.map(async (budget) => {
      let startDate, endDate;
      if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (budget.period === 'quarterly') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      }

      const match = {
        user: req.userId,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      };
      if (budget.category) match.category = budget.category._id;

      const spent = await Transaction.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const spentAmount = spent[0]?.total || 0;
      const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
      const isOver = spentAmount > budget.amount;
      const isNear = percentage >= (budget.alertThreshold || 80);

      return {
        ...budget.toObject(),
        spent: spentAmount,
        remaining: Math.max(0, budget.amount - spentAmount),
        percentage: Math.round(percentage * 100) / 100,
        isOver,
        isNear
      };
    }));

    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get budget summary (all categories spending vs budgets)
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all expenses this month grouped by category
    const expenses = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get budgets for this month
    const budgets = await Budget.find({
      user: req.userId,
      period: 'monthly',
      startDate: { $lte: endOfMonth },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: startOfMonth } }]
    }).populate('category', 'name type color');

    // Merge
    const categorySpending = {};
    for (const exp of expenses) {
      categorySpending[exp._id?.toString()] = { spent: exp.total, count: exp.count };
    }

    const summary = budgets.map(b => {
      const catId = b.category?._id?.toString();
      const spent = categorySpending[catId]?.spent || 0;
      return {
        budget: b,
        spent,
        remaining: Math.max(0, b.amount - spent),
        percentage: b.amount > 0 ? Math.round((spent / b.amount) * 10000) / 100 : 0,
        transactionCount: categorySpending[catId]?.count || 0
      };
    });

    // Categories with spending but no budget
    const uncategorized = expenses.filter(e => {
      const catId = e._id?.toString();
      return catId && !budgets.some(b => b.category?._id?.toString() === catId);
    });

    for (const exp of uncategorized) {
      const cat = await Category.findById(exp._id);
      summary.push({
        budget: null,
        category: cat,
        spent: exp.total,
        remaining: 0,
        percentage: 0,
        transactionCount: exp.count,
        hasNoBudget: true
      });
    }

    res.json(summary);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get single budget
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.userId })
      .populate('category', 'name type color');
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create budget
router.post('/', async (req, res) => {
  try {
    const { name, category, amount, period, startDate, endDate, alertThreshold } = req.body;
    if (!name || !amount || !startDate) return res.status(400).json({ message: 'Missing required fields' });

    const budget = await Budget.create({
      user: req.userId,
      name,
      category,
      amount,
      period: period || 'monthly',
      startDate,
      endDate,
      alertThreshold: alertThreshold || 80
    });
    await budget.populate('category', 'name type color');
    res.status(201).json(budget);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Update budget
router.put('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    ).populate('category', 'name type color');
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;