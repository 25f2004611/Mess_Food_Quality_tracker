const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'dashboard.html');

// Read as latin1 so every byte maps 1:1 to a character
let c = fs.readFileSync(file, 'latin1');

// Each mojibake pattern comes from UTF-8 emoji/special chars being
// double-encoded (UTF-8 bytes interpreted as Windows-1252/latin1).
// Map: corrupted latin1 string → correct UTF-8 replacement
const fixes = [
  // Punctuation
  ['\u00e2\u0080\u0094', '\u2014'],          // — em dash
  ['\u00e2\u0080\u0093', '\u2013'],          // – en dash
  ['\u00e2\u0080\u00a6', '\u2026'],          // … ellipsis
  ['\u00c2\u00b7',       '\u00b7'],          // · middle dot
  ['\u00e2\u0094\u0080', '-'],               // ─ box drawing (comments)
  ['\u00e2\u0095\u0090', '='],               // ═ box drawing (comments)
  ['\u00e2\u0098\u0085', '\u2605'],          // ★ star

  // Emoji — 4-byte UTF-8, mangled as 4 latin1 chars
  // 🍽️  U+1F37D U+FE0F
  ['\u00f0\u009f\u008d\u00bd\u00ef\u00b8\u008f', '🍽️'],
  // ⬅  U+2B05
  ['\u00e2\u00ac\u0085', '⬅'],
  // 📋  U+1F4CB
  ['\u00f0\u009f\u0093\u008b', '📋'],
  // 🕐  U+1F550
  ['\u00f0\u009f\u0095\u0090', '🕐'],
  // 📊  U+1F4CA
  ['\u00f0\u009f\u0093\u008a', '📊'],
  // 📈  U+1F4C8
  ['\u00f0\u009f\u0093\u0088', '📈'],
  // 🏆  U+1F3C6
  ['\u00f0\u009f\u008f\u0086', '🏆'],
  // 🏛️  U+1F3DB U+FE0F
  ['\u00f0\u009f\u008f\u009b\u00ef\u00b8\u008f', '🏛️'],
  // 📢  U+1F4E2
  ['\u00f0\u009f\u0093\u00a2', '📢'],
  // ⭐  U+2B50
  ['\u00e2\u00ad\u0090', '⭐'],
  // 🌅  U+1F305
  ['\u00f0\u009f\u008c\u0085', '🌅'],
  // ☀️  U+2600 U+FE0F
  ['\u00e2\u0098\u0080\u00ef\u00b8\u008f', '☀️'],
  // 🫖  U+1FAD6
  ['\u00f0\u009f\u00ab\u0096', '🫖'],
  // 🌙  U+1F319
  ['\u00f0\u009f\u008c\u0099', '🌙'],
  // 😋  U+1F60B
  ['\u00f0\u009f\u0098\u008b', '😋'],
  // 🧼  U+1F9FC
  ['\u00f0\u009f\u00a7\u00bc', '🧼'],
  // ⚖️  U+2696 U+FE0F
  ['\u00e2\u009a\u0096\u00ef\u00b8\u008f', '⚖️'],
  // 🥗  U+1F957
  ['\u00f0\u009f\u00a5\u0097', '🥗'],
  // 🍱  U+1F371
  ['\u00f0\u009f\u008d\u00b1', '🍱'],
  // 🤝  U+1F91D
  ['\u00f0\u009f\u00a4\u009d', '🤝'],
  // ⏰  U+23F0
  ['\u00e2\u008f\u00b0', '⏰'],
  // 🏠  U+1F3E0
  ['\u00f0\u009f\u008f\u00a0', '🏠'],
  // 💬  U+1F4AC
  ['\u00f0\u009f\u0092\u00ac', '💬'],
  // ✅  U+2705
  ['\u00e2\u009c\u0085', '✅'],
  // ✓  U+2713
  ['\u00e2\u009c\u0093', '✓'],
  // 📝  U+1F4DD
  ['\u00f0\u009f\u0093\u009d', '📝'],
];

for (const [bad, good] of fixes) {
  // Use a global replace loop (split/join = global replace for strings)
  while (c.includes(bad)) {
    c = c.split(bad).join(good);
  }
}

// Write back as UTF-8
fs.writeFileSync(file, c, 'utf8');
console.log('All symbols fixed and saved as UTF-8.');
