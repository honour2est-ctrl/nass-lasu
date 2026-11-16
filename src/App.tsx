import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { BackgroundEngine } from './components/BackgroundEngine';
import { CursorTrail } from './components/CursorTrail';
const Chatbot = lazy(() => import('./components/Chatbot').then(m => ({ default: m.Chatbot })));
import { AdminGate, SuperAdminOnly } from './components/AdminGate';
import { SecretariatFeedback } from './components/SecretariatFeedback';
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
import { PageantGallery } from './components/PageantGallery';
import { ImageSlideshow } from './components/ImageSlideshow';
import { IntroSplash } from './components/IntroSplash';
import { MobileNav, scrollToSection } from './components/MobileNav';
import { EmergencySheet, EmergencyButton } from './components/EmergencySheet';
import { QuickTiles } from './components/QuickTiles';
import { ShowMoreButton } from './components/ShowMoreButton';
import { ShareButton } from './components/ShareButton';
import { initAnalytics, track } from './lib/analytics';
import { initPwa } from './lib/pwa';
import { Base64Migrator } from './components/Base64Migrator';
import { EmergencyHotline, SQUAD_NUMBERS } from './components/EmergencyHotline';
import { User as UserIcon, ArrowRight, ArrowUp, Search, Menu, X, BookOpen, MessageSquare, Download, Navigation, Eye, Flame, ChevronLeft, ChevronRight, ShoppingBag, Siren, PhoneCall, MessageCircle, MapPin, ExternalLink, Globe, Handshake, Award, PenTool, Trophy, Sparkles, Compass, Cpu, Users, Settings, Calendar, Upload, Bell, Megaphone, Crown, Building2, Plus, Trash2, Edit3, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, increment, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL, listAll, uploadBytes } from 'firebase/storage';
import { db, storage } from './lib/firebase';
import { useToast } from './components/Toast';
import { sortByOrder } from './adminSections';

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text: string, query: string, isDarkMode: boolean) => {
  if (!query.trim()) return text;
  const escapedQuery = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <span key={i} className={`rounded-sm px-0.5 ${isDarkMode ? 'bg-yellow-400/30 text-yellow-300' : 'bg-yellow-500/30 text-yellow-800 font-bold'}`}>{part}</span>
      : part
  );
};

const renderWithBold = (text: string, isDarkMode: boolean) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

// Only allow normal web links (protects against odd values typed into the admin panel)
const safeUrl = (u?: string): string | undefined => (u && /^https?:\/\//i.test(u.trim()) ? u.trim() : undefined);

// Built-in links to the official accounts. An admin can override any of them from
// Admin Panel -> Page Text & Content (social_tiktok / social_instagram / social_youtube).
const DEFAULT_SOCIAL_LINKS: Record<string, string> = {
  social_tiktok: 'https://www.tiktok.com/@nasslasuhub',
  social_instagram: 'https://www.instagram.com/nass.lasuofficial',
  social_youtube: 'https://youtube.com/@nasslasuofficial',
};

// Social platforms for the "Follow Us" section. Logo images live in the /public folder.
// The web address of each one is set by an admin:
// Admin Panel -> Page Text & Content -> social_tiktok / social_instagram / social_youtube
const SOCIAL_PLATFORMS = [
  { key: 'social_tiktok', name: 'TikTok', image: '/social-tiktok.webp' },
  { key: 'social_instagram', name: 'Instagram', image: '/social-instagram.webp' },
  { key: 'social_youtube', name: 'YouTube', image: '/social-youtube.webp' },
];

const INITIAL_EVENTS_DATA = [
  {
    id: 1,
    title: "MR AND MISS NASS LASU FRESHER",
    category: "Science Week",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    images: ["/pageant/cover.jpg","/pageant/pageant-1.webp","/pageant/pageant-10.webp","/pageant/pageant-11.webp","/pageant/pageant-12.jpg","/pageant/pageant-13.jpg","/pageant/pageant-14.jpg","/pageant/pageant-15.jpg","/pageant/pageant-16.jpg","/pageant/pageant-17.jpg","/pageant/pageant-18.jpg","/pageant/pageant-19.jpg","/pageant/pageant-2.webp","/pageant/pageant-20.jpg","/pageant/pageant-21.jpg","/pageant/pageant-22.jpg","/pageant/pageant-23.jpg","/pageant/pageant-24.jpg","/pageant/pageant-25.jpg","/pageant/pageant-26.jpg","/pageant/pageant-27.jpg","/pageant/pageant-28.jpg","/pageant/pageant-3.webp","/pageant/pageant-4.webp","/pageant/pageant-5.webp","/pageant/pageant-6.webp","/pageant/pageant-7.webp","/pageant/pageant-8.webp","/pageant/pageant-9.webp"]
  },
  {
    id: 2,
    title: "NASS LASU DINNER AND AWARD NIGHT",
    category: "Awards and Recognitions",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
    images: ["/awards/awards-1.jpg","/awards/awards-10.jpg","/awards/awards-11.jpg","/awards/awards-12.jpg","/awards/awards-13.jpg","/awards/awards-14.jpg","/awards/awards-15.jpg","/awards/awards-2.jpg","/awards/awards-3.jpg","/awards/awards-4.jpg","/awards/awards-5.jpg","/awards/awards-6.jpg","/awards/awards-7.jpg","/awards/awards-8.jpg","/awards/awards-9.jpg","/awards/cover.jpg"]
  },
  {
    id: 3,
    title: "SCIENCE VS FOOD 3.0",
    category: "Science Vs Food",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    images: ["/science-vs-food/svf-1.jpg","/science-vs-food/svf-10.jpg","/science-vs-food/svf-11.jpg","/science-vs-food/svf-2.jpg","/science-vs-food/svf-3.jpg","/science-vs-food/svf-4.jpg","/science-vs-food/svf-5.jpg","/science-vs-food/svf-6.jpg","/science-vs-food/svf-7.jpg","/science-vs-food/svf-8.jpg","/science-vs-food/svf-9.jpg"]
  }
];

const INITIAL_LANDMARKS_DATA = [
  {
    id: 'relaxation-center',
    title: "Faculty of Science Relaxation Center",
    capacityBadge: "100-Seat Capacity",
    attribution: "Facilitated & Built under the tenure of Comr. Ajayi Aishat (35th NASS LASU President) & Rt. Hon. Ajibola Lala (Steppa Szn)",
    description: "A state-of-the-art 100-seat outdoor relaxation and study hub designed to provide Faculty of Science students with a comfortable, conducive, and collaborative environment for academic revision, group discussions, and social interaction.",
    coverImage: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80"
    ],
    published: true,
    order: 1
  }
];

const DEFAULT_MARQUEE = "Powered By The Digitalized And Innovative Secretariat. Get premium visibility for your business by advertising on the website, send a message to 08141693252 or nasslasu@gmail.com (30% discount for Nass Lasu Students)";

function SecretariatInlineEditor({ siteContentMap, isDarkMode }: { siteContentMap: Record<string, string>, isDarkMode: boolean }) {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    secretariat_title: siteContentMap.secretariat_title || 'The Secretariat',
    secretariat_subtitle: siteContentMap.secretariat_subtitle || 'Faculty of Science',
    secretariat_description_1: siteContentMap.secretariat_description_1 || "The Secretariat is the administrative backbone of the Faculty of Science Students' Association, serving as the custodian of the Association's records, official documents, and institutional memory. It is responsible for managing official correspondence, maintaining accurate records, documenting proceedings, and ensuring the continuity of the Association's activities.",
    secretariat_description_2: siteContentMap.secretariat_description_2 || "As the backbone of innovation within the Faculty, the Secretariat is committed to driving digital transformation, improving communication, and implementing technology-driven systems that promote efficiency, transparency, and better service delivery for every science student.",
    secretariat_phone: siteContentMap.secretariat_phone || '+234 814 169 3252',
    secretariat_email: siteContentMap.secretariat_email || 'nasslasu@gmail.com',
    secretariat_signatory_name: siteContentMap.secretariat_signatory_name || 'Comr. Onovwiome Honourable Onome',
    secretariat_signatory_title: siteContentMap.secretariat_signatory_title || '36th NASS LASU General Secretary',
    secretariat_image_url: siteContentMap.secretariat_image_url || '',
  });

  useEffect(() => {
    setFormData({
      secretariat_title: siteContentMap.secretariat_title || 'The Secretariat',
      secretariat_subtitle: siteContentMap.secretariat_subtitle || 'Faculty of Science',
      secretariat_description_1: siteContentMap.secretariat_description_1 || "The Secretariat is the administrative backbone of the Faculty of Science Students' Association, serving as the custodian of the Association's records, official documents, and institutional memory. It is responsible for managing official correspondence, maintaining accurate records, documenting proceedings, and ensuring the continuity of the Association's activities.",
      secretariat_description_2: siteContentMap.secretariat_description_2 || "As the backbone of innovation within the Faculty, the Secretariat is committed to driving digital transformation, improving communication, and implementing technology-driven systems that promote efficiency, transparency, and better service delivery for every science student.",
      secretariat_phone: siteContentMap.secretariat_phone || '+234 814 169 3252',
      secretariat_email: siteContentMap.secretariat_email || 'nasslasu@gmail.com',
      secretariat_signatory_name: siteContentMap.secretariat_signatory_name || 'Comr. Onovwiome Honourable Onome',
      secretariat_signatory_title: siteContentMap.secretariat_signatory_title || '36th NASS LASU General Secretary',
      secretariat_image_url: siteContentMap.secretariat_image_url || '',
    });
  }, [siteContentMap]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image file size should be less than 5MB', 'error');
      return;
    }

    setUploadingImage(true);
    addToast('Uploading logo to Firebase Storage...', 'info');

    try {
      if (storage) {
        const fileRef = ref(storage, `secretariat_images/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(fileRef);

        setFormData(prev => ({ ...prev, secretariat_image_url: downloadUrl }));
        addToast('Logo uploaded successfully to storage!', 'success');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, secretariat_image_url: reader.result as string }));
          addToast('Logo loaded as local preview.', 'info');
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Error uploading image to storage:', err);
      addToast('Failed to upload image: ' + err.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(formData)) {
        await setDoc(doc(db, 'siteContent', key), {
          contentKey: key,
          value: value
        }, { merge: true });
      }
      addToast('Secretariat content updated successfully!', 'success');
      setIsOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast('Failed to update Secretariat content: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full mt-6 flex flex-col items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Settings size={14} />
        <span>{isOpen ? 'Close Secretariat Editor' : 'Edit Secretariat Details (Admin)'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mt-6"
          >
            <div className={`p-6 sm:p-8 rounded-3xl border text-left shadow-2xl md:backdrop-blur-xl ${isDarkMode ? 'bg-slate-900/90 border-yellow-400/40 text-slate-100' : 'bg-white border-yellow-500/50 text-slate-800'}`}>
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/10">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h4 className="font-space-grotesk text-lg font-black text-yellow-400 uppercase tracking-wider">Secretariat Live Editor</h4>
                  <p className="text-xs text-slate-400">Save changes below to update the live website immediately.</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Section Title</label>
                    <input
                      type="text"
                      name="secretariat_title"
                      value={formData.secretariat_title}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Subtitle</label>
                    <input
                      type="text"
                      name="secretariat_subtitle"
                      value={formData.secretariat_subtitle}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Paragraph 1 (Administrative Role)</label>
                  <textarea
                    name="secretariat_description_1"
                    rows={3}
                    value={formData.secretariat_description_1}
                    onChange={handleChange}
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Paragraph 2 (Digital Transformation)</label>
                  <textarea
                    name="secretariat_description_2"
                    rows={3}
                    value={formData.secretariat_description_2}
                    onChange={handleChange}
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Circular Secretariat Logo</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      name="secretariat_image_url"
                      placeholder="https://... image link or upload logo file below"
                      value={formData.secretariat_image_url}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                    <label className="w-full sm:w-auto shrink-0 px-4 py-2 bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition-colors rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                      <Upload size={14} />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Circular Logo'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploadingImage} className="hidden" />
                    </label>
                  </div>
                  {formData.secretariat_image_url && (
                    <div className="mt-2 w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-400 p-1 bg-slate-950">
                      <img src={formData.secretariat_image_url} alt="Secretariat preview" className="w-full h-full object-cover rounded-full" />
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Official Phone</label>
                    <input
                      type="text"
                      name="secretariat_phone"
                      value={formData.secretariat_phone}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Official Email</label>
                    <input
                      type="email"
                      name=