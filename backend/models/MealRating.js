const mongoose = require('mongoose');

// Stores one student/superintendent rating submission per meal per day
const mealRatingSchema = new mongoose.Schema({
  college:   { type: String, required: true },
  hostel:    { type: String, required: true },
  mealId:    { type: String, enum: ['breakfast','lunch','snacks','dinner'], required: true },
  date:      { type: String, required: true },          // 'YYYY-MM-DD'
  raterRole: { type: String, enum: ['student','super'], required: true },
  raterId:   { type: String, required: true },
  criteria:  {
    taste:     { type: Number, min: 1, max: 5 },
    hygiene:   { type: Number, min: 1, max: 5 },
    quantity:  { type: Number, min: 1, max: 5 },
    freshness: { type: Number, min: 1, max: 5 },
    variety:   { type: Number, min: 1, max: 5 },
    service:   { type: Number, min: 1, max: 5 },
    // Superintendent-only extra criteria
    punctuality: { type: Number, min: 1, max: 5, default: null },
    cleanliness: { type: Number, min: 1, max: 5, default: null },
  },
  feedback: { type: String, default: '' },
  avg:      { type: Number },
}, { timestamps: true });

// One submission per rater per meal per date
mealRatingSchema.index({ college:1, hostel:1, mealId:1, date:1, raterId:1 }, { unique: true });

mealRatingSchema.pre('save', function(next) {
  const vals = Object.values(this.criteria).filter(v => v != null && v > 0);
  this.avg = vals.length ? vals.reduce((s,x) => s+x, 0) / vals.length : 0;
  next();
});

module.exports = mongoose.model('MealRating', mealRatingSchema);
