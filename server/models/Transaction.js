const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  description: { type: String },
  merchant: { type: String },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'], default: 'other' },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  // For transfers
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  // For recurring
  recurringScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringSchedule' },
  // Status
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
  // For duplicate detection
  importHash: { type: String }
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, account: 1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ importHash: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);