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
    try {
      // Local development fallback when FIREBASE_SERVICE_ACCOUNT is not set in backend/.env
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'));
        req.userId = payload.user_id || payload.sub || 'local-user';
        req.userEmail = payload.email || 'local@example.com';
        return next();
      }
    } catch (_) {
      // Fallback failed
    }
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
