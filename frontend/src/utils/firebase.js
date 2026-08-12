import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only when every required Firebase config value is actually present.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

let auth = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('Failed to set Firebase auth persistence:', err);
  });
} else {
  console.warn('Firebase is not configured — set VITE_FIREBASE_* in frontend/.env before using login.');
}

export { auth };

const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  if (!auth) return Promise.reject(new Error('Firebase is not configured.'));
  return signInWithPopup(auth, googleProvider);
}

export function completeGoogleRedirect() {
  if (!auth) return Promise.resolve(null);
  return getRedirectResult(auth);
}

export function logout() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}
