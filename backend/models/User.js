const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  role:     { type: String, enum: ['student','manager','super','govt'], required: true },
  college:  { type: String, default: '' },
  hostel:   { type: String, default: '' },
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  phone:    { type: String, default: '' },
  password: { type: String, required: true },
}, { timestamps: true });

// Unique index: same userId can exist across roles, but not within same role
userSchema.index({ userId: 1, role: 1 }, { unique: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

// Never return password in JSON
userSchema.set('toJSON', {
  transform(doc, ret) { delete ret.password; return ret; }
});

module.exports = mongoose.model('User', userSchema);
