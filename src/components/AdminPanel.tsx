import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../lib/firebase';
import {
  Shield, Plus, Trash2, Edit, Search, Eye, Upload, Loader2, FolderKanban,
  X, Save, Image as ImageIcon, LogOut, AlertTriangle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { AdminField, AdminSection, BUILT_IN_SECTIONS, blankItemFor, withOrderField, sortByOrder } from '../adminSections';
import { isAuthorizedAdmin } from '../adminAuth';

// ============================================================================
// FILE / IMAGE UPLOAD HELPERS
// ============================================================================

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target?.result as string; };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.65));
          return;
        }
        resolve(img.src);
      };
      img.onerror = () => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      };
      reader.readAsDataURL(file);
    } else {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    }
  });
};

// Resize/compress an image file to a Blob before it ever leaves the browser.
// This is what actually fixes "images take forever to show" — a raw phone
// photo can be 3-8MB; this brings it down to roughly 100-300KB while still
// looking sharp at the sizes the site displays images at.
const compressImageToBlob = (file: File, maxDim = 1600, quality = 0.82): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    reader.onerror = reject;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : resolve(file)), 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

const uploadFile = async (file: File): Promise<string> => {
  try {
    const isImage = file.type.startsWith('image/');
    const uploadBody = isImage ? await compressImageToBlob(file) : file;
    const ext = isImage ? 'jpg' : (file.name.split('.').pop() || 'bin');
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[a-zA-Z0-9]+$/, '')}.${ext}`;
    const storageRef = ref(storage, `uploads/${fileName}`);
    await uploadBytes(storageRef, uploadBody);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.warn('Firebase Storage upload failed or unconfigured, falling back to compressed Data URL:', err);
    return await fileToDataUrl(file);
  }
};

const parseGallery = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

// ============================================================================
// REUSABLE INPUT WIDGETS
// ============================================================================

const FileUploadZone = ({ value, onChange, label, highContrast }: { value: string; onChange: (val: string) => void; label: string; highContrast: boolean; }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const processFile = async (file: File) => {
    setIsUploading(true);
    try {
      onChange(await uploadFile(file));
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`w-full rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
        isDragging ? 'border-yellow-400 bg-yellow-400/10' : highContrast ? 'border-white/50 bg-black hover:border-white' : 'border-white/10 bg-slate-900/50 hover:border-white/30'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={async (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) await processFile(e.dataTransfer.files[0]); }}
      onClick={() => !isUploading && document.getElementById(`file-upload-${label}`)?.click()}
    >
      <input
        type="file"
        id={`file-upload-${label}`}
        className="hidden"
        onChange={async (e) => { if (e.target.files?.[0]) { const f = e.target.files[0]; e.target.value = ''; await processFile(f); } }}
        accept="image/*,.pdf,.doc,.docx"
      />
      {isUploading ? (
        <>
          <Loader2 size={32} className="mb-3 text-yellow-400 animate-spin" />
          <p className="text-sm text-white font-bold mb-1">Uploading...</p>
        </>
      ) : (
        <>
          <Upload size={32} className={`mb-3 ${isDragging ? 'text-yellow-400' : 'text-slate-400'}`} />
          <p className="text-sm text-white font-bold mb-1">{value ? 'File Ready' : `Upload ${label}`}</p>
          <p className="text-xs text-slate-400 max-w-full truncate px-2">
            {value ? (value.startsWith('data:') ? 'Image processed & saved' : value.split('/').pop()) : 'Drag & drop, or click to browse'}
          </p>
          {value && (value.startsWith('data:') || value.startsWith('http')) && (
            <div className="mt-3 w-20 h-20 rounded-lg overflow-hidden border border-white/20 shadow-md">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const GalleryUploadZone = ({ value, onChange, highContrast }: { value: string; onChange: (val: string) => void; highContrast: boolean; }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const images = parseGallery(value);

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;
    setIsUploading(true);
    setProgress({ current: 0, total: files.length });
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        uploaded.push(await uploadFile(files[i]));
        setProgress({ current: i + 1, total: files.length });
      }
      onChange(Array.from(new Set([...images, ...uploaded])).join(','));
    } catch (err) {
      console.error('Error batch uploading gallery images:', err);
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl border-2 border-dashed border-yellow-400/30 bg-yellow-400/5 flex flex-col items-center justify-center text-center space-y-3">
        <label className="cursor-pointer flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-yellow-400/20">
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {isUploading ? `Uploading (${progress ? `${progress.current}/${progress.total}` : '...'})` : 'Batch Upload Photos'}
          <input type="file" multiple accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </label>
        <span className="text-[11px] text-slate-400">Select multiple photos at once</span>
        {progress && (
          <div className="w-full bg-slate-900/90 p-3 rounded-xl border border-yellow-400/30 space-y-2 mt-2 text-left">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-300 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
      {images.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-300">Gallery ({images.length} photos)</span>
            <button type="button" onClick={() => onChange('')} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Clear All</button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-white/5">
            {images.map((img, idx) => (
              <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-white/20 shrink-0">
                <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => onChange(images.filter((_, i) => i !== idx).join(','))} className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Renders one field's input, dispatching on the field's declared type.
const AdminFieldInput = ({ field, value, onChange, highContrast }: { field: AdminField; value: any; onChange: (val: any) => void; highContrast: boolean; }) => {
  switch (field.type) {
    case 'textarea':
    case 'richtext':
      return (
        <textarea
          className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white text-sm"
          rows={field.type === 'richtext' ? 10 : 4}
          value={value || ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'select':
      return (
        <select className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white text-sm" value={value || ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    case 'number':
      return (
        <input type="number" className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white text-sm" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
      );
    case 'url':
      return (
        <input type="url" placeholder={field.placeholder || 'https://...'} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white text-sm" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );
    case 'image':
      return <FileUploadZone label={field.label} value={value || ''} onChange={onChange} highContrast={highContrast} />;
    case 'gallery':
      return <GalleryUploadZone value={value || ''} onChange={onChange} highContrast={highContrast} />;
    case 'text':
    default:
      return (
        <input type="text" placeholder={field.placeholder} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white text-sm" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );
  }
};

// ============================================================================
// "+ NEW SECTION" — build a brand-new manageable section without touching code
// ============================================================================

const NewSectionModal = ({ onClose, onCreate, highContrast }: { onClose: () => void; onCreate: (section: AdminSection) => void; highContrast: boolean; }) => {
  const [label, setLabel] = useState('');
  const [fields, setFields] = useState<AdminField[]>([{ key: 'title', label: 'Title', type: 'text' }]);

  const addField = () => setFields([...fields, { key: '', label: '', type: 'text' }]);
  const updateField = (idx: number, patch: Partial<AdminField>) => setFields(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const removeField = (idx: number) => setFields(fields.filter((_, i) => i !== idx));

  const canSave = label.trim().length > 0 && fields.every((f) => f.key.trim() && f.label.trim());

  const handleCreate = () => {
    const collectionName = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `section_${Date.now()}`;
    const section: AdminSection = {
      key: `custom_${collectionName}`,
      label: label.trim(),
      collection: collectionName,
      titleField: fields[0]?.key || 'title',
      subtitleField: fields[1]?.key,
      fields: fields.map((f) => ({ ...f, key: f.key.trim().replace(/\s+/g, '_') })),
      isCustom: true,
    };
    onCreate(section);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto ${highContrast ? 'bg-black border-2 border-white' : 'bg-slate-900 border border-white/10'}`}>
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-bold text-white">New Section</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-xs text-slate-400">
          This creates a new tab in the Admin Panel backed by its own Firestore collection — no code needed. Add whatever fields this section should have.
        </p>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Section Name (e.g. "Gallery Album", "Sponsors")</label>
          <input className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm text-white" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Sponsors" />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-slate-400">Fields</label>
          {fields.map((f, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input className="flex-1 bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-white" placeholder="Field label (e.g. Name)" value={f.label} onChange={(e) => updateField(idx, { label: e.target.value, key: e.target.value.trim().toLowerCase().replace(/\s+/g, '_') })} />
              <select className="bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-white" value={f.type} onChange={(e) => updateField(idx, { type: e.target.value as any })}>
                <option value="text">Text</option>
                <option value="textarea">Long Text</option>
                <option value="image">Image</option>
                <option value="gallery">Photo Gallery</option>
                <option value="url">Link</option>
                <option value="number">Number</option>
              </select>
              <button type="button" onClick={() => removeField(idx)} className="text-red-400 hover:text-red-300 p-1"><X size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={addField} className="text-xs text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1"><Plus size={14} /> Add Field</button>
        </div>

        <div className="flex gap-3 pt-2">
          <button disabled={!canSave} onClick={handleCreate} className="bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm">Create Section</button>
          <button onClick={onClose} className="bg-white/10 text-white font-bold px-5 py-2.5 rounded-xl text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN ADMIN PANEL
// ============================================================================

export const AdminPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customSections, setCustomSections] = useState<AdminSection[]>([]);
  const [activeSectionKey, setActiveSectionKey] = useState<string>(BUILT_IN_SECTIONS[0].key);
  const [data, setData] = useState<any[]>([]);
  const [vaultData, setVaultData] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [highContrast, setHighContrast] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showNewSection, setShowNewSection] = useState(false);

  const allSections = useMemo(() => [...BUILT_IN_SECTIONS, ...customSections].map(withOrderField), [customSections]);
  const activeSection = useMemo(() => allSections.find((s) => s.key === activeSectionKey) || allSections[0], [allSections, activeSectionKey]);

  // --- Auth ---
  useEffect(() => {
    try {
      const unsubscribe = auth.onAuthStateChanged(
        (u) => setUser(u),
        (err) => {
          console.warn('Firebase Auth error:', err);
          if (err?.message?.includes('configuration-not-found') || (err as any)?.code === 'auth/configuration-not-found') {
            setAuthError("Firebase Authentication is not enabled for this project. Enable it in Firebase Console -> Authentication -> Get Started.");
          }
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Auth listener error:', e);
    }
  }, []);

  const authorized = isAuthorizedAdmin(user?.email);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      setUser(res.user);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/configuration-not-found' || err?.message?.includes('configuration-not-found')) {
        setAuthError("Firebase Authentication is not enabled for this project. Enable it in Firebase Console -> Authentication -> Get Started -> Sign-in method.");
      } else {
        setAuthError(err?.message || 'Login failed. Please check your connection.');
      }
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { /* ignored */ }
    setUser(null);
  };

  // --- Load custom section configs (live, created via "+ New Section") ---
  useEffect(() => {
    if (!user || !authorized) return;
    const unsub = onSnapshot(collection(db, 'adminSectionConfigs'), (snap) => {
      setCustomSections(snap.docs.map((d) => ({ ...(d.data() as AdminSection), key: `custom_${d.id}` })));
    }, (err) => console.warn('adminSectionConfigs listener error:', err.message));
    return () => unsub();
  }, [user, authorized]);

  const handleCreateSection = async (section: AdminSection) => {
    try {
      await setDoc(doc(db, 'adminSectionConfigs', section.collection), section);
      setShowNewSection(false);
      setActiveSectionKey(section.key);
    } catch (err) {
      console.error('Error creating section:', err);
    }
  };

  const handleDeleteSection = async (section: AdminSection) => {
    if (!window.confirm(`Remove the "${section.label}" tab? (This does not delete existing documents in Firestore, just the tab.)`)) return;
    try {
      await deleteDoc(doc(db, 'adminSectionConfigs', section.collection));
      setActiveSectionKey(BUILT_IN_SECTIONS[0].key);
    } catch (err) {
      console.error('Error deleting section:', err);
    }
  };

  // --- Live data for the active section ---
  useEffect(() => {
    setSelectedIds([]);
    setSearch('');
    if (!user || !authorized || !activeSection) return;
    const q = collection(db, activeSection.collection);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => console.warn('Firestore error in AdminPanel:', error.message));
    return () => unsubscribe();
  }, [user, authorized, activeSection]);

  // --- Vault data, kept separately for the chart (always visible) ---
  useEffect(() => {
    if (!user || !authorized) return;
    const unsub = onSnapshot(collection(db, 'vaultItems'), (snapshot) => {
      setVaultData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => console.warn('Firestore error on vaultItems:', error.message));
    return () => unsub();
  }, [user, authorized]);

  const filteredData = useMemo(() => {
    const base = !search.trim() ? data : data.filter((item) => Object.values(item).some((v) => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())));
    return [...base].sort(sortByOrder);
  }, [data, search]);

  // --- CRUD ---
  const handleAddItem = () => setEditingItem(blankItemFor(activeSection));
  const handleEdit = (item: any) => setEditingItem(item);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !activeSection) return;
    setSaveError(null);
    try {
      const { id, ...updateData } = editingItem;
      if (id) await updateDoc(doc(db, activeSection.collection, id), updateData);
      else await addDoc(collection(db, activeSection.collection), updateData);
      setEditingItem(null);
    } catch (err: any) {
      console.error('Error saving item:', err);
      setSaveError(err?.message || 'Failed to save. The image payload might be too large — try a smaller photo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeSection) return;
    try { await deleteDoc(doc(db, activeSection.collection, id)); } catch (err) { console.error(err); }
  };

  const handleSelectToggle = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  const handleSelectAllToggle = () => setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map((i) => i.id));

  const handleBulkDelete = async () => {
    if (!activeSection || !window.confirm(`Delete ${selectedIds.length} items?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteDoc(doc(db, activeSection.collection, id))));
      setSelectedIds([]);
    } catch (err) { console.error(err); }
  };

  const handleExportCSV = () => {
    const itemsToExport = selectedIds.length > 0 ? filteredData.filter((i) => selectedIds.includes(i.id)) : filteredData;
    if (itemsToExport.length === 0) return;
    const allKeys = Array.from(new Set(itemsToExport.flatMap(Object.keys))) as string[];
    const csvHeader = allKeys.join(',') + '\n';
    const csvRows = itemsToExport.map((item) => allKeys.map((key) => {
      const value = String((item as any)[key] ?? '');
      return value.includes(',') || value.includes('\n') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',')).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeSection.collection}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    const counts: Record<string, { name: string; 'Total Documents': number; 'First Sem': number; 'Second Sem': number }> = {
      Biochem: { name: 'Biochem', 'Total Documents': 0, 'First Sem': 0, 'Second Sem': 0 },
      Microbio: { name: 'Microbio', 'Total Documents': 0, 'First Sem': 0, 'Second Sem': 0 },
      Physics: { name: 'Physics', 'Total Documents': 0, 'First Sem': 0, 'Second Sem': 0 },
      Math: { name: 'Math', 'Total Documents': 0, 'First Sem': 0, 'Second Sem': 0 },
    };
    vaultData.forEach((item) => {
      let deptName = item.department?.replace('Department of ', '') || 'Other';
      if (deptName === 'Biochemistry') deptName = 'Biochem';
      if (deptName === 'Microbiology') deptName = 'Microbio';
      if (deptName === 'Mathematics') deptName = 'Math';
      if (!counts[deptName]) counts[deptName] = { name: deptName, 'Total Documents': 0, 'First Sem': 0, 'Second Sem': 0 };
      counts[deptName]['Total Documents'] += 1;
      if (item.semester === 'First Semester') counts[deptName]['First Sem'] += 1;
      else if (item.semester === 'Second Semester') counts[deptName]['Second Sem'] += 1;
    });
    return Object.values(counts);
  }, [vaultData]);

  // --- Not signed in ---
  if (!user) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl space-y-4">
        <Shield className="w-12 h-12 text-yellow-400 mx-auto" />
        <h3 className="text-xl font-bold text-white space-grotesk">Admin Access</h3>
        <p className="text-slate-400 text-sm">Sign in to manage website content and resources.</p>
        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs text-left space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-red-400">⚠️ Authentication Notice</p>
            <p className="leading-relaxed">{authError}</p>
          </div>
        )}
        <div className="pt-2 flex items-center justify-center">
          <button onClick={handleLogin} className="w-full sm:w-auto bg-yellow-400 text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20 text-sm flex items-center justify-center gap-2">
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  // --- Signed in, but not on the allowlist ---
  if (!authorized) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h3 className="text-xl font-bold text-white space-grotesk">Not Authorized</h3>
        <p className="text-slate-400 text-sm">
          Signed in as <span className="text-white font-bold">{user.email}</span>, but this account isn't on the admin list for this site.
        </p>
        <button onClick={handleLogout} className="text-sm text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1.5 mx-auto"><LogOut size={14} /> Sign Out</button>
      </div>
    );
  }

  // --- Authorized admin view ---
  return (
    <div className={`${highContrast ? 'bg-black border-2 border-white' : 'bg-slate-900/60 backdrop-blur-md border border-white/10'} rounded-2xl p-6 md:p-8 max-w-4xl mx-auto transition-colors duration-300`}>
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-2xl font-bold text-white space-grotesk">Website Administration</h3>
          <p className="text-sm text-slate-400">Logged in as {user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setHighContrast(!highContrast)} className={`p-2 rounded-full transition-colors ${highContrast ? 'bg-white text-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`} title="Toggle High Contrast Mode">
            <Eye size={18} />
          </button>
          <button onClick={handleLogout} className="text-sm text-yellow-400 hover:text-yellow-300">Sign Out</button>
        </div>
      </div>

      <div className={`mb-8 p-4 rounded-xl ${highContrast ? 'bg-black border-2 border-white' : 'bg-white/5 border border-white/10'}`}>
        <h4 className="text-sm font-bold text-white mb-4">Document Distribution by Department</h4>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke={highContrast ? '#ffffff' : '#94a3b8'} fontSize={11} axisLine={false} tickLine={false} />
              <YAxis stroke={highContrast ? '#ffffff' : '#94a3b8'} fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: highContrast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: highContrast ? '#000000' : '#0f172a', borderColor: highContrast ? '#ffffff' : '#334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ fontSize: '13px' }} labelStyle={{ color: highContrast ? '#ffffff' : '#94a3b8', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Total Documents" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="First Sem" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Second Sem" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section tabs — driven entirely by config, add a section and a tab appears automatically */}
      <div className="flex flex-wrap gap-2.5 mb-2">
        {allSections.map((section) => (
          <button
            key={section.key}
            onClick={() => { setActiveSectionKey(section.key); setEditingItem(null); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1.5 ${activeSectionKey === section.key ? 'bg-yellow-400 text-slate-900 shadow-md shadow-yellow-400/20' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            {section.isCustom && <FolderKanban size={14} />}
            {section.label}
          </button>
        ))}
        <button onClick={() => setShowNewSection(true)} className="px-4 py-2 rounded-lg font-bold text-sm bg-white/5 text-yellow-400 hover:bg-white/10 flex items-center gap-1.5 border border-dashed border-yellow-400/30">
          <Plus size={14} /> New Section
        </button>
      </div>
      {activeSection?.isCustom && (
        <div className="mb-6">
          <button onClick={() => handleDeleteSection(activeSection)} className="text-[11px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1">
            <Trash2 size={12} /> Remove "{activeSection.label}" tab
          </button>
        </div>
      )}
      {!activeSection?.isCustom && <div className="mb-6" />}

      {editingItem ? (
        <form onSubmit={handleSaveEdit} className="space-y-4 bg-slate-800/30 p-6 rounded-xl border border-white/10">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
            <h5 className="text-white font-bold">{editingItem.id ? `Edit ${activeSection.label.replace(/s$/, '')}` : `New ${activeSection.label.replace(/s$/, '')}`}</h5>
            <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
          </div>
          {saveError && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold flex items-center justify-between">
              <span>⚠️ {saveError}</span>
              <button type="button" onClick={() => setSaveError(null)} className="text-white hover:text-red-200"><X size={14} /></button>
            </div>
          )}
          {activeSection.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-slate-400 mb-1">{field.label}{field.required && <span className="text-red-400"> *</span>}</label>
              <AdminFieldInput field={field} value={editingItem[field.key]} onChange={(val) => setEditingItem({ ...editingItem, [field.key]: val })} highContrast={highContrast} />
            </div>
          ))}
          <div className="flex gap-4 pt-4">
            <button type="submit" className="bg-yellow-400 text-slate-900 font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2"><Save size={16} /> Save</button>
            <button type="button" onClick={() => setEditingItem(null)} className="bg-white/10 text-white font-bold px-6 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder={`Search ${activeSection.label}...`} value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none transition-colors ${highContrast ? 'bg-black border-2 border-white' : 'bg-slate-900/50 border border-white/10 focus:border-yellow-400/50'}`} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="flex items-center gap-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-2.5 rounded-xl text-xs font-bold"><Trash2 size={14} /> Delete ({selectedIds.length})</button>
              )}
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-white/10 text-white hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-bold">Export CSV</button>
              <button onClick={handleAddItem} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-yellow-400/10 whitespace-nowrap"><Plus size={16} /> Add New</button>
            </div>
          </div>

          {filteredData.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer w-fit">
              <input type="checkbox" checked={selectedIds.length === filteredData.length} onChange={handleSelectAllToggle} className="w-3.5 h-3.5 rounded border-white/10 bg-slate-900 accent-yellow-400" />
              Select all
            </label>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredData.map((item) => {
                const cover = item[activeSection.fields.find((f) => f.type === 'image')?.key || ''] || item.imageUrl || item.image;
                const title = item[activeSection.titleField] || 'Untitled';
                const subtitleRaw = activeSection.subtitleField ? item[activeSection.subtitleField] : '';
                const subtitle = typeof subtitleRaw === 'string' ? subtitleRaw.slice(0, 60) : '';
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className={`${highContrast ? 'bg-black border-2' : 'dark:bg-slate-800/50 bg-slate-200/50 border'} p-4 rounded-xl flex gap-4 items-start transition-colors ${selectedIds.includes(item.id) ? (highContrast ? 'border-yellow-400' : 'border-yellow-400 bg-yellow-400/5') : (highContrast ? 'border-white/50' : 'border-white/5')}`}>
                    <div className="pt-1">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectToggle(item.id)} className="w-4 h-4 rounded border-white/10 bg-slate-900 accent-yellow-400 cursor-pointer" />
                    </div>
                    {cover ? (
                      <img src={cover} alt={title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0"><ImageIcon size={20} /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-white text-sm truncate">{title}</h5>
                      {subtitle && <p className="text-xs text-slate-400 mb-2 truncate">{subtitle}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300 p-2 bg-blue-400/10 rounded-lg transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 p-2 bg-red-400/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredData.length === 0 && <p className="text-slate-500 text-sm col-span-2 text-center py-8">No items yet. Click "Add New" to create one.</p>}
          </div>
        </div>
      )}

      {showNewSection && <NewSectionModal onClose={() => setShowNewSection(false)} onCreate={handleCreateSection} highContrast={highContrast} />}
    </div>
  );
};
