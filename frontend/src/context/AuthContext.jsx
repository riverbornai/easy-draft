import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isFirebaseConfigured,
  signInWithGoogle,
  completeGoogleRedirect,
  logout,
} from '../utils/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Resolve the account picked during signInWithGoogle's redirect, if any.
    completeGoogleRedirect()
      .then((result) => {
        console.log('[auth] completeGoogleRedirect result:', result);
      })
      .catch((err) => {
        console.error('[auth] completeGoogleRedirect error:', err);
        setRedirectError(err);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[auth] onAuthStateChanged user:', user);
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseConfigured,
        signInWithGoogle,
        logout,
        redirectError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
