import React, { useState } from 'react';
import { googleSignIn, getAccessToken, logout } from '../firebase';
import { useToast } from './Toast';

export const SecretariatFeedback = () => {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  const { addToast } = useToast();

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);
    
    // Simulate sending feedback
    setTimeout(() => {
      setFeedbackLoading(false);
      addToast('Feedback submitted successfully! Thank you.', 'success');
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [formId, setFormId] = useState('');

  const handleViewResponses = async () => {
    if (!formId) return;
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      // Fetch responses
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
    <div className="space-y-12">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
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

      {needsAuth ? (
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center max-w-md mx-auto">
          <h3 className="text-xl font-bold text-white mb-4 space-grotesk">Admin Feedback Portal</h3>
          <p className="text-slate-400 text-sm mb-6">Sign in with an authorized Google account to view direct feedback submissions via Google Forms.</p>
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center justify-center w-full gap-3 bg-white text-black font-medium py-3 px-4 rounded-full hover:bg-slate-100 transition-colors"
          >
            {loading ? 'Signing in...' : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 48 48">
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
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        </div>
      ) : (
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-yellow-400 space-grotesk">Secretariat Form Responses</h3>
            <button onClick={logout} className="text-xs text-slate-400 hover:text-white">Sign Out</button>
          </div>

          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              placeholder="Paste Google Form ID here"
              className="flex-1 bg-slate-800 text-white placeholder:text-slate-500 rounded-lg px-4 py-2 border border-white/10 focus:outline-none focus:border-yellow-400"
            />
            <button 
              onClick={handleViewResponses}
              disabled={loading || !formId}
              className="bg-yellow-400 text-slate-900 px-6 py-2 rounded-lg font-medium hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'View'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {responses.length === 0 && !loading && !error && (
              <p className="text-slate-400 text-sm text-center py-4">No responses found or waiting for input.</p>
            )}
            {responses.map((response: any, idx: number) => (
              <div key={response.responseId || idx} className="p-4 dark:bg-slate-800/50 bg-slate-200/50 rounded-xl border border-white/5">
                <p className="text-xs text-slate-500 mb-2">Response ID: {response.responseId} - {new Date(response.createTime).toLocaleString()}</p>
                <div className="space-y-2">
                  {Object.keys(response.answers || {}).map(qId => {
                    const answer = response.answers[qId];
                    const text = answer?.textAnswers?.answers?.[0]?.value || 'N/A';
                    return (
                      <div key={qId}>
                        <p className="text-sm font-medium text-slate-300">Question ID: {qId}</p>
                        <p className="text-sm text-yellow-100">{text}</p>
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
  );
};
