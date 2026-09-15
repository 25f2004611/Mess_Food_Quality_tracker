const router = require('express').Router();
const Notice = require('../models/Notice');
const { authMiddleware } = require('../middleware/auth');

// ── GET /api/notices — get notices visible to the current user ────────────────
router.get('/', authMiddleware(['student','manager','super','govt']), async (req, res) => {
  try {
    const { role, hostel, college } = req.user;
    let query = {};
    if (role !== 'govt') {
      // Non-govt users see only notices for their hostel+college
      query = { hostel, college };
    }
    const notices = await Notice.find(query).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    console.error('notices get error', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/notices — issue a notice (govt only) ───────────────────────────
router.post('/', authMiddleware(['govt']), async (req, res) => {
  try {
    const { hostel, college, score, type } = req.body;
    if (!hostel || !college || score == null || !type) {
      return res.status(400).json({ message: 'hostel, college, score and type are required.' });
    }
    if (!['warn','cancel'].includes(type)) {
      return res.status(400).json({ message: 'type must be warn or cancel.' });
    }

    const notice = new Notice({
      hostel, college, score,
      type,
      issuedBy: req.user.name || 'Govt. Authority · Bihar DTE',
      date: new Date().toLocaleDateString('en-IN'),
    });
    await notice.save();
    res.status(201).json(notice);
  } catch (err) {
    console.error('notices post error', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
