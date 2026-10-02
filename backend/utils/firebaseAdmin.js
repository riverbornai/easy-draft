/**
 * utils/firebaseAdmin.js
 * Initialises Firebase Admin using modular SDK imports so Node ESM can verify
 * the ID tokens issued to signed-in users on the frontend.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminAuth = null;

if (!getApps().length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.warn(
      '⚠️ FIREBASE_SERVICE_ACCOUNT is not set in backend/.env. Authentication features will require this.'
    );
  } else {
    try {
      const serviceAccount = JSON.parse(raw);
      const app = initializeApp({
        credential: cert(serviceAccount),
      });
      adminAuth = getAuth(app);
      console.log('✅ Firebase Admin SDK initialized successfully!');
    } catch (e) {
      console.error('❌ Invalid FIREBASE_SERVICE_ACCOUNT JSON in backend/.env:', e.message);
    }
  }
} else {
  adminAuth = getAuth(getApps()[0]);
}

export { adminAuth };
export default adminAuth;
