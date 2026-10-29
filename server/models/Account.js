const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['cash', 'bank', 'credit', 'wallet'], required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

accountSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Account', accountSchema);