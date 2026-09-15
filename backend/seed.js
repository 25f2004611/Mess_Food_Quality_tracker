/**
 * seed.js — Seeds MongoDB with:
 *   1. Govt user (pre-existing, no sign-up)
 *   2. Demo student / manager / super for bce / Boys Hostel 1
 *   3. 25 days of synthetic DailySummary documents for every college+hostel
 *      (mirrors the original in-memory data generation logic)
 */
require('dotenv').config();
const mongoose     = require('mongoose');
const User         = require('./models/User');
const DailySummary = require('./models/DailySummary');
const Notice       = require('./models/Notice');
const { MEAL_IDS, CRITERIA_IDS, mean } = require('./utils/helpers');

// ── Static data (mirror of frontend) ─────────────────────────────────────────
const COLLEGES = [
  { id:'bce',     name:'Bakhtiyarpur College of Engineering, Patna' },
  { id:'mit',     name:'Muzaffarpur Institute of Technology, Muzaffarpur' },
  { id:'dce',     name:'Darbhanga College of Engineering, Darbhanga' },
  { id:'nce',     name:'Nalanda College of Engineering, Chandi' },
  { id:'pec',     name:'Purnea College of Engineering, Purnea' },
  { id:'gce-bh',  name:'Govt. Engineering College, Bhagalpur' },
  { id:'gce-ga',  name:'Govt. Engineering College, Gaya' },
  { id:'gce-va',  name:'Govt. Engineering College, Vaishali (Hajipur)' },
  { id:'gce-nw',  name:'Govt. Engineering College, Nawada' },
  { id:'gce-sm',  name:'Govt. Engineering College, Samastipur' },
  { id:'gce-bx',  name:'Govt. Engineering College, Buxar' },
  { id:'gce-jh',  name:'Govt. Engineering College, Jehanabad' },
  { id:'gce-sh',  name:'Govt. Engineering College, Sheikhpura' },
  { id:'gce-si',  name:'Govt. Engineering College, Sitamarhi' },
  { id:'gce-su',  name:'Govt. Engineering College, Supaul' },
  { id:'gce-ki',  name:'Govt. Engineering College, Kishanganj' },
  { id:'gce-ar',  name:'Govt. Engineering College, Araria' },
  { id:'gce-ka',  name:'Govt. Engineering College, Kaimur (Bhabua)' },
  { id:'gce-ct',  name:'Govt. Engineering College, East Champaran (Motihari)' },
  { id:'gce-sa',  name:'Govt. Engineering College, Saharsa' },
  { id:'gce-mu',  name:'Govt. Engineering College, Munger' },
  { id:'gce-ro',  name:'Govt. Engineering College, Rohtas (Sasaram)' },
  { id:'gce-au',  name:'Govt. Engineering College, Aurangabad' },
  { id:'gce-ja',  name:'Govt. Engineering College, Jamui' },
  { id:'gce-lk',  name:'Govt. Engineering College, Lakhisarai' },
  { id:'gce-sh2', name:'Govt. Engineering College, Sheohar' },
  { id:'gce-mp',  name:'Govt. Engineering College, Madhepura' },
  { id:'gce-go',  name:'Govt. Engineering College, Gopalganj' },
  { id:'gce-wc',  name:'Govt. Engineering College, West Champaran (Bettiah)' },
  { id:'gce-ma',  name:'Govt. Engineering College, Madhubani' },
  { id:'gce-be',  name:'Govt. Engineering College, Begusarai' },
  { id:'gce-kh',  name:'Govt. Engineering College, Khagaria' },
  { id:'mce',     name:'Motihari College of Engineering, Motihari' },
  { id:'biet',    name:'Bhagalpur College of Engineering, Bhagalpur' },
];

const HOSTELS = {
  'bce':    ['Boys Hostel 1','Boys Hostel 2','Boys Hostel 3','Girls Hostel 1'],
  'mit':    ['Boys Hostel 1','Boys Hostel 2','Boys Hostel 3','Girls Hostel 1'],
  'dce':    ['Boys Hostel 1','Boys Hostel 2','Boys Hostel 3','Girls Hostel 1'],
  'nce':    ['Boys Hostel 1','Boys Hostel 2','Girls Hostel 1'],
  'pec':    ['Boys Hostel 1','Boys Hostel 2','Girls Hostel 1'],
  'gce-bh': ['Boys Hostel 1','Boys Hostel 2','Girls Hostel 1'],
  'gce-ga': ['Boys Hostel 1','Boys Hostel 2','Girls Hostel 1'],
  'gce-va': ['Boys Hostel 1','Boys Hostel 2','Girls Hostel 1'],
  'biet':   ['Boys Hostel 1','Boys Hostel 2','Girls Hostel 1'],
};
COLLEGES.forEach(c => { if (!HOSTELS[c.id]) HOSTELS[c.id] = ['Boys Hostel 1','Girls Hostel 1']; });

// ── Seeded PRNG (mirrors frontend) ───────────────────────────────────────────
let _seed = 42;
function seededRand() { _seed = (_seed * 1664525 + 1013904223) & 0xffffffff; return ((_seed >>> 0) / 0xffffffff); }
function resetSeed(v) { _seed = v >>> 0; }

const FEEDBACK_GOOD = ['Food was really tasty today!','Breakfast was excellent — Poha fresh and spiced.','Clean serving area. Great improvement!','Portions generous, sabzi fresh.','Loved variety in dinner. Keep it up!','Chapatis soft and hot. Quick service.','Dal makhani was delicious.','Good quantity and hygiene today.'];
const FEEDBACK_MID  = ['Food okay but needs more spices.','Quantity a bit less at dinner.','Sabzi slightly overcooked but edible.','Service slow during lunch rush.','Menu repetitive for past few days.','Chapatis little hard today.','Rice had some uncooked grains.'];
const FEEDBACK_BAD  = ['Dal watery and tasteless today.','Found hair in food at lunch. Unhygienic!','Vegetables looked old, not fresh.','Plates not properly cleaned.','Very less quantity — students went hungry.','Cook rude when asked for extra roti.','Strong bad odour in kitchen area.','Food served cold, taste very bad.','Same menu 5th day in a row!'];
function pickFeedback(s) { return s >= 4 ? FEEDBACK_GOOD[Math.floor(seededRand() * FEEDBACK_GOOD.length)] : s >= 3 ? FEEDBACK_MID[Math.floor(seededRand() * FEEDBACK_MID.length)] : FEEDBACK_BAD[Math.floor(seededRand() * FEEDBACK_BAD.length)]; }

// ── Demo users to seed ────────────────────────────────────────────────────────
const DEMO_USERS = [
  // ⚠️  GOVT is pre-existing — no sign-up allowed
  { userId:'GOVT-DTE-2024', role:'govt',    college:'', hostel:'', name:'Govt. Authority', email:'dte@bihar.gov.in', phone:'9431000001', password:'pass123' },
  // Demo non-govt users
  { userId:'22BCSE001',  role:'student', college:'bce', hostel:'Boys Hostel 1', name:'Rohit Kumar',           email:'rohit@bce.ac.in',  phone:'9431100010', password:'pass123' },
  { userId:'MGR-BCE-001',role:'manager', college:'bce', hostel:'Boys Hostel 1', name:'Ramesh Kumar Sharma',   email:'mgr@bce.ac.in',    phone:'9431100001', password:'pass123' },
  { userId:'SUP-BCE-001',role:'super',   college:'bce', hostel:'Boys Hostel 1', name:'Dr. Anil Kumar Singh',  email:'sup@bce.ac.in',    phone:'9431200001', password:'pass123' },
];

// ── Main seeder ───────────────────────────────────────────────────────────────
async function seedAll() {
  // 1. Seed users (skip if already exist)
  for (const u of DEMO_USERS) {
    const exists = await User.findOne({ userId: u.userId, role: u.role });
    if (!exists) {
      await new User(u).save();
      console.log(`  ✔ Seeded user: ${u.userId} (${u.role})`);
    }
  }

  // 2. Seed DailySummary documents (skip if any already exist for the hostel)
  const today = new Date();
  let hostelIndex = 0;

  for (const col of COLLEGES) {
    for (const hostel of (HOSTELS[col.id] || [])) {
      const key = `${col.id}__${hostel}`;
      // Determine tier deterministically (mirrors frontend HOSTEL_PROFILES)
      const tier = hostelIndex % 4 === 0 ? 'excellent' : hostelIndex % 4 === 3 ? 'poor' : 'average';
      const base = tier === 'excellent' ? 4.0 : tier === 'poor' ? 2.2 : 3.2;
      hostelIndex++;

      resetSeed(key.split('').reduce((a, c) => a + c.charCodeAt(0), 0));

      // Check if any summary already exists for this hostel
      const existingCount = await DailySummary.countDocuments({ college: col.id, hostel });
      if (existingCount > 0) continue;

      const monthlyAvgs = [];

      for (let d = 1; d <= 25; d++) {
        // Compute the date string for each day (d days ago from today, reversed)
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - (25 - d));
        const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth()+1).padStart(2,'0')}-${String(dayDate.getDate()).padStart(2,'0')}`;

        const meals = {};
        const feedbacks = [];

        for (const mealId of MEAL_IDS) {
          const mealBase = Math.max(1, Math.min(5, base + (seededRand() - 0.5) * 0.8));
          const criteria = {};
          for (const cid of CRITERIA_IDS) {
            criteria[cid] = Math.max(1, Math.min(5, mealBase + (seededRand() - 0.5) * 1.2));
          }
          const avg = mean(Object.values(criteria));
          meals[mealId] = { avg, criteria, count: 25 + Math.floor(seededRand() * 35) };
          feedbacks.push({ meal: mealId, text: pickFeedback(avg), score: avg });
        }

        const dailyAvg = mean(MEAL_IDS.map(m => meals[m].avg));
        monthlyAvgs.push(dailyAvg);

        await DailySummary.findOneAndUpdate(
          { college: col.id, hostel, date: dateStr },
          { college: col.id, hostel, date: dateStr, meals, feedbacks, dailyAvg },
          { upsert: true, new: true }
        );
      }

      // 3. Auto-generate notices for poor performers
      const monthlyAvg = mean(monthlyAvgs);
      const colName = col.name;
      if (monthlyAvg < 2.5) {
        const exists = await Notice.findOne({ college: col.id, hostel, type: 'cancel' });
        if (!exists) {
          await new Notice({ hostel, college: colName, score: monthlyAvg, type: 'cancel', issuedBy: 'Govt. Authority · Bihar DTE', date: new Date(Date.now() - 5*86400000).toLocaleDateString('en-IN') }).save();
        }
      } else if (monthlyAvg < 3.0) {
        const exists = await Notice.findOne({ college: col.id, hostel, type: 'warn' });
        if (!exists) {
          await new Notice({ hostel, college: colName, score: monthlyAvg, type: 'warn', issuedBy: 'Govt. Authority · Bihar DTE', date: new Date(Date.now() - 10*86400000).toLocaleDateString('en-IN') }).save();
        }
      }

      console.log(`  ✔ Seeded 25 days for: ${col.id} / ${hostel} (${tier}, avg ${mean(monthlyAvgs).toFixed(2)})`);
    }
  }

  console.log('✅ Seeding complete.');
}

// Run standalone if invoked directly: node seed.js
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mfms')
    .then(async () => {
      await seedAll();
      await mongoose.disconnect();
    })
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seedAll };
