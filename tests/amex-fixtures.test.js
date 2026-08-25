const assert = require('assert');
const D = require('../document-engine.js');

const gold7041 = [
  ['פוינט','2026-08-06',46.00,'סיגריות ומוצרי טבק'],
  ['שופרסל דיל נתניה','2026-08-03',296.85,'סופרמרקט'],
  ['רמי לוי נתניה יהלום','2026-08-02',157.96,'סופרמרקט'],
  ['פוינט','2026-07-29',46.00,'סיגריות ומוצרי טבק'],
  ['מזה','2026-07-29',68.00,'אחר'],
  ['פוינט','2026-07-26',46.00,'סיגריות ומוצרי טבק'],
  ['סטופמרקט יהלום','2026-07-24',157.16,'סופרמרקט'],
  ['רולדין קרית השרון','2026-07-24',48.00,'מסעדות ובתי קפה'],
  ['שומשום','2026-07-22',78.46,'מסעדות ובתי קפה'],
  ['שופרסל דיל נתניה','2026-07-20',94.28,'סופרמרקט'],
  ['שגרירות פורטוגל','2026-07-20',38.00,'אגרות ושירותים'],
  ['בייקרי גד מכנס','2026-07-18',47.00,'מסעדות ובתי קפה'],
  ['מינימרקט עילאי','2026-07-17',200.00,'סופרמרקט'],
  ['רחל בשדרה','2026-07-16',67.00,'אחר'],
  ['נייקי שרונה','2026-07-16',663.40,'קניות'],
  ['פוינט','2026-07-14',46.00,'סיגריות ומוצרי טבק'],
  ['רוגובין פטיסרי בעמ','2026-07-14',22.00,'מסעדות ובתי קפה'],
  ['רמי לוי נתניה','2026-07-14',154.78,'סופרמרקט'],
  ['דוכני שפע מונשרי-מקס','2026-06-26',210.00,'סופרמרקט'],
];

const green4706 = [
  ['רולדין קרית השרון','2026-07-31',46.00,'מסעדות ובתי קפה'],
  ['עולם הממתקים','2026-07-31',45.00,'אחר'],
  ['אלוני השרון CARREFOUR','2026-07-31',54.68,'סופרמרקט'],
  ['דוכני שפע מונשרי-מקס','2026-07-31',210.70,'סופרמרקט'],
  ['כלל ב.בריאות ה.ק','2026-07-29',65.48,'בריאות'],
  ['שופרסל דיל נתניה','2026-07-29',347.38,'סופרמרקט'],
  ['דמי כרטיס / הנפקה','2026-07-22',12.60,'עמלות וריביות'],
  ['שרותי בריאות כללית','2026-07-22',105.71,'בריאות'],
  ['סונול לב יהלום','2026-07-21',47.00,'דלק'],
  ['העברה ב BIT','2026-07-20',38.00,'העברות ותשלומים'],
  ['מנורה מבטחים - חיים','2026-07-19',204.30,'ביטוחים'],
  ['שאפז בעמ','2026-07-18',83.00,'אחר'],
  ['פז YELLOW מבוא עתלית','2026-07-17',47.00,'דלק'],
  ['רב קו אונליין','2026-07-14',161.50,'תחבורה'],
  ['העברה ב BIT','2026-07-14',150.00,'העברות ותשלומים'],
  ['עולם הממתקים','2026-07-10',45.00,'אחר'],
  ['נעלי ניצן נתניה-מקס','2026-07-10',200.00,'קניות'],
  ['רולדין קרית השרון','2026-07-10',18.00,'מסעדות ובתי קפה'],
  ['אלוני השרון CARREFOUR','2026-07-10',61.53,'סופרמרקט'],
  ['דוכני שפע מונשרי-מקס','2026-07-10',163.80,'סופרמרקט'],
  ['העברה ב BIT','2026-07-07',200.00,'העברות ותשלומים'],
  ['חברת פרטנר תקשורת בע','2026-07-06',42.16,'סלולר ואינטרנט'],
  ['דני בית מאפה נתניה','2026-07-03',7.50,'מסעדות ובתי קפה'],
  ['רמי לוי השרון נתניה','2026-07-03',93.97,'סופרמרקט'],
  ['GETT','2026-07-03',60.00,'תחבורה'],
  ['צמח קצבים','2026-06-25',197.96,'סופרמרקט'],
  ['סבו עיר ימים נתניה-צ','2026-06-09',224.00,'אחר'],
];

const toMinor = n => Math.round(n * 100);
const sum = rows => rows.reduce((n,r)=>n+toMinor(r[2]),0);
assert.strictEqual(sum(gold7041), 248689, 'Gold 7041 must reconcile to ₪2,486.89');
assert.strictEqual(sum(green4706), 293227, 'Green 4706 must reconcile to ₪2,932.27');

function key(r){ return `${r[1]}|${toMinor(r[2])}|${r[0].replace(/\s+/g,' ').trim().toLowerCase()}`; }
function dedupe(rows){ const seen=new Set(); return rows.filter(r=>{const k=key(r); if(seen.has(k)) return false; seen.add(k); return true;}); }
const overlapping = [...gold7041, ...gold7041.slice(3,10), ...green4706, ...green4706.slice(5,13)];
assert.strictEqual(dedupe(overlapping).length, gold7041.length + green4706.length, 'Overlapping screenshots must not create duplicate transactions');

const tobacco = gold7041.filter(r=>r[3]==='סיגריות ומוצרי טבק');
assert.strictEqual(tobacco.length,4,'Four Point transactions should be categorized as tobacco');
assert.strictEqual(sum(tobacco),18400,'Point tobacco spend should total ₪184.00 across supplied statement');

function categoryTotals(rows){const m={}; for(const r of rows)m[r[3]]=(m[r[3]]||0)+toMinor(r[2]); return m;}
const julGold = categoryTotals(gold7041.filter(r=>r[1].startsWith('2026-07')));
assert.strictEqual(julGold['סיגריות ומוצרי טבק'],13800,'July Point spend should total ₪138.00');

for (const r of [...gold7041, ...green4706]) {
  assert.strictEqual(D.classify(r[0]), r[3], `classify("${r[0]}") should be "${r[3]}" but got "${D.classify(r[0])}"`);
}

assert.strictEqual(D.classify('שופרסל דיל נתניה'), 'סופרמרקט', 'branch/location suffixes must not break matching');
assert.strictEqual(D.classify('רולדין אבן גבירול תל אביב'), 'מסעדות ובתי קפה', 'branch/location suffixes must not break matching');
assert.strictEqual(D.classify('מנזה'), 'מסעדות ובתי קפה');
assert.strictEqual(D.classify('שומשום'), 'מסעדות ובתי קפה');
assert.strictEqual(D.classify('דוכני שפע'), 'סופרמרקט');
assert.strictEqual(D.classify('צמח קצבים'), 'סופרמרקט');
assert.strictEqual(D.classify('מינימרקט'), 'סופרמרקט');

console.log('AMEX regression fixtures passed');
console.log({gold7041: sum(gold7041)/100, green4706: sum(green4706)/100, tobaccoTotal: sum(tobacco)/100, julyTobacco: julGold['סיגריות ומוצרי טבק']/100});
