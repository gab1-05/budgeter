const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const RecurringSchedule = require('../models/RecurringSchedule');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

router.use(auth);

// Helper: get date range for period
function getPeriodRange(period, offset = 0) {
  const now = new Date();
  let start, end;
  if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  } else if (period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3) + offset;
    const year = now.getFullYear() + Math.floor(quarter / 4);
    const q = ((quarter % 4) + 4) % 4;
    start = new Date(year, q * 3, 1);
    end = new Date(year, (q + 1) * 3, 0, 23, 59, 59);
  } else {
    start = new Date(now.getFullYear() + offset, 0, 1);
    end = new Date(now.getFullYear() + offset, 11, 31, 23, 59, 59);
  }
  return { start, end };
}

// Get spending comparison (current vs previous period)
router.get('/spending-comparison', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const current = getPeriodRange(period, 0);
    const previous = getPeriodRange(period, -1);

    const [currentData, previousData] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', date: { $gte: current.start, $lte: current.end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', date: { $gte: previous.start, $lte: previous.end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    // Get category names
    const categoryIds = [...new Set([...currentData.map(d => d._id), ...previousData.map(d => d._id)].filter(Boolean))];
    const categories = await Category.find({ _id: { $in: categoryIds } });
    const catMap = Object.fromEntries(categories.map(c => [c._id.toString(), c]));

    const currentMap = Object.fromEntries(currentData.map(d => [d._id?.toString(), d]));
    const previousMap = Object.fromEntries(previousData.map(d => [d._id?.toString(), d]));

    const allIds = new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]);
    const comparison = [];

    for (const id of allIds) {
      const cur = currentMap[id] || { total: 0, count: 0 };
      const prev = previousMap[id] || { total: 0, count: 0 };
      const change = prev.total > 0 ? ((cur.total - prev.total) / prev.total) * 100 : (cur.total > 0 ? 100 : 0);
      const cat = catMap[id];

      comparison.push({
        category: cat ? { _id: cat._id, name: cat.name, type: cat.type, color: cat.color } : { name: 'Unknown' },
        current: cur.total,
        previous: prev.total,
        change: Math.round(change * 100) / 100,
        currentCount: cur.count,
        previousCount: prev.count
      });
    }

    comparison.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    res.json(comparison);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get monthly spending trend (last 12 months)
router.get('/monthly-trend', async (req, res) => {
  try {
    const months = 12;
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);

    const data = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Fill missing months with 0
    const result = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = data.find(x => x._id.year === d.getFullYear() && x._id.month === d.getMonth() + 1);
      result.push({
        period: key,
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        total: found?.total || 0,
        count: found?.count || 0
      });
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get category breakdown for period
router.get('/category-breakdown', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const range = getPeriodRange(period, 0);

    const data = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', date: { $gte: range.start, $lte: range.end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const categoryIds = data.map(d => d._id).filter(Boolean);
    const categories = await Category.find({ _id: { $in: categoryIds } });
    const catMap = Object.fromEntries(categories.map(c => [c._id.toString(), c]));

    const total = data.reduce((sum, d) => sum + d.total, 0);
    const breakdown = data.map(d => {
      const cat = catMap[d._id?.toString()];
      return {
        category: cat ? { _id: cat._id, name: cat.name, type: cat.type, color: cat.color } : { name: 'Uncategorized' },
        amount: d.total,
        percentage: total > 0 ? Math.round((d.total / total) * 10000) / 100 : 0,
        count: d.count
      };
    });

    res.json({ total, breakdown });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Detect unusual transactions (statistical outliers)
router.get('/anomalies', async (req, res) => {
  try {
    const { period = 'month', threshold = 2 } = req.query; // threshold in std deviations
    const range = getPeriodRange(period, 0);

    const transactions = await Transaction.find({
      user: req.userId,
      type: 'expense',
      date: { $gte: range.start, $lte: range.end }
    }).populate('category', 'name color').lean();

    if (transactions.length < 5) {
      return res.json({ anomalies: [], message: 'Not enough data for anomaly detection' });
    }

    // Group by category and find outliers within each category
    const byCategory = {};
    for (const tx of transactions) {
      const catId = tx.category?._id?.toString() || 'uncategorized';
      if (!byCategory[catId]) byCategory[catId] = [];
      byCategory[catId].push(tx);
    }

    const anomalies = [];
    for (const [catId, txs] of Object.entries(byCategory)) {
      if (txs.length < 3) continue;
      const amounts = txs.map(t => t.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const std = Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length);
      const thresholdAmount = mean + threshold * std;

      for (const tx of txs) {
        if (tx.amount > thresholdAmount) {
          anomalies.push({
            transaction: tx,
            categoryMean: Math.round(mean * 100) / 100,
            categoryStdDev: Math.round(std * 100) / 100,
            deviation: Math.round(((tx.amount - mean) / std) * 100) / 100
          });
        }
      }
    }

    anomalies.sort((a, b) => b.deviation - a.deviation);
    res.json({ anomalies: anomalies.slice(0, 10) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get recurring expenses impact
router.get('/recurring-impact', async (req, res) => {
  try {
    const schedules = await RecurringSchedule.find({ user: req.userId, isActive: true, type: 'expense' })
      .populate('category', 'name color');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let monthlyTotal = 0;
    const breakdown = [];

    for (const s of schedules) {
      // Calculate how many occurrences this month
      let count = 0;
      let next = new Date(s.nextRunAt);
      while (next <= monthEnd && (!s.endDate || next <= s.endDate)) {
        if (s.maxOccurrences && count >= s.maxOccurrences) break;
        if (next >= monthStart) count++;
        switch (s.frequency) {
          case 'daily': next.setDate(next.getDate() + (s.customInterval || 1)); break;
          case 'weekly': next.setDate(next.getDate() + 7 * (s.customInterval || 1)); break;
          case 'monthly': next.setMonth(next.getMonth() + (s.customInterval || 1)); break;
          case 'quarterly': next.setMonth(next.getMonth() + 3 * (s.customInterval || 1)); break;
          case 'yearly': next.setFullYear(next.getFullYear() + (s.customInterval || 1)); break;
        }
        if (count > 100) break; // safety
      }
      const projected = count * s.amount;
      monthlyTotal += projected;
      breakdown.push({
        schedule: s,
        monthlyOccurrences: count,
        projectedMonthlyAmount: projected
      });
    }

    // Get total income this month for ratio
    const income = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'income', date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyIncome = income[0]?.total || 0;
    const ratio = monthlyIncome > 0 ? (monthlyTotal / monthlyIncome) * 100 : 0;

    res.json({
      monthlyRecurringTotal: Math.round(monthlyTotal * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      ratio: Math.round(ratio * 100) / 100,
      breakdown
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get saving recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const insights = [];

    // 1. High recurring ratio
    const schedules = await RecurringSchedule.find({ user: req.userId, isActive: true, type: 'expense' });
    let monthlyRecurring = 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    for (const s of schedules) {
      let count = 0;
      let next = new Date(s.nextRunAt);
      while (next <= monthEnd && (!s.endDate || next <= s.endDate)) {
        if (s.maxOccurrences && count >= s.maxOccurrences) break;
        if (next >= monthStart) count++;
        switch (s.frequency) {
          case 'daily': next.setDate(next.getDate() + (s.customInterval || 1)); break;
          case 'weekly': next.setDate(next.getDate() + 7 * (s.customInterval || 1)); break;
          case 'monthly': next.setMonth(next.getMonth() + (s.customInterval || 1)); break;
          case 'quarterly': next.setMonth(next.getMonth() + 3 * (s.customInterval || 1)); break;
          case 'yearly': next.setFullYear(next.getFullYear() + (s.customInterval || 1)); break;
        }
        if (count > 100) break;
      }
      monthlyRecurring += count * s.amount;
    }

    const income = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'income', date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyIncome = income[0]?.total || 0;

    if (monthlyIncome > 0 && monthlyRecurring / monthlyIncome > 0.3) {
      insights.push({
        type: 'recurring_high',
        title: 'High Recurring Expenses',
        description: `Recurring expenses (${(monthlyRecurring/monthlyIncome*100).toFixed(1)}% of income) may limit flexibility.`,
        severity: 'warning',
        data: { monthlyRecurring, monthlyIncome, ratio: monthlyRecurring/monthlyIncome }
      });
    }

    // 2. Category spending increase
    const comparison = await Transaction.aggregate([
      {
        $facet: {
          current: [
            { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', date: { $gte: monthStart, $lte: monthEnd } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
          ],
          previous: [
            { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', date: { $gte: new Date(now.getFullYear(), now.getMonth()-1, 1), $lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
          ]
        }
      }
    ]);

    const curMap = Object.fromEntries(comparison[0].current.map(d => [d._id?.toString(), d.total]));
    const prevMap = Object.fromEntries(comparison[0].previous.map(d => [d._id?.toString(), d.total]));
    const allCats = new Set([...Object.keys(curMap), ...Object.keys(prevMap)]);

    for (const catId of allCats) {
      const cur = curMap[catId] || 0;
      const prev = prevMap[catId] || 0;
      if (prev > 0 && cur > prev * 1.15) {
        const cat = await Category.findById(catId);
        insights.push({
          type: 'category_increase',
          title: `${cat?.name || 'Category'} Spending Increased`,
          description: `${cat?.name || 'This category'} increased by ${((cur/prev-1)*100).toFixed(1)}% vs last month.`,
          severity: 'info',
          data: { category: cat?.name, current: cur, previous: prev, change: ((cur/prev-1)*100).toFixed(1) }
        });
      }
    }

    // 3. Budget overages
    const budgets = await Budget.find({ user: req.userId, period: 'monthly' }).populate('category', 'name');
    for (const b of budgets) {
      const spent = await Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', category: b.category?._id, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const spentAmount = spent[0]?.total || 0;
      if (spentAmount > b.amount) {
        insights.push({
          type: 'budget_over',
          title: `Budget Exceeded: ${b.category?.name || b.name}`,
          description: `Spent $${spentAmount.toFixed(2)} of $${b.amount.toFixed(2)} budget.`,
          severity: 'error',
          data: { budget: b.amount, spent: spentAmount, category: b.category?.name }
        });
      }
    }

    res.json({ insights });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Income vs Expense summary
router.get('/income-expense', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const range = getPeriodRange(period, 0);

    const [income, expense] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'income', date: { $gte: range.start, $lte: range.end } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', date: { $gte: range.start, $lte: range.end } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      income: income[0]?.total || 0,
      expense: expense[0]?.total || 0,
      incomeCount: income[0]?.count || 0,
      expenseCount: expense[0]?.count || 0,
      net: (income[0]?.total || 0) - (expense[0]?.total || 0)
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;