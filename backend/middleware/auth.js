/**
 * middleware/auth.js
 * Verifies the Firebase ID token sent in the X-Firebase-Auth header and
 * attaches req.userId / req.userEmail. Rejects the request otherwise.
 */
import { adminAuth } from '../utils/firebaseAdmin.js';

export async function requireAuth(req, res, next) {
  const token = req.headers['x-firebase-auth'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing auth token' });
  }

  if (!adminAuth) {
    return res.status(500).json({
      error: 'Firebase Not Configured',
      message: 'FIREBASE_SERVICE_ACCOUNT is not configured in backend/.env'
    });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.userId = decoded.uid;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    console.error('Auth verification error:', err.message);
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired auth token' });
  }
}
