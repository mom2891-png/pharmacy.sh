const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const bucketsToTry = [
  `${serviceAccount.project_id}.appspot.com`,
  `${serviceAccount.project_id}.firebasestorage.app`,
  serviceAccount.project_id
];

async function findBucket() {
  for (const bName of bucketsToTry) {
    console.log(`Testing bucket: ${bName}`);
    try {
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bName
      }, bName);
      const bucket = app.storage().bucket();
      const [exists] = await bucket.exists();
      if (exists) {
        console.log(`SUCCESS: Found bucket ${bName}`);
        process.exit(0);
      }
    } catch (err) {
      console.log(`Failed for ${bName}: ${err.message}`);
    }
  }
  console.log('No buckets found.');
  process.exit(1);
}

findBucket();
