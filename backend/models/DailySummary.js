const mongoose = require('mongoose');

// Aggregated daily summary per hostel — recomputed whenever a new rating is submitted
const dailySummarySchema = new mongoose.Schema({
  college:    { type: String, required: true },
  hostel:     { type: String, required: true },
  date:       { type: String, required: true },         // 'YYYY-MM-DD'
  meals: {
    breakfast: { avg: Number, criteria: Object, count: Number },
    lunch:     { avg: Number, criteria: Object, count: Number },
    snacks:    { avg: Number, criteria: Object, count: Number },
    dinner:    { avg: Number, criteria: Object, count: Number },
  },
  feedbacks:  [{ meal: String, text: String, score: Number }],
  dailyAvg:   { type: Number, default: 0 },
}, { timestamps: true });

dailySummarySchema.index({ college:1, hostel:1, date:1 }, { unique: true });

module.exports = mongoose.model('DailySummary', dailySummarySchema);
