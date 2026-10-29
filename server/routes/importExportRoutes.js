const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Account = require('../models/Account');
const mongoose = require('mongoose');
const crypto = require('crypto');

router.use(auth);

// Generate import hash for duplicate detection
function generateImportHash(tx) {
  const str = `${tx.date}|${tx.type}|${tx.amount}|${tx.category}|${tx.account}|${tx.description||''}|${tx.merchant||''}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

// Export transactions to CSV
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, type, category, account } = req.query;
    const filter = { user: req.userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (account) filter.account = account;

    const transactions = await Transaction.find(filter)
      .populate('category', 'name')
      .populate('account', 'name')
      .sort({ date: -1 })
      .lean();

    // CSV headers
    const headers = [
      'Date', 'Type', 'Category', 'Account', 'Amount', 'Currency',
      'Description', 'Merchant', 'Payment Method', 'Notes', 'Status'
    ];

    const rows = transactions.map(tx => [
      new Date(tx.date).toISOString().split('T')[0],
      tx.type,
      tx.category?.name || '',
      tx.account?.name || '',
      tx.amount,
      tx.currency || 'USD',
      tx.description || '',
      tx.merchant || '',
      tx.paymentMethod || '',
      tx.notes || '',
      tx.status
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Import transactions from CSV
router.post('/import', async (req, res) => {
  try {
    const { csv, accountId, defaultCategoryId, skipDuplicates = true } = req.body;
    if (!csv) return res.status(400).json({ message: 'CSV data required' });

    // Verify account
    const account = await Account.findOne({ _id: accountId, user: req.userId });
    if (!account) return res.status(400).json({ message: 'Invalid account' });

    // Parse CSV
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return res.status(400).json({ message: 'CSV must have header and at least one row' });

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const requiredHeaders = ['Date', 'Type', 'Amount'];
    for (const h of requiredHeaders) {
      if (!headers.includes(h)) {
        return res.status(400).json({ message: `Missing required column: ${h}` });
      }
    }

    const dateIdx = headers.indexOf('Date');
    const typeIdx = headers.indexOf('Type');
    const categoryIdx = headers.indexOf('Category');
    const amountIdx = headers.indexOf('Amount');
    const currencyIdx = headers.indexOf('Currency');
    const descIdx = headers.indexOf('Description');
    const merchantIdx = headers.indexOf('Merchant');
    const paymentIdx = headers.indexOf('Payment Method');
    const notesIdx = headers.indexOf('Notes');
    const statusIdx = headers.indexOf('Status');

    const results = {
      imported: 0,
      skipped: 0,
      errors: [],
      duplicates: 0
    };

    // Get existing import hashes for duplicate detection
    const existingHashes = new Set();
    if (skipDuplicates) {
      const existing = await Transaction.find({ user: req.userId, importHash: { $exists: true } })
        .select('importHash')
        .lean();
      existing.forEach(tx => existingHashes.add(tx.importHash));
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parse (handles quoted fields)
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);

      try {
        const date = values[dateIdx] ? new Date(values[dateIdx]) : new Date();
        const type = values[typeIdx]?.toLowerCase();
        const amount = parseFloat(values[amountIdx]);
        const currency = values[currencyIdx] || 'USD';
        const description = values[descIdx] || '';
        const merchant = values[merchantIdx] || '';
        const paymentMethod = values[paymentIdx] || 'other';
        const notes = values[notesIdx] || '';
        const status = values[statusIdx] || 'completed';

        if (!['income', 'expense', 'transfer'].includes(type)) {
          results.errors.push({ row: i + 1, error: 'Invalid type' });
          continue;
        }
        if (isNaN(amount) || amount <= 0) {
          results.errors.push({ row: i + 1, error: 'Invalid amount' });
          continue;
        }

        // Find or create category
        let categoryId = defaultCategoryId;
        if (values[categoryIdx]) {
          let cat = await Category.findOne({
            user: req.userId,
            name: { $regex: new RegExp(`^${values[categoryIdx].trim()}$`, 'i') },
            type: type === 'transfer' ? 'expense' : type
          });
          if (!cat) {
            cat = await Category.create({
              user: req.userId,
              name: values[categoryIdx].trim(),
              type: type === 'transfer' ? 'expense' : type
            });
          }
          categoryId = cat._id;
        }

        // Create transaction object for hash
        const txForHash = {
          date: date.toISOString(),
          type,
          amount,
          category: categoryId?.toString() || '',
          account: accountId,
          description,
          merchant
        };
        const importHash = generateImportHash(txForHash);

        if (skipDuplicates && existingHashes.has(importHash)) {
          results.duplicates++;
          continue;
        }

        const transaction = await Transaction.create({
          user: req.userId,
          account: accountId,
          type,
          category: categoryId,
          amount,
          currency,
          description,
          merchant,
          paymentMethod,
          notes,
          status,
          date,
          importHash
        });

        // Update account balance
        if (type === 'income') {
          await Account.findByIdAndUpdate(accountId, { $inc: { balance: amount } });
        } else if (type === 'expense') {
          await Account.findByIdAndUpdate(accountId, { $inc: { balance: -amount } });
        }

        existingHashes.add(importHash);
        results.imported++;
      } catch (err) {
        results.errors.push({ row: i + 1, error: err.message });
      }
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Preview CSV import (dry run)
router.post('/import/preview', async (req, res) => {
  try {
    const { csv, accountId } = req.body;
    if (!csv) return res.status(400).json({ message: 'CSV data required' });

    const lines = csv.trim().split('\n');
    if (lines.length < 2) return res.status(400).json({ message: 'CSV must have header and at least one row' });

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const preview = [];

    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      preview.push(row);
    }

    res.json({ headers, preview, totalRows: lines.length - 1 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;