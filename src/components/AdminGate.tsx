import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase'; 
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Lock, LogOut, ShieldAlert, X } from 'lucide-react';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Add your official admin email here
  const ALLOWED_ADMIN_EMAILS = [
    'nasslasu@gmail.com', 
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (ALLOWED_ADMIN_EMAILS.length > 0 && !ALLOWED_ADMIN_EMAILS.includes(currentUser.email || '')) {
          setError(`Access denied for ${currentUser.email}. Not an authorized admin.`);
          signOut(auth); 
          setUser(null);
        } else {
          setUser(currentUser);
          setError('');
          setShowLoginModal(false);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider); 
    } catch (err: any) {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth); 
  };

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 mb-4 flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
          <span className="text-xs text-slate-300">Logged in admin: <strong className="text-yellow-400">{user.email}</strong></span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Render the secret dot and the secure login modal
  return (
    <>
      {/* Secret Tiny Dot Trigger in bottom-right corner */}
      <button 
        onClick={() => setShowLoginModal(true)}
        className="fixed bottom-2 right-2 w-3 h-3 bg-white/5 hover:bg-yellow-400/50 rounded-full z-[100] cursor-pointer transition-colors"
        title="Main Admin"
        aria-label="Open Main Admin Portal"
      />

      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full relative shadow-2xl text-center">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 bg-yellow-400/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-400/20">
              <Lock size={22} />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase font-space-grotesk">Admin Restricted</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest mb-6">Authorized Personnel Only</p>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center justify-center gap-2">
                <ShieldAlert size={16} /> {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {submitting ? 'Authenticating...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
