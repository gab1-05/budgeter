const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  // Preferences
  currency: { type: String, default: 'USD' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  language: { type: String, default: 'en' },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  // Financial preferences
  emergencyReserve: { type: Number, default: 0 },
  defaultAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  // Notifications
  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },
  budgetAlerts: { type: Boolean, default: true },
  recurringReminders: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);