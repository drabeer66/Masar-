// مزامنة تلقائية: يسحب مجموعات محددة من Firestore ويكتبها كملفات JSON داخل data-exports/
// يعمل فقط داخل GitHub Actions (لا يُشغَّل يدوياً على أي جهاز) — يعتمد على السر FIREBASE_SERVICE_ACCOUNT

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.error('السر FIREBASE_SERVICE_ACCOUNT غير موجود.'); process.exit(1); }
const serviceAccount = JSON.parse(raw);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// أضيفي هنا أي مجموعة جديدة من أي تطبيق مستقبلي بنفس النمط
const COLLECTIONS = [
  'baraem_responses',
  'baraem_feedback',
  'growth_responses',
];

const OUT_DIR = path.join(__dirname, '..', 'data-exports');

async function main(){
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const col of COLLECTIONS){
    const snap = await db.collection(col).get();
    const docs = [];
    snap.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    const outPath = path.join(OUT_DIR, col + '.json');
    fs.writeFileSync(outPath, JSON.stringify(docs, null, 2), 'utf8');
    console.log(`✅ ${col}: ${docs.length} مستنداً -> ${outPath}`);
  }
}

main().catch(err => { console.error('فشل السحب:', err.message); process.exit(1); });
