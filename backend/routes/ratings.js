const router   = require('express').Router();
const MealRating   = require('../models/MealRating');
const DailySummary = require('../models/DailySummary');
const { authMiddleware } = require('../middleware/auth');
const { todayStr, MEAL_IDS, CRITERIA_IDS, mean } = require('../utils/helpers');

// ── POST /api/ratings  — submit a meal rating ─────────────────────────────────
// Allowed roles: student, super
router.post('/', authMiddleware(['student','super']), async (req, res) => {
  try {
    const { mealId, criteria, feedback } = req.body;
    const { college, hostel, userId, role } = req.user;

    if (!MEAL_IDS.includes(mealId)) return res.status(400).json({ message: 'Invalid mealId.' });

    // Validate that at least the base 6 criteria are present and in range
    for (const id of CRITERIA_IDS) {
      const v = criteria[id];
      if (!v || v < 1 || v > 5) return res.status(400).json({ message: `Criterion '${id}' must be 1–5.` });
    }

    const date = todayStr();

    // Upsert: allow re-submission (updates the existing entry for today)
    await MealRating.findOneAndUpdate(
      { college, hostel, mealId, date, raterId: userId },
      { college, hostel, mealId, date, raterRole: role, raterId: userId, criteria, feedback: feedback || '' },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Recompute the daily summary for this hostel+date
    await recomputeDailySummary(college, hostel, date);

    res.json({ message: 'Rating saved.' });
  } catch (err) {
    console.error('rating post error', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/ratings/today — get the current user's own ratings for today ─────
router.get('/today', authMiddleware(['student','super']), async (req, res) => {
  try {
    const { college, hostel, userId } = req.user;
    const date = todayStr();
    const ratings = await MealRating.find({ college, hostel, date, raterId: userId });
    // Return as { mealId: { criteria, feedback, avg } }
    const map = {};
    ratings.forEach(r => { map[r.mealId] = { criteria: r.criteria, feedback: r.feedback, avg: r.avg }; });
    res.json(map);
  } catch (err) {
    console.error('ratings today error', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: recompute the DailySummary for a given college+hostel+date
// by averaging all MealRating documents that match
// ─────────────────────────────────────────────────────────────────────────────
async function recomputeDailySummary(college, hostel, date) {
  const allRatings = await MealRating.find({ college, hostel, date });

  const meals = {};
  const feedbacksMap = {};

  MEAL_IDS.forEach(mid => {
    const mealRatings = allRatings.filter(r => r.mealId === mid);
    if (!mealRatings.length) return;

    // Average each criterion across all raters for this meal
    const critAvg = {};
    CRITERIA_IDS.forEach(cid => {
      const vals = mealRatings.map(r => r.criteria[cid]).filter(v => v > 0);
      critAvg[cid] = vals.length ? mean(vals) : 0;
    });
    const avg = mean(Object.values(critAvg).filter(v => v > 0));

    meals[mid] = { avg, criteria: critAvg, count: mealRatings.length };

    // Pick the latest feedback for this meal as the representative
    const latest = mealRatings.slice().sort((a,b) => b.createdAt - a.createdAt)[0];
    if (!feedbacksMap[mid]) feedbacksMap[mid] = [];
    mealRatings.forEach(r => {
      if (r.feedback) feedbacksMap[mid].push({ meal: mid, text: r.feedback, score: r.avg });
    });
  });

  const avgAll = Object.values(meals).map(m => m.avg);
  const dailyAvg = avgAll.length ? mean(avgAll) : 0;

  // Flatten feedbacks array
  const feedbacks = Object.values(feedbacksMap).flat();

  await DailySummary.findOneAndUpdate(
    { college, hostel, date },
    { college, hostel, date, meals, feedbacks, dailyAvg },
    { upsert: true, new: true, runValidators: false }
  );
}

module.exports = router;
