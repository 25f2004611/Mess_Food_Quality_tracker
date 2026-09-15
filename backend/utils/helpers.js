/** Returns today's date as 'YYYY-MM-DD' in local time */
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MEAL_IDS     = ['breakfast','lunch','snacks','dinner'];
const CRITERIA_IDS = ['taste','hygiene','quantity','freshness','variety','service'];

function mean(arr) {
  const a = arr.filter(v => v != null);
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}

module.exports = { todayStr, MEAL_IDS, CRITERIA_IDS, mean };
