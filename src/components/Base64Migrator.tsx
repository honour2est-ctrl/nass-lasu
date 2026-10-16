import React, { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

// ============================================================================
// ONE-TIME TOOL: moves images that were saved as base64 text inside Firestore
// (values starting with "data:image/...") into Firebase Storage, then replaces
// them with normal download links. This makes pages smaller and faster, and
// repairs gallery lists that were broken by base64 commas.
//
// Safe by design:
//  - "Scan" only reads. Nothing changes until you click "Move images".
//  - A document is only updated AFTER all of its images uploaded successfully.
//  - Only fields whose names look like image fields are touched.
// ============================================================================

const BASE_COLLECTIONS = [
  'executives',
  'ssrcMembers',
  'studentBrands',
  'events',
  'hallOfFame',
  'partners',
  'sponsors',
  'landmarks',
  'announcements',
  'siteContent',
  'site_content',
];

const IMAGE_FIELD = /image|img|logo|photo|cover|gallery|avatar|banner|^value$/i;
const DATA_URL = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=_-]+/g;

interface Target {
  coll: string;
  id: string;
  fields: Record<string, any>; // only the fields that contain base64
}

const findDataUrls = (value: any): string[] => {
  if (typeof value === 'string') return value.match(DATA_URL) || [];
  if (Array.isArray(value)) return value.flatMap((v) => (typeof v === 'string' ? v.match(DATA_URL) || [] : []));
  return [];
};

const uploadDataUrl = async (dataUrl: string): Promise<string> => {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
  const fileRef = ref(storage, `uploads/migrated_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`);
  await uploadBytes(fileRef, blob, {
    contentType: blob.type || 'image/jpeg',
    cacheControl: 'public,max-age=31536000',
  });
  return await getDownloadURL(fileRef);
};

export const Base64Migrator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [targets, setTargets] = useState<Target[] | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) => setLog((prev) => [...prev, line]);

  const scan = async () => {
    setBusy(true);
    setLog([]);
    setTargets(null);
    try {
      const names = new Set<string>(BASE_COLLECTIONS);
      try {
        const cfg = await getDocs(collection(db, 'adminSectionConfigs'));
        cfg.forEach((d) => {
          const c = (d.data() as any).collection;
          if (typeof c === 'string' && c.trim()) names.add(c.trim());
        });
      } catch {
        /* custom sections are optional */
      }

      const found: Target[] = [];
      for (const name of names) {
        try {
          const snap = await getDocs(collection(db, name));
          snap.forEach((d) => {
            const data = d.data() as Record<string, any>;
            const fields: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
              if (IMAGE_FIELD.test(key) && findDataUrls(value).length > 0) fields[key] = value;
            }
            if (Object.keys(fields).length > 0) found.push({ coll: name, id: d.id, fields });
          });
        } catch (err: any) {
          addLog(`Skipped "${name}": ${err?.message || 'could not read'}`);
        }
      }

      setTargets(found);
      if (found.length === 0) addLog('Scan complete: no base64 images found. Nothing to fix.');
      else {
        const imageCount = found.reduce((n, t) => n + Object.values(t.fields).reduce((m, v) => m + findDataUrls(v).length, 0), 0);
        addLog(`Scan complete: ${imageCount} base64 image(s) in ${found.length} document(s). Nothing has been changed yet.`);
      }
    } catch (err: any) {
      addLog(`Scan failed: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  const migrate = async () => {
    if (!targets || targets.length === 0) return;
    if (!window.confirm(`Move images for ${targets.length} document(s) into Firebase Storage? Each document is only updated after its uploads succeed.`)) return;
    setBusy(true);
    let okDocs = 0;
    let failedDocs = 0;

    for (const t of targets) {
      try {
        const urlMap = new Map<string, string>();
        const updates: Record<string, any> = {};

        for (const [field, value] of Object.entries(t.fields)) {
          for (const dataUrl of findDataUrls(value)) {
            if (!urlMap.has(dataUrl)) urlMap.set(dataUrl, await uploadDataUrl(dataUrl));
          }
          const swap = (s: string) => {
            let out = s;
            urlMap.forEach((url, dataUrl) => { out = out.split(dataUrl).join(url); });
            return out;
          };
          updates[field] = Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? swap(v) : v)) : swap(value);
        }

        await updateDoc(doc(db, t.coll, t.id), updates);
        okDocs++;
        addLog(`Fixed ${t.coll}/${t.id} (${urlMap.size} image(s))`);
      } catch (err: any) {
        failedDocs++;
        addLog(`FAILED ${t.coll}/${t.id}: ${err?.message || err} (left unchanged)`);
      }
    }

    addLog(`Done. ${okDocs} document(s) fixed, ${failedDocs} failed. Run Scan again to confirm.`);
    setTargets(null);
    setBusy(false);
  };

  return (
    <div className="w-full mt-6 flex flex-col items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
      >
        {isOpen ? 'Close Image Fixer' : 'Speed Up Images (Admin)'}
      </button>

      {isOpen && (
        <div className="w-full mt-6 p-6 rounded-3xl border border-yellow-400/40 bg-slate-900/90 text-left shadow-2xl">
          <h4 className="font-black text-yellow-400 uppercase tracking-wider text-sm mb-1">Move Base64 Images To Storage</h4>
          <p className="text-xs text-slate-400 mb-4">
            Finds images saved directly inside the database (which slow the site down) and moves them to Firebase Storage. Scan first; nothing changes until you confirm.
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={scan}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              {busy && !targets ? 'Working...' : '1. Scan (read only)'}
            </button>
            <button
              onClick={migrate}
              disabled={busy || !targets || targets.length === 0}
              className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-xs font-extrabold disabled:opacity-40 cursor-pointer"
            >
              {busy && targets ? 'Moving images...' : '2. Move images'}
            </button>
          </div>

          {targets && targets.length > 0 && (
            <ul className="mb-4 max-h-40 overflow-y-auto text-[11px] text-slate-300 space-y-1 p-3 rounded-xl bg-slate-950 border border-white/10">
              {targets.map((t) => (
                <li key={`${t.coll}/${t.id}`}>
                  {t.coll}/{t.id}: {Object.keys(t.fields).join(', ')}
                </li>
              ))}
            </ul>
          )}

          {log.length > 0 && (
            <div className="max-h-48 overflow-y-auto text-[11px] font-mono text-slate-300 space-y-1 p-3 rounded-xl bg-slate-950 border border-white/10">
              {log.map((l, i) => (
                <div key={i} className={l.startsWith('FAILED') || l.startsWith('Scan failed') ? 'text-red-400' : ''}>{l}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
