import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading, isFirebaseConfigured } = useAuth();

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white text-[#0D2B22] px-6 text-center">
        Firebase is not configured yet — set VITE_FIREBASE_* values in frontend/.env and restart the dev server.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white text-[#0D2B22]">
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
