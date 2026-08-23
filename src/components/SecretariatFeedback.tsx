import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { useToast } from './Toast';
import { X, Mail, Key, ShieldAlert } from 'lucide-react';

export const SecretariatFeedback = () => {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formId, setFormId] = useState('');
  
  const { addToast } = useToast();

  // Authorized Admin Emails
  const ALLOWED_ADMIN_EMAILS = [
    'honour2est@gmail.com', 
    'ekopeters@gmail.com'
  ];
  const GOOGLE_ADMIN_EMAIL = 'honour2est@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const isGoogleProvider = currentUser.providerData.some(p => p.providerId === 'google.com');
        
        if (!ALLOWED_ADMIN_EMAILS.includes(currentUser.email || '')) {
          setNeedsAuth(true); // Let AdminGate handle the full signout
        } else if (isGoogleProvider && currentUser.email !== GOOGLE_ADMIN_EMAIL) {
          setNeedsAuth(true);
        } else {
          setNeedsAuth(false);
          setError(null);
        }
      } else {
        setNeedsAuth(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);
    
    setTimeout(() => {
      setFeedbackLoading(false);
      addToast('Feedback submitted successfully! Thank you.', 'success');
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const isGoogleProvider = result.user.providerData.some(p => p.providerId === 'google.com');
      
      if (!ALLOWED_ADMIN_EMAILS.includes(result.user.email || '')) {
        await signOut(auth);
        throw new Error(`Access denied for ${result.user.email}.`);
      }
      if (isGoogleProvider && result.user.email !== GOOGLE_ADMIN_EMAIL) {
        await signOut(auth);
        throw new Error('Google Sign-In restricted. Please use Email and Password.');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!ALLOWED_ADMIN_EMAILS.includes(result.user.email || '')) {
        await signOut(auth);
        throw new Error(`Access denied. Not an authorized admin.`);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setNeedsAuth(true);
    setResponses([]);
    setFormId('');
  };

  const handleViewResponses = async () => {
    if (!formId) return;
    setLoading(true);
    setError(null);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated. Please sign in again.");

      const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Error fetching form responses: ${res.statusText}`);
      }
      const data = await res.json();
      setResponses(data.responses || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 relative">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto relative z-10">
        <h3 className="text-2xl font-bold text-white mb-2 space-grotesk">Send Feedback to Secretariat</h3>
        <p className="text-slate-400 text-sm mb-6">Have an idea, complaint, or general feedback for the student representative council? Let us know below.</p>
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Subject</label>
            <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 text-white placeholder-slate-500" placeholder="What is this regarding?" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Message</label>
            <textarea required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 text-white placeholder-slate-500 resize-none" placeholder="Type your feedback here..."></textarea>
          </div>
          <button type="submit" disabled={feedbackLoading} className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold uppercase tracking-widest px-8 py-3 rounded-xl transition-colors text-xs shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
            {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      <button 
        onClick={() => setShowAdminPortal(true)}
        className="fixed bottom-2 left-2 w-3 h-3 bg-white/5 hover:bg-yellow-400/50 rounded-full z-50 cursor-pointer transition-colors"
        title="Admin Portal"
        aria-label="Open Admin Feedback Portal"
      />

      {showAdminPortal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl">
            <button
              onClick={() => setShowAdminPortal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer z-50"
            >
              <X size={20} />
            </button>

            {needsAuth ? (
              <div className="text-center max-w-md mx-auto py-4">
                <h3 className="text-2xl font-bold text-white mb-4 space-grotesk">Feedback Portal</h3>
                <p className="text-slate-400 text-sm mb-6">Sign in to view direct feedback submissions via Google Forms.</p>
                
                {error && (
                  <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center justify-center gap-2">
                    <ShieldAlert size={16} /> {error}
                  </div>
                )}

                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg cursor-pointer mb-6 disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>

                <div className="relative flex py-2 items-center mb-6">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-widest">Or sign in with email</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-slate-500" size={16} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@nasslasu.com"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3.5 text-slate-500" size={16} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {loading ? 'Signing in...' : 'Sign In with Email'}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-yellow-400 space-grotesk">Secretariat Form Responses</h3>
                  <button onClick={handleSignOut} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white bg-white/5 px-4 py-2 rounded-full border border-white/10 transition-colors">Sign Out</button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <input 
                    type="text" 
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="Paste Google Form ID here"
                    className="flex-1 bg-white/5 text-white placeholder:text-slate-500 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-yellow-400/50 text-sm"
                  />
                  <button 
                    onClick={handleViewResponses}
                    disabled={loading || !formId}
                    className="bg-yellow-400 text-slate-900 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-yellow-300 disabled:opacity-50 transition-colors shadow-lg"
                  >
                    {loading ? 'Loading...' : 'Fetch Responses'}
                  </button>
                </div>

                {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {responses.length === 0 && !loading && !error && (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-slate-400 text-sm">No responses found or waiting for input.</p>
                    </div>
                  )}
                  {responses.map((response: any, idx: number) => (
                    <div key={response.responseId || idx} className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-yellow-400/30 transition-colors">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80 mb-3 border-b border-white/5 pb-2">Response ID: {response.responseId?.substring(0, 8)}... • {new Date(response.createTime).toLocaleString()}</p>
                      <div className="space-y-4">
                        {Object.keys(response.answers || {}).map(qId => {
                          const answer = response.answers[qId];
                          const text = answer?.textAnswers?.answers?.[0]?.value || 'N/A';
                          return (
                            <div key={qId} className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Question ID: {qId}</p>
                              <p className="text-sm text-slate-200 leading-relaxed">{text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.5);
        }
      `}</style>
    </div>
  );
};
