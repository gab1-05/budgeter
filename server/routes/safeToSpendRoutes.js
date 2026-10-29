const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const RecurringSchedule = require('../models/RecurringSchedule');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

router.use(auth);

// Helper: get date range
function getRange(type) {
  const now = new Date();
  let start, end;
  if (type === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (type === 'week') {
    start = now;
    end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else { // month
    start = now;
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }
  return { start, end };
}

// Calculate safe-to-spend
router.post('/calculate', async (req, res) => {
  try {
    const { horizon = 'month', plannedPurchase = 0, emergencyReserve } = req.body;

    // 1. Current available funds (sum of account balances)
    const accounts = await Account.find({ user: req.userId });
    const availableFunds = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // 2. Expected income before horizon end
    const range = getRange(horizon);
    const expectedIncome = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'income',
          status: 'completed',
          date: { $gte: new Date(), $lte: range.end }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expectedIncomeTotal = expectedIncome[0]?.total || 0;

    // 3. Upcoming recurring bills (expenses)
    const schedules = await RecurringSchedule.find({
      user: req.userId,
      isActive: true,
      type: 'expense',
      nextRunAt: { $gte: new Date(), $lte: range.end }
    });

    let upcomingRecurring = 0;
    const upcomingDetails = [];
    for (const s of schedules) {
      let next = new Date(s.nextRunAt);
      let count = 0;
      while (next <= range.end && (!s.endDate || next <= s.endDate)) {
        if (s.maxOccurrences && count >= s.maxOccurrences) break;
        count++;
        upcomingDetails.push({
          scheduleId: s._id,
          name: s.name,
          amount: s.amount,
          date: new Date(next),
          category: s.category
        });
        switch (s.frequency) {
          case 'daily': next.setDate(next.getDate() + (s.customInterval || 1)); break;
          case 'weekly': next.setDate(next.getDate() + 7 * (s.customInterval || 1)); break;
          case 'monthly': next.setMonth(next.getMonth() + (s.customInterval || 1)); break;
          case 'quarterly': next.setMonth(next.getMonth() + 3 * (s.customInterval || 1)); break;
          case 'yearly': next.setFullYear(next.getFullYear() + (s.customInterval || 1)); break;
        }
        if (count > 50) break;
      }
      upcomingRecurring += count * s.amount;
    }

    // 4. Essential expenses (budget commitments for essential categories)
    const essentialCategories = ['rent', 'utilities', 'groceries', 'healthcare', 'transport', 'insurance'];
    const essentialBudgets = await Budget.find({
      user: req.userId,
      period: 'monthly'
    }).populate('category', 'name');

    let essentialExpenses = 0;
    for (const b of essentialBudgets) {
      const catName = b.category?.name?.toLowerCase() || '';
      if (essentialCategories.some(c => catName.includes(c))) {
        // Estimate remaining budget for the period
        const spent = await Transaction.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(req.userId),
              type: 'expense',
              category: b.category?._id,
              date: { $gte: new Date(), $lte: range.end }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const spentAmount = spent[0]?.total || 0;
        const remaining = Math.max(0, b.amount - spentAmount);
        essentialExpenses += remaining;
      }
    }

    // 5. Planned savings (from user preferences or budgets)
    const user = await require('../models/User').findById(req.userId);
    const plannedSavings = user?.emergencyReserve || 0;

    // 6. Required reserves (emergency reserve)
    const requiredReserve = emergencyReserve || user?.emergencyReserve || 0;

    // 7. Already paid recurring bills this period (to avoid double counting)
    const paidRecurring = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'expense',
          recurringScheduleId: { $exists: true, $ne: null },
          date: { $gte: new Date(), $lte: range.end }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const paidRecurringTotal = paidRecurring[0]?.total || 0;

    // Calculate
    const totalAvailable = availableFunds + expectedIncomeTotal;
    const totalCommitted = upcomingRecurring + essentialExpenses + plannedSavings + requiredReserve - paidRecurringTotal;
    const safeToSpend = Math.max(0, totalAvailable - totalCommitted);

    // Scenario: with planned purchase
    const safeAfterPurchase = Math.max(0, safeToSpend - plannedPurchase);

    // Daily/weekly breakdown
    const daysInHorizon = horizon === 'today' ? 1 : (horizon === 'week' ? 7 : Math.ceil((range.end - new Date()) / (1000 * 60 * 60 * 24)));
    const dailySafe = daysInHorizon > 0 ? safeToSpend / daysInHorizon : 0;

    res.json({
      horizon,
      availableFunds: Math.round(availableFunds * 100) / 100,
      expectedIncome: Math.round(expectedIncomeTotal * 100) / 100,
      upcomingRecurring: Math.round(upcomingRecurring * 100) / 100,
      upcomingRecurringDetails: upcomingDetails,
      essentialExpenses: Math.round(essentialExpenses * 100) / 100,
      plannedSavings: Math.round(plannedSavings * 100) / 100,
      requiredReserve: Math.round(requiredReserve * 100) / 100,
      paidRecurringAdjustment: Math.round(paidRecurringTotal * 100) / 100,
      totalAvailable: Math.round(totalAvailable * 100) / 100,
      totalCommitted: Math.round(totalCommitted * 100) / 100,
      safeToSpend: Math.round(safeToSpend * 100) / 100,
      dailySafeAmount: Math.round(dailySafe * 100) / 100,
      scenario: {
        plannedPurchase: Math.round(plannedPurchase * 100) / 100,
        safeAfterPurchase: Math.round(safeAfterPurchase * 100) / 100,
        wouldExceed: safeAfterPurchase < 0
      },
      warning: totalCommitted > totalAvailable ? 'Projected expenses exceed available funds' : null,
      assumptions: [
        'Income projections based on scheduled recurring income only',
        'Essential expenses estimated from budget categories',
        'Does not account for variable/spontaneous spending',
        'Emergency reserve is a user-configured minimum',
        'Paid recurring bills are deducted to avoid double-counting'
      ]
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Quick safe-to-spend (simplified)
router.get('/quick', async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.userId });
    const availableFunds = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // Quick estimate: next 7 days recurring
    const range = getRange('week');
    const schedules = await RecurringSchedule.find({
      user: req.userId,
      isActive: true,
      type: 'expense',
      nextRunAt: { $gte: new Date(), $lte: range.end }
    });

    let upcoming = 0;
    for (const s of schedules) {
      let next = new Date(s.nextRunAt);
      while (next <= range.end) {
        upcoming += s.amount;
        switch (s.frequency) {
          case 'daily': next.setDate(next.getDate() + (s.customInterval || 1)); break;
          case 'weekly': next.setDate(next.getDate() + 7 * (s.customInterval || 1)); break;
          default: next = new Date(range.end.getTime() + 1);
        }
      }
    }

    const safe = Math.max(0, availableFunds - upcoming);
    res.json({
      availableFunds: Math.round(availableFunds * 100) / 100,
      upcomingWeek: Math.round(upcoming * 100) / 100,
      safeToSpend: Math.round(safe * 100) / 100
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;