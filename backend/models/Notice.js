const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  hostel:   { type: String, required: true },
  college:  { type: String, required: true },
  score:    { type: Number, required: true },
  type:     { type: String, enum: ['warn','cancel'], required: true },
  issuedBy: { type: String, default: 'Govt. Authority · Bihar DTE' },
  date:     { type: String },   // formatted display date
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
