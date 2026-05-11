const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const storage = admin.storage();
async function listBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Available buckets:');
    buckets.forEach(b => console.log(b.name));
  } catch (err) {
    console.error('Error listing buckets:', err);
  }
}

listBuckets();
