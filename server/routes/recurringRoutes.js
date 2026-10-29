const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const RecurringSchedule = require('../models/RecurringSchedule');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const mongoose = require('mongoose');

router.use(auth);

// Helper: calculate next run date
function calculateNextRun(schedule, fromDate = new Date()) {
  const next = new Date(schedule.nextRunAt || schedule.startDate);
  const freq = schedule.frequency;
  const interval = schedule.customInterval || 1;

  switch (freq) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3 * interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }
  return next;
}

// Get all recurring schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await RecurringSchedule.find({ user: req.userId })
      .populate('account', 'name type')
      .populate('category', 'name type color')
      .sort({ nextRunAt: 1 });
    res.json(schedules);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get upcoming occurrences (next 30 days)
router.get('/upcoming', async (req, res) => {
  try {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const schedules = await RecurringSchedule.find({
      user: req.userId,
      isActive: true,
      nextRunAt: { $lte: thirtyDays }
    }).populate('account', 'name type').populate('category', 'name type color');

    res.json(schedules);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get single schedule
router.get('/:id', async (req, res) => {
  try {
    const schedule = await RecurringSchedule.findOne({ _id: req.params.id, user: req.userId })
      .populate('account', 'name type')
      .populate('category', 'name type color');
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create schedule
router.post('/', async (req, res) => {
  try {
    const {
      name, type, amount, frequency, customInterval,
      startDate, endDate, maxOccurrences,
      account, category, description,
      isVariableAmount, variableAmountRange
    } = req.body;

    if (!name || !type || !amount || !frequency || !startDate || !account) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify account belongs to user
    const acc = await Account.findOne({ _id: account, user: req.userId });
    if (!acc) return res.status(400).json({ message: 'Invalid account' });

    const nextRunAt = new Date(startDate);
    const schedule = await RecurringSchedule.create({
      user: req.userId,
      name,
      type,
      amount,
      frequency,
      customInterval: customInterval || 1,
      startDate,
      endDate,
      maxOccurrences,
      account,
      category,
      description,
      nextRunAt,
      isVariableAmount,
      variableAmountRange
    });

    await schedule.populate('account', 'name type');
    await schedule.populate('category', 'name type color');
    res.status(201).json(schedule);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Update schedule
router.put('/:id', async (req, res) => {
  try {
    const update = { ...req.body };
    // Recalculate nextRunAt if frequency/startDate changed
    if (update.frequency || update.startDate) {
      const current = await RecurringSchedule.findOne({ _id: req.params.id, user: req.userId });
      if (current) {
        const freq = update.frequency || current.frequency;
        const start = update.startDate || current.startDate;
        const interval = update.customInterval || current.customInterval || 1;
        const next = new Date(start);
        switch (freq) {
          case 'daily': next.setDate(next.getDate() + interval); break;
          case 'weekly': next.setDate(next.getDate() + 7 * interval); break;
          case 'monthly': next.setMonth(next.getMonth() + interval); break;
          case 'quarterly': next.setMonth(next.getMonth() + 3 * interval); break;
          case 'yearly': next.setFullYear(next.getFullYear() + interval); break;
        }
        update.nextRunAt = next;
      }
    }

    const schedule = await RecurringSchedule.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      update,
      { new: true }
    ).populate('account', 'name type').populate('category', 'name type color');

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Pause/Resume schedule
router.patch('/:id/toggle', async (req, res) => {
  try {
    const schedule = await RecurringSchedule.findOne({ _id: req.params.id, user: req.userId });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    schedule.isActive = !schedule.isActive;
    await schedule.save();
    res.json(schedule);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete schedule
router.delete('/:id', async (req, res) => {
  try {
    await RecurringSchedule.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get projected annual cost
router.get('/:id/projection', async (req, res) => {
  try {
    const schedule = await RecurringSchedule.findOne({ _id: req.params.id, user: req.userId });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    const now = new Date();
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    let count = 0;
    let next = new Date(schedule.nextRunAt);

    while (next < yearEnd && (!schedule.endDate || next <= schedule.endDate)) {
      if (schedule.maxOccurrences && count >= schedule.maxOccurrences) break;
      count++;
      switch (schedule.frequency) {
        case 'daily': next.setDate(next.getDate() + (schedule.customInterval || 1)); break;
        case 'weekly': next.setDate(next.getDate() + 7 * (schedule.customInterval || 1)); break;
        case 'monthly': next.setMonth(next.getMonth() + (schedule.customInterval || 1)); break;
        case 'quarterly': next.setMonth(next.getMonth() + 3 * (schedule.customInterval || 1)); break;
        case 'yearly': next.setFullYear(next.getFullYear() + (schedule.customInterval || 1)); break;
      }
    }

    const projectedAmount = schedule.isVariableAmount && schedule.variableAmountRange
      ? (schedule.variableAmountRange.min + schedule.variableAmountRange.max) / 2 * count
      : schedule.amount * count;

    res.json({
      occurrences: count,
      projectedAmount: Math.round(projectedAmount * 100) / 100
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;