import React, { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from './Toast';

export function AdminPanel() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dean' | 'executives' | 'ssrc' | 'brands' | 'vault' | 'announcements' | 'content'>('dean');

  // Faculty Dean Admin State
  const [deanName, setDeanName] = useState('');
  const [deanTitle, setDeanTitle] = useState('Dean of Science');
  const [deanBio, setDeanBio] = useState('');
  const [deanImageUrl, setDeanImageUrl] = useState('');
  const [isUploadingDean, setIsUploadingDean] = useState(false);
  const [isLoadingDean, setIsLoadingDean] = useState(true);

  // General lists for other tabs
  const [executives, setExecutives] = useState<any[]>([]);
  const [ssrcMembers, setSsrcMembers] = useState<any[]>([]);
  const [studentBrands, setStudentBrands] = useState<any[]>([]);
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});

  // Fetch all collections data on mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // 1. Fetch Dean Profile
      const deanDocRef = doc(db, 'siteContent', 'faculty_dean');
      const deanSnap = await getDoc(deanDocRef);
      if (deanSnap.exists()) {
        const data = deanSnap.data();
        setDeanName(data.name || '');
        setDeanTitle(data.title || 'Dean of Science');
        setDeanBio(data.bio || '');
        setDeanImageUrl(data.imageUrl || '');
      }

      // 2. Fetch Executives
      const execsSnap = await getDocs(collection(db, 'executives'));
      setExecutives(execsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 3. Fetch SSRC Members
      const ssrcSnap = await getDocs(collection(db, 'ssrcMembers'));
      setSsrcMembers(ssrcSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 4. Fetch Student Brands
      const brandsSnap = await getDocs(collection(db, 'studentBrands'));
      setStudentBrands(brandsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 5. Fetch Vault Items
      const vaultSnap = await getDocs(collection(db, 'vaultItems'));
      setVaultItems(vaultSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 6. Fetch Announcements
      const annSnap = await getDocs(collection(db, 'announcements'));
      setAnnouncements(annSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 7. Fetch Site Content
      const contentSnap = await getDocs(collection(db, 'siteContent'));
      const contentMap: Record<string, string> = {};
      contentSnap.docs.forEach(doc => {
        const d = doc.data();
        contentMap[doc.id] = d.value || d.text || d.url || '';
      });
      setSiteContent(contentMap);

    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsLoadingDean(false);
    }
  };

  // Handle Dean Image Upload to Firebase Storage
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

  // Generic item deletion helper
  const handleDeleteItem = async (colName: string, id: string, setter: Function) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, colName, id));
      setter((prev: any[]) => prev.filter(item => item.id !== id));
      addToast("Item deleted successfully.", "success");
    } catch (err) {
      addToast("Failed to delete item.", "error");
    }
  };

  return (
    <div className="space-y-8 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-2xl">
      <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-space-grotesk uppercase tracking-tight">Admin Control Panel</h2>
          <p className="text-xs text-slate-400 mt-1">Manage website settings, executives, marketplace brands, vault items, and the faculty dean profile.</p>
        </div>
        <button 
          onClick={fetchAdminData} 
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider w-fit cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      {/* Admin Tabs Navigation */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
        {[
          { id: 'dean', label: 'Faculty Dean' },
          { id: 'executives', label: `Executives (${executives.length})` },
          { id: 'ssrc', label: `SSRC (${ssrcMembers.length})` },
          { id: 'brands', label: `Market Brands (${studentBrands.length})` },
          { id: 'vault', label: `Vault Items (${vaultItems.length})` },
          { id: 'announcements', label: `Announcements (${announcements.length})` },
          { id: 'content', label: 'Site Content' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-yellow-400 text-slate-900 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Faculty Dean Management */}
      {activeTab === 'dean' && (
        <div className="space-y-6">
          <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-2 uppercase tracking-wide">Faculty Dean Profile Settings</h3>
            <p className="text-xs text-slate-400 mb-6">Update the Dean's picture, full name, official title, and welcome bio statement displayed on the main page directory.</p>

            {isLoadingDean ? (
              <div className="py-8 text-center text-slate-400 text-xs animate-pulse">Loading Dean profile...</div>
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
                      <img src={deanImageUrl} alt="Dean Preview" className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400 shrink-0 shadow-md" />
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
                    rows={4}
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
      )}

      {/* Tab 2: Executives Management */}
      {activeTab === 'executives' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wide">Top Executives List</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {executives.map(ex => (
              <div key={ex.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={ex.imageUrl || '/nass_logo.jpg'} alt={ex.name} className="w-10 h-10 rounded-full object-cover border border-yellow-400/50" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{ex.name}</h4>
                    <p className="text-[10px] text-yellow-400 uppercase tracking-wider">{ex.office}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteItem('executives', ex.id, setExecutives)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: SSRC Members */}
      {activeTab === 'ssrc' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wide">SSRC Legislative Council Members</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {ssrcMembers.map(mem => (
              <div key={mem.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={mem.imageUrl || '/nass_logo.jpg'} alt={mem.name} className="w-10 h-10 rounded-full object-cover border border-yellow-400/50" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{mem.name}</h4>
                    <p className="text-[10px] text-yellow-400 uppercase tracking-wider">{mem.duty}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteItem('ssrcMembers', mem.id, setSsrcMembers)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Student Brands / Marketplace */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wide">Marketplace Student Brands</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {studentBrands.map(brand => (
              <div key={brand.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">{brand.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Owner: <span className="text-yellow-400">{brand.owner}</span></p>
                </div>
                <button 
                  onClick={() => handleDeleteItem('studentBrands', brand.id, setStudentBrands)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Academic Vault Items */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wide">Academic Vault Materials</h3>
          <div className="space-y-2">
            {vaultItems.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <p className="text-[10px] text-slate-400">{item.department} | {item.level} | {item.year}</p>
                </div>
                <button 
                  onClick={() => handleDeleteItem('vaultItems', item.id, setVaultItems)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wide">Faculty Announcements</h3>
          <div className="space-y-2">
            {announcements.map(ann => (
              <div key={ann.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded font-bold uppercase">{ann.tag}</span>
                  <h4 className="text-xs font-bold text-white mt-1">{ann.title}</h4>
                </div>
                <button 
                  onClick={() => handleDeleteItem('announcements', ann.id, setAnnouncements)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Site Content Settings */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wide">General Site Content Values</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(siteContent).map(([key, val]) => (
              <div key={key} className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-wider">{key}</span>
                <p className="text-xs text-slate-300 truncate">{String(val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
