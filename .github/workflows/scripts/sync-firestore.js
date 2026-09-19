// سكربت مزامنة بيانات Firestore إلى ملفات JSON داخل الريبو
// يُشغَّل عبر GitHub Actions (يدوياً أو بجدول تلقائي)

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// قراءة مفتاح حساب الخدمة من المسار المُمرَّر عبر متغير البيئة
const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ---------------------------------------------------------------
// قائمة الأدوات ومجموعاتها في Firestore
// لإضافة أداة جديدة مستقبلاً (مثل أداة النمو المبكر): أضيفي سطراً هنا فقط
// المفتاح (يسار) = اسم المجلد الذي سيُنشأ داخل data/
// القيمة (يمين) = اسم الـ Collection الفعلي في Firestore
// ---------------------------------------------------------------
const collectionsMap = {
  baraem: 'baraem_responses',
  // 'early-growth': 'اسم_المجموعة_عند_توفرها',
};

async function syncCollection(key, collectionName) {
  const snapshot = await db.collection(collectionName).get();

  const docs = [];
  snapshot.forEach((doc) => {
    docs.push({ id: doc.id, ...doc.data() });
  });

  const outDir = path.join('data', key);
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'latest.json');
  fs.writeFileSync(outPath, JSON.stringify(docs, null, 2), 'utf8');

  console.log(
    `تمت مزامنة ${docs.length} وثيقة من المجموعة "${collectionName}" إلى ${outPath}`
  );
}

async function main() {
  const entries = Object.entries(collectionsMap);

  if (entries.length === 0) {
    console.log('لا توجد مجموعات معرّفة في collectionsMap — لا شيء لمزامنته.');
    return;
  }

  for (const [key, collectionName] of entries) {
    await syncCollection(key, collectionName);
  }

  await admin.app().delete();
}

main().catch((err) => {
  console.error('فشلت المزامنة:', err);
  process.exit(1);
});
