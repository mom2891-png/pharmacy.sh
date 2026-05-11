const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pharmacy-info-portal.firebasestorage.app'
});

const bucket = admin.storage().bucket();

async function configureCors() {
  try {
    console.log('Configuring CORS for bucket: ' + bucket.name);
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'HEAD'],
        origin: ['http://localhost:3000', 'https://pharmacy-info-portal.vercel.app'],
        responseHeader: ['Content-Type', 'Authorization', 'Origin', 'Accept']
      }
    ]);
    console.log('✅ CORS configuration successfully updated!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to set CORS:', err);
    process.exit(1);
  }
}

configureCors();
