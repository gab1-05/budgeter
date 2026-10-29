const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

router.use(auth);

// Get all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get default account
router.get('/default', async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.userId, isDefault: true });
    if (!account) {
      const first = await Account.findOne({ user: req.userId });
      return res.json(first);
    }
    res.json(account);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get account with balance calculated from transactions
router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.userId });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create account
router.post('/', async (req, res) => {
  try {
    const { name, type, balance, currency, isDefault } = req.body;
    if (!name || !type) return res.status(400).json({ message: 'Name and type are required' });

    // If setting as default, unset others
    if (isDefault) {
      await Account.updateMany({ user: req.userId }, { isDefault: false });
    }

    const account = await Account.create({
      user: req.userId,
      name,
      type,
      balance: balance || 0,
      currency: currency || 'USD',
      isDefault: isDefault || false
    });
    res.status(201).json(account);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Account name already exists' });
    res.status(400).json({ message: e.message });
  }
});

// Update account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, balance, currency, isDefault } = req.body;
    if (isDefault) {
      await Account.updateMany({ user: req.userId }, { isDefault: false });
    }
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { name, type, balance, currency, isDefault },
      { new: true }
    );
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  try {
    // Check if account has transactions
    const txCount = await Transaction.countDocuments({ account: req.params.id, user: req.userId });
    if (txCount > 0) {
      return res.status(400).json({ message: 'Cannot delete account with existing transactions' });
    }
    await Account.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;