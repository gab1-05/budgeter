require('dotenv').config();
const mongoose = require('mongoose');
const RecurringSchedule = require('./models/RecurringSchedule');
const Transaction = require('./models/Transaction');
const Account = require('./models/Account');
const Category = require('./models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expenseTracker';

async function connect() {
  await mongoose.connect(MONGO_URI);
  console.log('Worker: MongoDB connected');
}

function calculateNextRun(schedule) {
  const next = new Date(schedule.nextRunAt);
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
      // Handle month-end dates (e.g., Jan 31 -> Feb 28/29)
      if (next.getDate() !== schedule.startDate.getDate()) {
        next.setDate(0); // Last day of previous month
      }
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3 * interval);
      if (next.getDate() !== schedule.startDate.getDate()) {
        next.setDate(0);
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      // Handle Feb 29 on non-leap years
      if (next.getMonth() === 1 && next.getDate() === 29 && !isLeapYear(next.getFullYear())) {
        next.setDate(28);
      }
      break;
  }
  return next;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

async function updateAccountBalance(accountId, amountChange) {
  await Account.findByIdAndUpdate(accountId, { $inc: { balance: amountChange } });
}

async function processSchedule(schedule) {
  const now = new Date();

  try {
    let processed = 0;
    let nextRun = new Date(schedule.nextRunAt);

    // Process all due occurrences
    while (nextRun <= now && (!schedule.endDate || nextRun <= schedule.endDate)) {
      if (schedule.maxOccurrences && schedule.occurrencesCount >= schedule.maxOccurrences) {
        break;
      }

      // Check if already processed for this date (idempotency)
      const existing = await Transaction.findOne({
        recurringScheduleId: schedule._id,
        date: {
          $gte: new Date(nextRun.getFullYear(), nextRun.getMonth(), nextRun.getDate()),
          $lt: new Date(nextRun.getFullYear(), nextRun.getMonth(), nextRun.getDate() + 1)
        }
      });

      if (!existing) {
        // Determine amount (variable or fixed)
        let amount = schedule.amount;
        if (schedule.isVariableAmount && schedule.variableAmountRange) {
          const { min, max } = schedule.variableAmountRange;
          amount = Math.random() * (max - min) + min;
          amount = Math.round(amount * 100) / 100;
        }

        // Create transaction
        await Transaction.create({
          user: schedule.user,
          account: schedule.account,
          type: schedule.type,
          category: schedule.category,
          amount,
          currency: 'USD',
          description: schedule.description || schedule.name,
          date: new Date(nextRun),
          recurringScheduleId: schedule._id,
          status: 'completed'
        });

        // Update account balance
        if (schedule.type === 'income') {
          await updateAccountBalance(schedule.account, amount);
        } else {
          await updateAccountBalance(schedule.account, -amount);
        }

        processed++;
        schedule.occurrencesCount += 1;
        schedule.lastProcessedAt = new Date(nextRun);
      }

      // Calculate next occurrence
      nextRun = calculateNextRun({ ...schedule.toObject(), nextRunAt: nextRun });
    }

    // Update schedule
    schedule.nextRunAt = nextRun;
    if (schedule.endDate && nextRun > schedule.endDate) {
      schedule.isActive = false;
    }
    if (schedule.maxOccurrences && schedule.occurrencesCount >= schedule.maxOccurrences) {
      schedule.isActive = false;
    }

    await schedule.save();

    if (processed > 0) {
      console.log(`Worker: Processed ${processed} occurrence(s) for schedule "${schedule.name}"`);
    }
    return processed;
  } catch (error) {
    console.error(`Worker: Error processing schedule ${schedule._id}:`, error);
    throw error;
  }
}

async function runWorker() {
  console.log('Worker: Starting recurring payment processing...');
  const now = new Date();

  try {
    // Find all active schedules that are due
    const schedules = await RecurringSchedule.find({
      isActive: true,
      nextRunAt: { $lte: now }
    }).populate('account').populate('category');

    console.log(`Worker: Found ${schedules.length} due schedule(s)`);

    let totalProcessed = 0;
    for (const schedule of schedules) {
      try {
        totalProcessed += await processSchedule(schedule);
      } catch (err) {
        console.error(`Worker: Failed to process schedule ${schedule._id}:`, err.message);
        // Continue with other schedules
      }
    }

    console.log(`Worker: Completed. Total transactions created: ${totalProcessed}`);
  } catch (error) {
    console.error('Worker: Fatal error:', error);
  }
}

// Run immediately, then schedule
async function start() {
  await connect();

  // Run once on startup
  await runWorker();

  // Schedule to run every minute
  setInterval(runWorker, 60 * 1000);
  console.log('Worker: Scheduled to run every minute');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Worker: Shutting down...');
    await mongoose.disconnect();
    process.exit(0);
  });
}

start().catch(console.error);