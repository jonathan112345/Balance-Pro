const assert=require('assert');
const D=require('../document-engine.js');
const rows=D.parseLines([
  '20.08.2026 פוינט רמת גן ₪52.00',
  '19.08.2026 WOLT ₪86.40',
  '18.08.2026 סופר פארם ₪129.90',
  '17.08.2026 זיכוי WOLT ₪20.00',
  'סה״כ לחיוב ₪248.30'
],new Date('2026-08-23T12:00:00'));
assert.equal(rows.length,4);
assert.equal(rows[0].category,'סיגריות ומוצרי טבק');
assert.equal(rows[1].category,'מסעדות ובתי קפה');
assert.equal(rows[2].category,'בריאות');
assert.equal(rows[3].type,'refund');
const s=D.summarize(rows);
assert.equal(s.totalMinor,24830);
assert.equal(s.byCategory['סיגריות ומוצרי טבק'],5200);
assert.equal(s.byCategory['מסעדות ובתי קפה'],6640);
assert.equal(D.statementTotal('סה״כ לחיוב ₪248.30'),24830);
assert.equal(D.detectSource('אמריקן אקספרס זהב כרטיס 7041'),'American Express • 7041');
assert.equal(D.parseDate('20/08',new Date('2026-08-23')),'2026-08-20');
assert.equal(D.fingerprint(rows[0],'American Express • 7041'),D.fingerprint({...rows[0]},'American Express • 7041'));

// --- date formats: ISO, Hebrew month names, OCR-spaced separators ---
const REF=new Date('2026-08-31T12:00:00');
assert.equal(D.parseDate('2026-08-20',REF),'2026-08-20');
assert.equal(D.parseDate('2026/08/20',REF),'2026-08-20');
assert.equal(D.parseDate('תאריך הפקה 2025-12-31 שעה 14:03',REF),'2025-12-31');
assert.equal(D.parseDate('שולם 03.02.2026',REF),'2026-02-03');            // yyyy-first must not break dd.mm.yyyy
assert.equal(D.parseDate('20 באוגוסט 2026',REF),'2026-08-20');
assert.equal(D.parseDate('3 בפבר׳ 2025',REF),'2025-02-03');
assert.equal(D.parseDate('20 באוגוסט',REF),'2026-08-20');                 // year inferred
assert.equal(D.parseDate('2 בינוניות',REF),'');                          // "in mediums" is not a date
assert.equal(D.parseDate('20 . 08 . 2026',REF),'2026-08-20');            // OCR spaces around separators
assert.equal(D.parseDate('כמות 3 . 5 יחידות',REF),'');

// --- money: shekel as suffix / word, and mixed-currency lines prefer ILS ---
assert.deepEqual(D.moneyValues('יתרה 1,234 ₪'),[1234]);
assert.deepEqual(D.moneyValues('סה"כ 89.90 ש"ח'),[89.9]);
assert.deepEqual(D.moneyValues('89 שקלים'),[89]);
assert.deepEqual(D.moneyValues('5 שחקנים במגרש'),[]);                    // ש"ח must not match mid-word
assert.deepEqual(D.moneyValues('AMAZON 25.00 USD 92.13 ₪'),[92.13]);    // billed ILS wins over foreign
assert.deepEqual(D.moneyValues('SPOTIFY ₪ 23.40 5.99 EUR'),[23.4]);

// --- statementTotal: more real-world total phrasings ---
assert.equal(D.statementTotal('סכום לתשלום: 55.00'),5500);
assert.equal(D.statementTotal('יתרה לתשלום 1,200.00'),120000);
assert.equal(D.statementTotal('סה״כ: ₪248.30'),24830);
assert.equal(D.statementTotal('סה״כ 248.30 ש"ח'),24830);
assert.equal(D.statementTotal('Amount due: $ 45.00'),4500);
assert.equal(D.statementTotal('Balance Due 1,020.50'),102050);
assert.equal(D.statementTotal('סה״כ הנחה 15.00'),0);                     // discount line is not the total

// --- non-standard receipt: ISO date at top, VAT breakdown line ---
const rcpt=D.parseLines(['חשבונית מס / קבלה 100453','2026-08-14','קפה הפוך גדול 14.00','כריך אבוקדו 32.00','מים מינרלים 8.00','מע"מ 17% 9.06','סה"כ לתשלום 54.00'],REF);
assert.ok(rcpt.length>=1);
assert.ok(rcpt.every(r=>r.date==='2026-08-14'));                        // items inherit the receipt date, not "9.06"->June
assert.ok(!rcpt.some(r=>/מעמ|מע"מ/.test(r.merchant)));                  // VAT line is not a transaction
assert.equal(D.statementTotal('סה"כ לתשלום 54.00'),5400);

// --- multi-currency card statement: each row billed in ILS ---
const fx=D.parseLines(['12.08.2026 AMAZON MARKETPLACE 25.00 USD 92.13 ₪','10.08.2026 SPOTIFY AB 5.99 EUR 23.40 ₪','08.08.2026 שופרסל דיל ₪137.20'],REF);
assert.equal(fx.length,3);
assert.equal(fx[0].amountMinor,9213);
assert.equal(fx[1].amountMinor,2340);
assert.equal(fx[2].amountMinor,13720);

// --- classify: short tokens must not match as substrings ---
assert.equal(D.classify('שאפז בעמ'),'אחר');                            // "פז" inside "שאפז" is not fuel
assert.equal(D.classify('סבו עיר ימים נתניה-צ'),'אחר');                // "מים" inside "ימים" is not a utility bill
assert.equal(D.classify('פז YELLOW מבוא עתלית'),'דלק');                // real fuel station still classifies
assert.equal(D.classify('חשבון מים ותיעול'),'חשבונות');               // real water bill still classifies

console.log('document-engine tests passed');