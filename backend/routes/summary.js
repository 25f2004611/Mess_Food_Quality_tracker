const router       = require('express').Router();
const DailySummary = require('../models/DailySummary');
const { authMiddleware }  = require('../middleware/auth');
const { todayStr, MEAL_IDS, CRITERIA_IDS, mean } = require('../utils/helpers');

// ── GET /api/summary/today — today's aggregated summary for a hostel ──────────
// Accessible by: student, manager, super (scoped to their college+hostel)
router.get('/today', authMiddleware(['student','manager','super']), async (req, res) => {
  try {
    const { college, hostel } = req.user;
    const date = todayStr();
    const doc = await DailySummary.findOne({ college, hostel, date });
    res.json(doc || null);
  } catch (err) {
    console.error('summary today error', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/summary/monthly — all 30 days of daily summaries for a hostel ────
router.get('/monthly', authMiddleware(['student','manager','super']), async (req, res) => {
  try {
    const { college, hostel } = req.user;
    const docs = await DailySummary.find({ college, hostel }).sort({ date: 1 }).limit(30);
    res.json(docs);
  } catch (err) {
    console.error('summary monthly error', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/summary/rankings — monthly averages for ALL hostels ──────────────
// Accessible by: all authenticated roles
router.get('/rankings', authMiddleware(['student','manager','super','govt']), async (req, res) => {
  try {
    // Aggregate: group by college+hostel, compute mean of all dailyAvg values
    const rankings = await DailySummary.aggregate([
      {
        $group: {
          _id:        { college: '$college', hostel: '$hostel' },
          monthlyAvg: { $avg: '$dailyAvg' },
          dayCount:   { $sum: 1 },
        },
      },
      { $sort: { monthlyAvg: -1 } },
    ]);
    res.json(rankings);
  } catch (err) {
    console.error('rankings error', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
