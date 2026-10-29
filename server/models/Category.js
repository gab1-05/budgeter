const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  color: { type: String },
  icon: { type: String },
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);