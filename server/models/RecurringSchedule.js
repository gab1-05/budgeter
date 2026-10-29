const mongoose = require('mongoose');

const recurringScheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], required: true },
  customInterval: { type: Number, default: 1 },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  maxOccurrences: { type: Number },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  description: { type: String },
  nextRunAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  lastProcessedAt: { type: Date },
  occurrencesCount: { type: Number, default: 0 },
  isVariableAmount: { type: Boolean, default: false },
  variableAmountRange: {
    min: { type: Number },
    max: { type: Number }
  }
}, { timestamps: true });

recurringScheduleSchema.index({ user: 1, isActive: 1, nextRunAt: 1 });

module.exports = mongoose.model('RecurringSchedule', recurringScheduleSchema);