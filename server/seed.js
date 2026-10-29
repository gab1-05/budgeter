require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Category = require('./models/Category');
const Account = require('./models/Account');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expenseTracker';

const defaultCategories = [
  // Expense categories
  { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: '🍔', isSystem: true },
  { name: 'Transportation', type: 'expense', color: '#f97316', icon: '🚌', isSystem: true },
  { name: 'Shopping', type: 'expense', color: '#ec4899', icon: '🛍️', isSystem: true },
  { name: 'Entertainment', type: 'expense', color: '#a855f7', icon: '🎮', isSystem: true },
  { name: 'Health & Fitness', type: 'expense', color: '#22c55e', icon: '🏥', isSystem: true },
  { name: 'Housing', type: 'expense', color: '#6b3ae0', icon: '🏠', isSystem: true },
  { name: 'Utilities', type: 'expense', color: '#06b6d4', icon: '💡', isSystem: true },
  { name: 'Subscriptions', type: 'expense', color: '#f59e0b', icon: '📱', isSystem: true },
  { name: 'Education', type: 'expense', color: '#3b82f6', icon: '📚', isSystem: true },
  { name: 'Personal Care', type: 'expense', color: '#f97316', icon: '💇', isSystem: true },
  { name: 'Gifts & Donations', type: 'expense', color: '#ec4899', icon: '🎁', isSystem: true },
  { name: 'Travel', type: 'expense', color: '#06b6d4', icon: '✈️', isSystem: true },
  { name: 'Other', type: 'expense', color: '#78716c', icon: '📦', isSystem: true },
  // Income categories
  { name: 'Salary', type: 'income', color: '#22c55e', icon: '💼', isSystem: true },
  { name: 'Freelance', type: 'income', color: '#84cc16', icon: '💻', isSystem: true },
  { name: 'Investments', type: 'income', color: '#06b6d4', icon: '📈', isSystem: true },
  { name: 'Gifts Received', type: 'income', color: '#a855f7', icon: '🎁', isSystem: true },
  { name: 'Refunds', type: 'income', color: '#3b82f6', icon: '↩️', isSystem: true },
  { name: 'Other Income', type: 'income', color: '#78716c', icon: '💰', isSystem: true },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Create demo user
    let user = await User.findOne({ email: 'demo@example.com' });
    if (!user) {
      const passwordHash = await bcrypt.hash('demo123', 10);
      user = await User.create({
        name: 'Demo User',
        email: 'demo@example.com',
        passwordHash,
        currency: 'USD',
        theme: 'light',
        emergencyReserve: 1000
      });
      console.log('Created demo user: demo@example.com / demo123');
    } else {
      console.log('Demo user already exists');
    }

    // Create default categories for demo user
    for (const cat of defaultCategories) {
      const existing = await Category.findOne({ user: user._id, name: cat.name, type: cat.type });
      if (!existing) {
        await Category.create({ ...cat, user: user._id });
      }
    }
    console.log('Seeded default categories');

    // Create default accounts
    const defaultAccounts = [
      { name: 'Checking Account', type: 'bank', balance: 5000, currency: 'USD', isDefault: true },
      { name: 'Cash Wallet', type: 'cash', balance: 200, currency: 'USD', isDefault: false },
      { name: 'Savings Account', type: 'bank', balance: 10000, currency: 'USD', isDefault: false },
      { name: 'Credit Card', type: 'credit', balance: -500, currency: 'USD', isDefault: false },
    ];

    for (const acc of defaultAccounts) {
      const existing = await Account.findOne({ user: user._id, name: acc.name });
      if (!existing) {
        await Account.create({ ...acc, user: user._id });
      }
    }
    console.log('Seeded default accounts');

    // Update user with default account
    const checking = await Account.findOne({ user: user._id, name: 'Checking Account' });
    if (checking && !user.defaultAccount) {
      user.defaultAccount = checking._id;
      await user.save();
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();