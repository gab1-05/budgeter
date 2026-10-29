const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const mongoose = require('mongoose');

router.use(auth);

// Get all transactions with filters and pagination
router.get('/', async (req, res) => {
  try {
    const filter = { user: req.userId };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Date range
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    } else if (req.query.month) {
      const [y, m] = req.query.month.split('-');
      const start = new Date(`${y}-${m}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    // Other filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.account) filter.account = req.query.account;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { merchant: { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .populate('category', 'name type color icon')
        .populate('account', 'name type')
        .populate('fromAccount', 'name')
        .populate('toAccount', 'name')
        .populate('recurringScheduleId', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      transactions: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get transaction summary for period
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { user: req.userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [income, expense, transfers] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...filter, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { ...filter, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { ...filter, type: 'transfer' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    // By category
    const byCategory = await Transaction.aggregate([
      { $match: { ...filter, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Populate category names
    const catIds = byCategory.map(c => c._id).filter(Boolean);
    const categories = await Category.find({ _id: { $in: catIds } }).select('name color');
    const catMap = Object.fromEntries(categories.map(c => [c._id.toString(), c]));

    res.json({
      income: income[0]?.total || 0,
      expense: expense[0]?.total || 0,
      transfers: transfers[0]?.total || 0,
      net: (income[0]?.total || 0) - (expense[0]?.total || 0),
      incomeCount: income[0]?.count || 0,
      expenseCount: expense[0]?.count || 0,
      byCategory: byCategory.map(c => ({
        category: catMap[c._id?.toString()] || { name: 'Uncategorized', color: '#888' },
        total: c.total,
        count: c.count
      }))
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, user: req.userId })
      .populate('category', 'name type color icon')
      .populate('account', 'name type')
      .populate('fromAccount', 'name')
      .populate('toAccount', 'name')
      .populate('recurringScheduleId', 'name');
    if (!tx) return res.status(404).json({ message: 'Not found' });
    res.json(tx);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Helper: update account balance
async function updateAccountBalance(accountId, amountChange) {
  await Account.findByIdAndUpdate(accountId, { $inc: { balance: amountChange } });
}

// Create transaction (without MongoDB transactions)
router.post('/', async (req, res) => {
  try {
    const {
      type, account, category, amount, currency,
      description, merchant, paymentMethod, notes,
      date, fromAccount, toAccount, recurringScheduleId, status
    } = req.body;

    if (!type || !account || !amount) {
      return res.status(400).json({ message: 'Type, account, and amount are required' });
    }

    // Verify account ownership
    const acc = await Account.findOne({ _id: account, user: req.userId });
    if (!acc) return res.status(400).json({ message: 'Invalid account' });

    const tx = await Transaction.create({
      user: req.userId,
      type,
      account,
      category,
      amount,
      currency: currency || 'USD',
      description,
      merchant,
      paymentMethod: paymentMethod || 'other',
      notes,
      date: date ? new Date(date) : new Date(),
      fromAccount,
      toAccount,
      recurringScheduleId,
      status: status || 'completed'
    });

    // Update account balance
    if (type === 'income') {
      await updateAccountBalance(account, amount);
    } else if (type === 'expense') {
      await updateAccountBalance(account, -amount);
    } else if (type === 'transfer') {
      if (!fromAccount || !toAccount) {
        throw new Error('Transfer requires fromAccount and toAccount');
      }
      await updateAccountBalance(fromAccount, -amount);
      await updateAccountBalance(toAccount, amount);
    }

    const populated = await Transaction.findById(tx._id)
      .populate('category', 'name type color icon')
      .populate('account', 'name type')
      .populate('fromAccount', 'name')
      .populate('toAccount', 'name');

    res.status(201).json(populated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const oldTx = await Transaction.findOne({ _id: req.params.id, user: req.userId });
    if (!oldTx) {
      return res.status(404).json({ message: 'Not found' });
    }

    const update = { ...req.body };
    // Prevent changing certain fields
    delete update.user;
    delete update.importHash;

    // Handle balance changes if amount/type/account changed
    const amountChanged = update.amount !== undefined && update.amount !== oldTx.amount;
    const typeChanged = update.type && update.type !== oldTx.type;
    const accountChanged = update.account && update.account.toString() !== oldTx.account.toString();

    if (amountChanged || typeChanged || accountChanged) {
      // Reverse old transaction effect
      if (oldTx.type === 'income') {
        await updateAccountBalance(oldTx.account, -oldTx.amount);
      } else if (oldTx.type === 'expense') {
        await updateAccountBalance(oldTx.account, oldTx.amount);
      } else if (oldTx.type === 'transfer') {
        await updateAccountBalance(oldTx.fromAccount, oldTx.amount);
        await updateAccountBalance(oldTx.toAccount, -oldTx.amount);
      }

      // Apply new transaction effect
      const newType = update.type || oldTx.type;
      const newAmount = update.amount !== undefined ? update.amount : oldTx.amount;
      const newAccount = update.account || oldTx.account;

      if (newType === 'income') {
        await updateAccountBalance(newAccount, newAmount);
      } else if (newType === 'expense') {
        await updateAccountBalance(newAccount, -newAmount);
      } else if (newType === 'transfer') {
        const from = update.fromAccount || oldTx.fromAccount;
        const to = update.toAccount || oldTx.toAccount;
        await updateAccountBalance(from, -newAmount);
        await updateAccountBalance(to, newAmount);
      }
    }

    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      update,
      { new: true }
    ).populate('category', 'name type color icon')
      .populate('account', 'name type')
      .populate('fromAccount', 'name')
      .populate('toAccount', 'name');

    res.json(tx);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, user: req.userId });
    if (!tx) {
      return res.status(404).json({ message: 'Not found' });
    }

    // Reverse balance effect
    if (tx.type === 'income') {
      await updateAccountBalance(tx.account, -tx.amount);
    } else if (tx.type === 'expense') {
      await updateAccountBalance(tx.account, tx.amount);
    } else if (tx.type === 'transfer') {
      await updateAccountBalance(tx.fromAccount, tx.amount);
      await updateAccountBalance(tx.toAccount, -tx.amount);
    }

    await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });

    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;