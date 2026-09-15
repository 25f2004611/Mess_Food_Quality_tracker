require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend HTML files statically from the parent folder
app.use(express.static(path.join(__dirname, '..')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/notices', require('./routes/notices'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ── MongoDB connection + start ────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mfms';
const PORT        = process.env.PORT        || 5000;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected:', MONGODB_URI);

    // Auto-seed on first start
    const { seedAll } = require('./seed');
    await seedAll();

    app.listen(PORT, () => {
      console.log(`🚀 MFMS backend running at http://localhost:${PORT}`);
      console.log(`   Open: http://localhost:${PORT}/login.html`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
