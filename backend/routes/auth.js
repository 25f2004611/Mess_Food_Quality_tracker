const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { userId, password, role, college, hostel } = req.body;

    if (!userId || !password || !role) {
      return res.status(400).json({ message: 'userId, password and role are required.' });
    }

    const user = await User.findOne({ userId, role });
    if (!user) return res.status(401).json({ message: 'Invalid credentials. Check your ID, password and role.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials. Check your ID, password and role.' });

    // For non-govt roles validate that the submitted college/hostel matches the registered one
    if (role !== 'govt') {
      if (user.college && user.college !== college) {
        return res.status(401).json({ message: 'College does not match registered profile.' });
      }
      if (user.hostel && user.hostel !== hostel) {
        return res.status(401).json({ message: 'Hostel does not match registered profile.' });
      }
    }

    const payload = {
      _id:     user._id,
      userId:  user.userId,
      role:    user.role,
      college: user.college || college || '',
      hostel:  user.hostel  || hostel  || '',
      name:    user.name,
      email:   user.email,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, user: payload });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
// Govt role cannot sign up — blocked here and on frontend
router.post('/signup', async (req, res) => {
  try {
    const { userId, password, role, college, hostel, name, email, phone } = req.body;

    if (role === 'govt') {
      return res.status(403).json({ message: 'Government accounts cannot be created via signup.' });
    }

    if (!userId || !password || !role || !name || !email) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!['student','manager','super'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    if (!college || !hostel) {
      return res.status(400).json({ message: 'College and hostel are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const exists = await User.findOne({ userId, role });
    if (exists) {
      return res.status(409).json({ message: 'An account with this ID already exists for the selected role.' });
    }

    const user = new User({ userId, password, role, college, hostel, name, email, phone: phone || '' });
    await user.save();

    res.status(201).json({ message: 'Account created successfully.' });
  } catch (err) {
    console.error('signup error', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with this ID already exists for the selected role.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
