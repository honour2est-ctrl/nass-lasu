import React, { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from './Toast';

export function AdminPanel() {
  const { addToast } = useToast();

  // Faculty Dean Admin State
  const [deanName, setDeanName] = useState('');
  const [deanTitle, setDeanTitle] = useState('Dean of Science');
  const [deanBio, setDeanBio] = useState('');
  const [deanImageUrl, setDeanImageUrl] = useState('');
  const [isUploadingDean, setIsUploadingDean] = useState(false);
  const [isLoadingDean, setIsLoadingDean] = useState(true);

  // Load existing Dean info on mount
  useEffect(() => {
    const fetchDeanProfile = async () => {
      try {
        const docRef = doc(db, 'siteContent', 'faculty_dean');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDeanName(data.name || '');
          setDeanTitle(data.title || 'Dean of Science');
          setDeanBio(data.bio || '');
          setDeanImageUrl(data.imageUrl || '');
        }
      } catch (err) {
        console.error("Error fetching dean profile:", err);
      } finally {
        setIsLoadingDean(false);
      }
    };
    fetchDeanProfile();
  }, []);

  // Handle Image File Upload to Firebase Storage
  const handleDeanImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploadingDean(true);
    try {
      const storageRef = ref(storage, `faculty_dean/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setDeanImageUrl(downloadUrl);
      addToast('Dean photo uploaded to storage successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to upload image.', 'error');
    } finally {
      setIsUploadingDean(false);
    }
  };

  // Save Dean Profile to Firestore
  const handleSaveDeanProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deanDocRef = doc(db, 'siteContent', 'faculty_dean');
      await setDoc(deanDocRef, {
        name: deanName || "Prof. A.O. Akinkurolere",
        title: deanTitle || "Dean of Science",
        bio: deanBio,
        imageUrl: deanImageUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      addToast("Dean's profile saved successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to save Dean's profile.", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-2xl font-extrabold text-white font-space-grotesk uppercase tracking-tight">Admin Control Panel</h2>
        <p className="text-xs text-slate-400 mt-1">Manage core website content, faculty profiles, and records.</p>
      </div>

      {/* Faculty Dean Management Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-yellow-400 mb-2 uppercase tracking-wide">Manage Faculty Dean Profile</h3>
        <p className="text-xs text-slate-400 mb-6">Upload or update the Dean's picture, name, title, and welcome statement displayed on the home page.</p>

        {isLoadingDean ? (
          <div className="py-8 text-center text-slate-400 text-xs animate-pulse">Loading Dean profile settings...</div>
        ) : (
          <form onSubmit={handleSaveDeanProfile} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Dean's Full Name</label>
                <input 
                  type="text" 
                  value={deanName} 
                  onChange={(e) => setDeanName(e.target.value)} 
                  placeholder="e.g. Prof. A.O. Akinkurolere" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Official Title</label>
                <input 
                  type="text" 
                  value={deanTitle} 
                  onChange={(e) => setDeanTitle(e.target.value)} 
                  placeholder="e.g. Dean of Science" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Dean's Photo</label>
              <div className="flex items-center gap-4">
                {deanImageUrl && (
                  <img src={deanImageUrl} alt="Dean Preview" className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400 shrink-0" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleDeanImageUpload}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-yellow-400 file:text-slate-900 hover:file:bg-yellow-300 cursor-pointer"
                />
              </div>
              {isUploadingDean && <p className="text-xs text-yellow-400 mt-2 animate-pulse">Uploading photo to Firebase Storage...</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Welcome Bio / Message</label>
              <textarea 
                rows={3}
                value={deanBio} 
                onChange={(e) => setDeanBio(e.target.value)} 
                placeholder="Enter the welcome remark or quote..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400 resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="px-6 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all shadow-lg cursor-pointer"
            >
              Save Dean Profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
