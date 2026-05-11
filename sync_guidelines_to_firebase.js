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

const majorCategory = '1. 심혈관질환';

async function sync() {
  // 1. Get all files in 'guideline/' folder
  const [files] = await bucket.getFiles({ prefix: 'guideline/' });
  console.log(`Found ${files.length} files in Firebase Storage 'guideline/' folder.`);

  const storageMap = new Map();
  for (const file of files) {
    const fileName = path.basename(file.name);
    // Get signed URL (50 years)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2075'
    });
    storageMap.set(fileName, url);
  }

  // 2. Get guidelines from DB
  return new Promise((resolve, reject) => {
    db.all("SELECT id, title, url FROM guidelines WHERE major = ?", [majorCategory], async (err, rows) => {
      if (err) return reject(err);

      let updatedCount = 0;
      for (const item of rows) {
        if (!item.url) continue;
        
        const originalFileName = path.basename(item.url);
        const firebaseAuthUrl = storageMap.get(originalFileName);

        if (firebaseAuthUrl) {
          console.log(`Matching found for ${item.id} (${item.title}) -> Updating URL...`);
          await new Promise((res, rej) => {
            db.run("UPDATE guidelines SET url = ? WHERE id = ?", [firebaseAuthUrl, item.id], (err) => {
              if (err) rej(err);
              else res();
            });
          });
          updatedCount++;
        } else {
          console.warn(`No match found in Storage for: ${originalFileName} (${item.id})`);
        }
      }
      console.log(`Successfully synced ${updatedCount} guidelines.`);
      resolve();
    });
  });
}

sync()
  .then(() => {
    console.log('Sync completed!');
    db.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Sync failed:', err);
    db.close();
    process.exit(1);
  });
