const admin = require('firebase-admin');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

const bucket = admin.storage().bucket();
const dbPath = path.resolve(__dirname, 'backend', 'database', 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

const majorCategory = '1. 심혈관질환';

async function migrate() {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, title, url FROM guidelines WHERE major = ?", [majorCategory], async (err, rows) => {
      if (err) return reject(err);

      const toMigrate = rows.filter(r => r.url && !r.url.startsWith('http'));
      console.log(`Found ${toMigrate.length} guidelines to migrate.`);

      for (const item of toMigrate) {
        try {
          const localPath = path.resolve(__dirname, item.url);
          if (!fs.existsSync(localPath)) {
            console.warn(`File not found: ${localPath} for ${item.id}`);
            continue;
          }

          const fileName = path.basename(localPath);
          const destination = `guidelines/cv/${fileName}`;

          console.log(`Uploading ${fileName}...`);
          await bucket.upload(localPath, {
            destination: destination,
            metadata: {
              cacheControl: 'public, max-age=31536000',
            }
          });

          // Get signed URL (valid for 50 years)
          const [url] = await bucket.file(destination).getSignedUrl({
            action: 'read',
            expires: '01-01-2075'
          });

          console.log(`Success! Updating DB for ${item.id} with new URL.`);
          await new Promise((res, rej) => {
            db.run("UPDATE guidelines SET url = ? WHERE id = ?", [url, item.id], (err) => {
              if (err) rej(err);
              else res();
            });
          });

        } catch (error) {
          console.error(`Error migrating ${item.id}:`, error);
        }
      }
      resolve();
    });
  });
}

migrate()
  .then(() => {
    console.log('Migration completed successfully!');
    db.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    db.close();
    process.exit(1);
  });
