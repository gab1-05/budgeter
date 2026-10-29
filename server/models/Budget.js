const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  alertThreshold: { type: Number, default: 80 }
}, { timestamps: true });

budgetSchema.index({ user: 1, category: 1, period: 1 });

module.exports = mongoose.model('Budget', budgetSchema);