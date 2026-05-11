const admin = require('firebase-admin');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pharmacy-info-portal.firebasestorage.app'
});

const bucket = admin.storage().bucket();
const dbPath = path.resolve(__dirname, 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

async function diagnose() {
  const [files] = await bucket.getFiles({ prefix: 'guideline/' });
  const storageFiles = files.map(f => path.basename(f.name));
  console.log("=== Files in Firebase Storage (guideline/) ===");
  console.log(storageFiles.join('\n'));

  db.all("SELECT id, title, url FROM guidelines WHERE major = '1. 심혈관질환'", [], (err, rows) => {
    if (err) throw err;
    console.log("\n=== Database Mapping for Cardiovascular ===");
    rows.forEach(r => {
      const fileName = r.url ? (r.url.startsWith('http') ? 'ALREADY_FIREBASE' : path.basename(r.url)) : 'NULL';
      console.log(`[${r.id}] ${r.title} -> ${fileName}`);
    });
    db.close();
  });
}

diagnose();
