import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { currentUser, loading: authLoading, signInWithGoogle, redirectError } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Already signed in — leave the login page instead of showing it again.
  if (!authLoading && currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError(`Sign-in failed: ${err.code || err.message}`);
      console.error(err);
      setLoading(false);
    }
  };

  const displayedError = error || (redirectError && `Sign-in failed: ${redirectError.code || redirectError.message}`);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0E2923] bg-[url('/wave-forest.svg')] bg-cover bg-center bg-no-repeat p-4">
      <div className="w-full max-w-md bg-[#103227] border border-[#1A4435] rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <p className="text-white text-xl tracking-tighter" style={{ fontFamily: "'Schibsted Grotesk', sans-serif", fontWeight: 600 }}>EasyDraft</p>
          <p className="text-[#E8EDE6]/50 text-sm">Sign in to continue</p>
        </div>

        {displayedError && (
          <p className="text-red-400 text-sm text-center">{displayedError}</p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-bold bg-white text-[#0D2B22] hover:bg-[#E8EDE6] transition-all duration-300 active:scale-[0.97] disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6c-2 1.5-4.6 2.5-7.7 2.5-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C40.7 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          {loading ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </div>

      {/* Footer Text outside the card */}
      <div className="mt-8 text-center space-y-3 max-w-md px-6">
        <p className="text-sm text-[#E8EDE6]/75 leading-relaxed font-medium">
          EasyDraft is a professional multi-agent workspace for drafting, grading, and publishing content.
        </p>
        <p className="text-xs text-[#E8EDE6]/50 uppercase tracking-[0.2em] font-black">
          Crafted with ♥ by <span className="text-[#D4F53C] hover:text-white transition-colors duration-300 cursor-pointer">riverborn.com</span>
        </p>
      </div>
    </div>
  );
}
