import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { BackgroundEngine } from './components/BackgroundEngine';
import { CursorTrail } from './components/CursorTrail';
import { Chatbot } from './components/Chatbot';
import { AdminGate } from './components/AdminGate';
import { SecretariatFeedback } from './components/SecretariatFeedback';
import { AdminPanel } from './components/AdminPanel';
import { ImageSlideshow } from './components/ImageSlideshow';
import { PageantGallery } from './components/PageantGallery';
import { EmergencyHotline } from './components/EmergencyHotline';
import { 
  User as UserIcon, ArrowRight, ArrowUp, Search, Menu, X, BookOpen, MessageSquare, 
  Download, Navigation, Eye, Flame, ChevronLeft, ChevronRight, ShoppingBag, Siren, 
  PhoneCall, MessageCircle, MapPin, ExternalLink, Globe, Handshake, Award, PenTool, 
  Trophy, Sparkles, Compass, Cpu, Users, Settings, ShieldCheck, LogOut, Plus, Image as ImageIcon 
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, increment, setDoc, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, getDownloadURL, listAll, uploadBytes } from 'firebase/storage';
import { db, storage } from './lib/firebase';
import { useToast } from './components/Toast';
import { sortByOrder } from './adminSections';

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text: string, queryStr: string, isDarkMode: boolean) => {
  if (!queryStr.trim()) return text;
  const escapedQuery = escapeRegExp(queryStr);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === queryStr.toLowerCase() 
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

const DEFAULT_MARQUEE = "Powered By The Digitalized And Innovative Secretariat. Get premium visibility for your business by advertising on the website, send a message to 08141693252 or nasslasu@gmail.com (30% discount for Nass Lasu Students)";

// ==========================================
// 1. PUBLIC NEWS FLASH SECTION COMPONENT
// ==========================================
function NewsFlashSection({ news, isDarkMode }: { news: any[], isDarkMode: boolean }) {
  return (
    <section id="newsflash" className="px-4 max-w-7xl mx-auto w-full">
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-slate-900/60 border-yellow-400/30' 
          : 'bg-white border-slate-200 shadow-xl'
      }`}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-yellow-400/20 text-yellow-400 rounded-2xl border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
            <Globe className="w-7 h-7 text-yellow-400 animate-[spin_10s_linear_infinite]" />
          </div>
          <div>
            <h2 className={`font-space-grotesk text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              NEWS FLASH
              <span className="text-[10px] bg-red-600/90 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">
                Live Bulletins
              </span>
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Official news announcements and updates from the NASS LASU Secretariat
            </p>
          </div>
        </div>

        {/* Content Grid */}
        {news.length === 0 ? (
          <div className={`text-center py-10 border border-dashed rounded-2xl text-xs uppercase tracking-widest font-bold ${
            isDarkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-400'
          }`}>
            No live news flash posted at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div 
                key={item.id} 
                className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 hover:border-yellow-400/40 shadow-lg' 
                    : 'bg-slate-50 border-slate-200 hover:border-yellow-500 shadow-md'
                }`}
              >
                <div>
                  {item.imageUrl && (
                    <div className="h-48 w-full overflow-hidden bg-black/40">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-slate-900'}`}>{item.title}</h3>
                    <p className={`text-xs whitespace-pre-line leading-relaxed line-clamp-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.description}</p>
                  </div>
                </div>

                {item.externalLink && (
                  <div className="p-5 pt-0">
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-400/10 px-3.5 py-2 rounded-xl border border-yellow-400/30 transition-colors"
                    >
                      Read Details / Action Link <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// 2. DELEGATED SUB-ADMIN PORTAL COMPONENT
// ==========================================
function SubAdminPortal({ isDarkMode }: { isDarkMode: boolean }) {
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'news' | 'gallery'>('news');

  // News Flash Form States
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDesc, setNewsDesc] = useState('');
  const [newsLink, setNewsLink] = useState('');
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Gallery Form States
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('');
  const [galleryImage, setGalleryImage] = useState<File | null>(null);

  const handleSubAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'NASS_MEDIA_2026') { 
      setIsAuthenticated(true);
      addToast('Publicity Sub-Admin Access Granted!', 'success');
    } else {
      addToast('Invalid Media Passcode', 'error');
    }
  };

  const uploadFileToStorage = async (file: File, pathFolder: string): Promise<string> => {
    if (!storage) throw new Error('Storage service is uninitialized');
    const storageRef = ref(storage, `${pathFolder}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      let imageUrl = '';
      if (newsImage) {
        imageUrl = await uploadFileToStorage(newsImage, 'news_flash');
      }

      await addDoc(collection(db, 'newsFlash'), {
        title: newsTitle,
        description: newsDesc,
        externalLink: newsLink,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      addToast('News Flash Bulletin Published Successfully!', 'success');
      setNewsTitle('');
      setNewsDesc('');
      setNewsLink('');
      setNewsImage(null);
    } catch (err: any) {
      console.error(err);
      addToast('Error publishing bulletin: ' + err.message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryImage) return addToast('Please select an event image.', 'error');
    setIsPublishing(true);
    try {
      const imageUrl = await uploadFileToStorage(galleryImage, 'event_gallery');

      await addDoc(collection(db, 'eventGallery'), {
        title: galleryTitle,
        category: galleryCategory,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      addToast('Event Picture Added to Gallery!', 'success');
      setGalleryTitle('');
      setGalleryCategory('');
      setGalleryImage(null);
    } catch (err: any) {
      console.error(err);
      addToast('Error uploading event photo: ' + err.message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`p-6 sm:p-8 rounded-3xl border text-left shadow-2xl backdrop-blur-xl max-w-xl mx-auto my-8 ${
        isDarkMode ? 'bg-slate-900/90 border-yellow-400/30 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="p-2.5 bg-yellow-400/20 text-yellow-400 rounded-xl border border-yellow-400/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-space-grotesk text-lg font-black uppercase text-yellow-400 tracking-wide">Publicity Sub-Admin Gate</h3>
            <p className="text-xs text-slate-400">Delegated access point for News Flash & Media management</p>
          </div>
        </div>

        <form onSubmit={handleSubAdminLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Media Key Passcode</label>
            <input 
              type="password" 
              value={passcode} 
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Sub-Admin Access Key"
              className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yellow-400 ${
                isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold uppercase tracking-widest text-xs py-3 rounded-xl transition-all shadow-lg cursor-pointer"
          >
            Access Media Portal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-8 rounded-3xl border text-left shadow-2xl backdrop-blur-xl my-8 ${
      isDarkMode ? 'bg-slate-900/90 border-yellow-400/40 text-white' : 'bg-white border-slate-300 text-slate-900'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-yellow-400" />
          <div>
            <h3 className="font-space-grotesk text-lg font-black text-yellow-400 uppercase tracking-wide">Delegated Media Dashboard</h3>
            <p className="text-xs text-slate-400">Sub-Admin Access: Manage News Flash & Event Galleries</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)} 
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Exit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'news' 
              ? 'bg-yellow-400 text-slate-900' 
              : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          🌐 Manage News Flash
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'gallery' 
              ? 'bg-yellow-400 text-slate-900' 
              : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          🖼️ Event Picture Gallery
        </button>
      </div>

      {/* News Flash Form */}
      {activeTab === 'news' && (
        <form onSubmit={handleCreateNews} className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-white/10">
          <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Post Live News Bulletin</h4>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Headline / Title</label>
            <input 
              type="text" 
              value={newsTitle} 
              onChange={(e) => setNewsTitle(e.target.value)} 
              placeholder="e.g. Science Week Opening Ceremony Scheduled" 
              className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${
                isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
              required 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Detailed Description</label>
            <textarea 
              rows={4} 
              value={newsDesc} 
              onChange={(e) => setNewsDesc(e.target.value)} 
              placeholder="Provide full bulletin write-up..." 
              className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-yellow-400 ${
                isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`} 
              required 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">External Action Link (Optional)</label>
              <input 
                type="url" 
                value={newsLink} 
                onChange={(e) => setNewsLink(e.target.value)} 
                placeholder="https://..." 
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${
                  isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`} 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Banner Image Attachment</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setNewsImage(e.target.files ? e.target.files[0] : null)} 
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-yellow-400 file:text-slate-900 file:font-bold" 
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isPublishing} 
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold uppercase tracking-widest py-3 rounded-xl text-xs transition-colors mt-2 disabled:opacity-50 cursor-pointer"
          >
            {isPublishing ? 'Publishing Bulletin...' : 'Publish to News Flash'}
          </button>
        </form>
      )}

      {/* Gallery Form */}
      {activeTab === 'gallery' && (
        <form onSubmit={handleCreateGalleryItem} className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-white/10">
          <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Add Photo to Event Gallery</h4>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Photo Title / Caption</label>
            <input 
              type="text" 
              value={galleryTitle} 
              onChange={(e) => setGalleryTitle(e.target.value)} 
              placeholder="e.g. Dinner Night Excellence Awards" 
              className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${
                isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`} 
              required 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Event Category</label>
            <input 
              type="text" 
              value={galleryCategory} 
              onChange={(e) => setGalleryCategory(e.target.value)} 
              placeholder="e.g. Science Week, Dinner, Sports" 
              className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${
                isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`} 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Upload Event Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setGalleryImage(e.target.files ? e.target.files[0] : null)} 
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-yellow-400 file:text-slate-900 file:font-bold" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={isPublishing} 
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold uppercase tracking-widest py-3 rounded-xl text-xs transition-colors mt-2 disabled:opacity-50 cursor-pointer"
          >
            {isPublishing ? 'Uploading Photo...' : 'Upload Event Picture'}
          </button>
        </form>
      )}
    </div>
  );
}

function SecretariatInlineEditor({ siteContentMap, isDarkMode }: { siteContentMap: Record<string, string>, isDarkMode: boolean }) {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
            <div className={`p-6 sm:p-8 rounded-3xl border text-left shadow-2xl backdrop-blur-xl ${isDarkMode ? 'bg-slate-900/90 border-yellow-400/40 text-slate-100' : 'bg-white border-yellow-500/50 text-slate-800'}`}>
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

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Banner Image URL (Optional - leave blank for text only)</label>
                  <input
                    type="text"
                    name="secretariat_image_url"
                    placeholder="https://... image link"
                    value={formData.secretariat_image_url}
                    onChange={handleChange}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
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
                      name="secretariat_email"
                      value={formData.secretariat_email}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Signatory Name</label>
                    <input
                      type="text"
                      name="secretariat_signatory_name"
                      value={formData.secretariat_signatory_name}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Signatory Title</label>
                    <input
                      type="text"
                      name="secretariat_signatory_title"
                      value={formData.secretariat_signatory_title}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-400 ${isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Publishing Updates...' : 'Publish Secretariat Updates'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const { addToast } = useToast();
  const { scrollYProgress } = useScroll();
  const eventsScrollRef = useRef<HTMLDivElement>(null);

  const scrollEvents = (direction: 'left' | 'right') => {
    if (eventsScrollRef.current) {
      const { scrollLeft, clientWidth } = eventsScrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      eventsScrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');
  const [vaultLevelFilter, setVaultLevelFilter] = useState<string | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [eventsData, setEventsData] = useState<any[]>(INITIAL_EVENTS_DATA);
  const [executivesData, setExecutivesData] = useState<any[]>([]);
  const [corePillarsData, setCorePillarsData] = useState<any[]>([]);
  const [hallOfFameData, setHallOfFameData] = useState<any[]>([]);
  const [siteContentMap, setSiteContentMap] = useState<Record<string, string>>({});
  const [selectedExecutive, setSelectedExecutive] = useState<any | null>(null);
  const [selectedEventGallery, setSelectedEventGallery] = useState<{ title: string, images: string[] } | null>(null);
  const [studentBrandsData, setStudentBrandsData] = useState<any[]>([]);
  const [ssrcMembersData, setSsrcMembersData] = useState<any[]>([]);
  const [vaultItemsData, setVaultItemsData] = useState<any[]>([]);
  const [legislativeDocsData, setLegislativeDocsData] = useState<any[]>([]);
  const [downloadingDocType, setDownloadingDocType] = useState<string | null>(null);
  
  // Real-time News Flash State
  const [newsFlashData, setNewsFlashData] = useState<any[]>([]);

  // States for Sponsors and Partners
  const [partnersData, setPartnersData] = useState<any[]>([]);
  const [sponsorsData, setSponsorsData] = useState<any[]>([]);

  const [lastViewedResources, setLastViewedResources] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('lastViewedResources');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    // Listen to Firestore News Flash
    const unsubNewsFlash = onSnapshot(query(collection(db, 'newsFlash'), orderBy('createdAt', 'desc')), (snap) => {
      if (!snap.empty) {
        setNewsFlashData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setNewsFlashData([]);
      }
    }, (error) => {
      console.warn("Firestore listener warning (newsFlash):", error.message);
    });

    const unsubBrands = onSnapshot(collection(db, 'studentBrands'), (snap) => {
      if (!snap.empty) {
        setStudentBrandsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
      } else {
        setStudentBrandsData([]);
      }
    }, (error) => {
      console.warn("Firestore listener warning (studentBrands):", error.message);
    });
    
    const unsubExecs = onSnapshot(collection(db, 'executives'), (snap) => {
      if (!snap.empty) {
        setExecutivesData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
      } else {
        setExecutivesData([]);
      }
    }, (error) => {
      console.warn("Firestore listener warning (executives):", error.message);
    });

    const unsubSsrc = onSnapshot(collection(db, 'ssrcMembers'), (snap) => {
      if (!snap.empty) {
        setSsrcMembersData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
      } else {
        setSsrcMembersData([]);
      }
    }, (error) => {
      console.warn("Firestore listener warning (ssrcMembers):", error.message);
    });

    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => {
      if (!snap.empty) {
        setPartnersData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
      } else {
        setPartnersData([]);
      }
    }, (error) => {
      console.warn("Firestore listener warning (partners):", error.message);
    });

    const unsubSponsors = onSnapshot(collection(db, 'sponsors'), (snap) => {
      if (!snap.empty) {
        setSponsorsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
      } else {
        setSponsorsData([]);
      }
    }, (error) => {
      console.warn("Firestore listener warning (sponsors):", error.message);
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      if (!snap.empty) {
        const fetchedEvents = snap.docs.map(doc => {
          const data = doc.data();
          const initialMatch = INITIAL_EVENTS_DATA.find(i => i.id.toString() === doc.id || i.title?.toUpperCase() === (data.title || '').toUpperCase());
          const rawImages = data.images || initialMatch?.images || [];
          const cleanImages = (Array.isArray(rawImages) ? rawImages : String(rawImages).split(','))
            .map((s: any) => String(s).trim())
            .filter((s: string) => s.startsWith('/') || s.startsWith('./') || s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:'));
          return {
            ...initialMatch,
            ...data,
            id: doc.id,
            images: cleanImages
          };
        });
        setEventsData(fetchedEvents.sort(sortByOrder));
      } else {
        setEventsData(INITIAL_EVENTS_DATA);
      }
    }, (error) => {
      console.warn("Firestore listener warning (events):", error.message);
    });

    const unsubVaultItems = onSnapshot(collection(db, 'vaultItems'), (snap) => {
      if (!snap.empty) {
        setVaultItemsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
      } else {
        setVaultItemsData([]);
      }
    }, (error) => {
      console.warn("Firestore listener warning (vaultItems):", error.message);
    });

    const unsubLegislativeDocs = onSnapshot(collection(db, 'legislative_documents'), (snap) => {
      if (!snap.empty) {
        setLegislativeDocsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setLegislativeDocsData([]);
      }
    }, (error) => {
      console.warn("Firestore listener warning (legislative_documents):", error.message);
    });

    const unsubCorePillars = onSnapshot(collection(db, 'corePillars'), (snap) => {
      setCorePillarsData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => {
      console.warn("Firestore listener warning (corePillars):", error.message);
    });

    const unsubHallOfFame = onSnapshot(collection(db, 'hallOfFame'), (snap) => {
      setHallOfFameData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => {
      console.warn("Firestore listener warning (hallOfFame):", error.message);
    });

    const updateMapFromSnap = (snap: any, existingMap: Record<string, string>) => {
      const map = { ...existingMap };
      snap.docs.forEach((docSnap: any) => {
        const d = docSnap.data();
        const key = d.contentKey || docSnap.id;
        const val = d.value !== undefined ? d.value : (d.url || d.image || d.text || d.imageUrl || d.name || d.bio || '');
        if (key) map[key] = val;
      });
      return map;
    };

    let combinedMap: Record<string, string> = {};
    const unsubSiteContent = onSnapshot(collection(db, 'siteContent'), (snap) => {
      combinedMap = updateMapFromSnap(snap, combinedMap);
      setSiteContentMap({ ...combinedMap });
    }, (error) => {
      console.warn("Firestore listener warning (siteContent):", error.message);
    });

    const unsubSiteContentAlt = onSnapshot(collection(db, 'site_content'), (snap) => {
      combinedMap = updateMapFromSnap(snap, combinedMap);
      setSiteContentMap({ ...combinedMap });
    }, (error) => {
      console.warn("Firestore listener warning (site_content):", error.message);
    });

    return () => {
      unsubNewsFlash();
      unsubBrands();
      unsubExecs();
      unsubSsrc();
      unsubEvents();
      unsubVaultItems();
      unsubLegislativeDocs();
      unsubCorePillars();
      unsubHallOfFame();
      unsubSiteContent();
      unsubSiteContentAlt();
      unsubPartners();
      unsubSponsors();
    };
  }, []);

  const handleDownloadDocument = async (docType: 'constitution' | 'standing_orders') => {
    const isConstitution = docType === 'constitution';
    const docName = isConstitution ? 'NASS LASU Constitution' : 'NASS LASU Standing Orders';
    const defaultFileName = isConstitution ? 'NASS_LASU_CONSTITUTION.pdf' : 'NASS_LASU_STANDING_ORDERS.docx';
    
    setDownloadingDocType(docType);
    addToast(`Downloading ${docName}... Please wait a bit`, 'info');

    let downloadUrl: string | null = null;

    const legMatch = legislativeDocsData.find(item => {
      const typeStr = (item.type || item.docType || item.title || item.name || '').toLowerCase();
      return isConstitution ? typeStr.includes('constitution') : (typeStr.includes('standing') || typeStr.includes('order'));
    });
    if (legMatch && (legMatch.url || legMatch.downloadUrl || legMatch.fileUrl || legMatch.link)) {
      downloadUrl = legMatch.url || legMatch.downloadUrl || legMatch.fileUrl || legMatch.link;
    }

    if (!downloadUrl) {
      const vaultMatch = vaultItemsData.find(item => {
        const titleStr = (item.title || item.name || item.department || '').toLowerCase();
        return isConstitution ? titleStr.includes('constitution') : (titleStr.includes('standing') || titleStr.includes('order'));
      });
      if (vaultMatch && (vaultMatch.link || vaultMatch.url || vaultMatch.downloadUrl || vaultMatch.fileUrl)) {
        downloadUrl = vaultMatch.link || vaultMatch.url || vaultMatch.downloadUrl || vaultMatch.fileUrl;
      }
    }

    if (!downloadUrl && storage) {
      const candidatePaths = isConstitution ? [
        'documents/NASS_LASU_CONSTITUTION.pdf',
        'documents/nass_lasu_constitution.pdf',
        'documents/constitution.pdf',
        'documents/Nass_Lasu_Constitution.pdf',
        'nass_lasu_constitution.pdf',
        'constitution.pdf',
        'NASS_LASU_CONSTITUTION.pdf'
      ] : [
        'documents/NASS_LASU_STANDING_ORDERS.docx',
        'documents/NASS_LASU_STANDING_ORDERS.doc',
        'documents/NASS_LASU_STANDING_ORDERS.pdf',
        'documents/nass_lasu_standing_orders.docx',
        'documents/standing_orders.docx',
        'documents/Nass_Lasu_Standing_Orders.docx',
        'nass_lasu_standing_orders.docx',
        'standing_orders.docx',
        'NASS_LASU_STANDING_ORDERS.docx'
      ];

      for (const path of candidatePaths) {
        try {
          const fileRef = ref(storage, path);
          const url = await getDownloadURL(fileRef);
          if (url) {
            downloadUrl = url;
            break;
          }
        } catch (e) {}
      }

      if (!downloadUrl) {
        try {
          const folderRef = ref(storage, 'documents');
          const res = await listAll(folderRef);
          for (const itemRef of res.items) {
            const nameLower = itemRef.name.toLowerCase();
            const matches = isConstitution ? nameLower.includes('constitution') : (nameLower.includes('standing') || nameLower.includes('order'));
            if (matches) {
              downloadUrl = await getDownloadURL(itemRef);
              break;
            }
          }
        } catch (e) {}
      }
    }

    setDownloadingDocType(null);

    if (downloadUrl) {
      try {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        
        addToast(`Successfully downloaded ${docName}!`, 'success');
      } catch (err) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast(`Successfully downloaded ${docName}!`, 'success');
      }
    } else {
      addToast(`Could not locate ${docName} download URL in backend. Please verify document upload in Admin Panel.`, 'error');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.8) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResourceClick = (e: React.MouseEvent<HTMLAnchorElement>, item: any) => {
    e.preventDefault();
    if (item.link) {
      window.open(item.link, '_blank');
    }

    setLastViewedResources(prev => {
      const filtered = prev.filter(p => p.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem('lastViewedResources', JSON.stringify(updated));
      return updated;
    });

    if (item.id) {
      const docRef = doc(db, 'vaultItems', item.id);
      updateDoc(docRef, {
        viewCount: increment(1)
      }).catch(err => console.error("Error updating view count:", err));
    }
  };

  const activeMarqueeText = siteContentMap.marquee_text || DEFAULT_MARQUEE;

  return (
    <div className={`relative w-full max-w-[100vw] overflow-x-hidden min-h-screen font-sans pb-16 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      <BackgroundEngine />
      <CursorTrail />
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-yellow-400 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      
      <div className="relative z-10 w-full overflow-x-hidden selection:bg-yellow-400 selection:text-slate-900">
        
        {/* Navigation Bar */}
        <nav className={`fixed top-0 w-full z-50 h-16 border-b px-3 md:px-8 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-white/70'}`}>
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <img referrerPolicy="no-referrer" src="/nass_logo.jpg" alt="NASS Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-yellow-400/50" />
              <div>
                <h1 className={`text-xs md:text-sm font-bold tracking-tighter font-space-grotesk uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>NASS LASU</h1>
                <p className={`text-[9px] md:text-[10px] uppercase tracking-widest font-semibold leading-tight ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>36th Administration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-3 text-[11px] uppercase tracking-widest font-semibold overflow-x-auto no-scrollbar">
              <a 
                href="#newsflash" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Globe size={14} className="text-slate-900" />
                <span className="hidden lg:inline">News Flash</span>
              </a>
              <a 
                href="#vision" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Sparkles size={14} className="text-slate-900" />
                <span className="hidden lg:inline">WebApp Story</span>
              </a>
              <a 
                href="#executives" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <UserIcon size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Excos</span>
              </a>
              <a 
                href="#vault" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <BookOpen size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Vault</span>
              </a>
              <a 
                href="#brands" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <ShoppingBag size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Market</span>
              </a>
              <a 
                href="#partners" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Handshake size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Partners</span>
              </a>
              <a 
                href="#sponsors" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Award size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Sponsors</span>
              </a>
              <a 
                href="#events" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Eye size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Events</span>
              </a>
              <a 
                href="#map" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Navigation size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Map</span>
              </a>
              <a 
                href="#hotline" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Siren size={14} className="text-slate-900 animate-pulse" />
                <span className="hidden lg:inline">Hotline</span>
              </a>
              <a 
                href="#sports" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Trophy size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Sports</span>
              </a>

              {/* Crescent Moon / Sun Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full border transition-all flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-yellow-400 hover:bg-white/20' 
                    : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
                }`}
                aria-label="Toggle Theme"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </nav>

        <main className="flex flex-col gap-32 pb-16 pt-24 w-full overflow-x-hidden">
          
          {/* HERO SECTION */}
          <section id="hero" className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center">
              
              {/* TOP EXECUTIVE SEAL */}
              <div className="relative inline-flex items-center justify-center mb-1">
                <div className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full -z-10" />
                <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 text-white border-y border-x-2 border-yellow-400/70 px-5 sm:px-8 py-1.5 sm:py-2 rounded-full shadow-[0_0_25px_rgba(30,58,138,0.5)] flex items-center gap-2.5 transform hover:scale-105 transition-transform duration-300">
                  <span className="text-yellow-400 text-xs">🏛️</span>
                  <span className="text-[11px] sm:text-xs md:text-sm font-extrabold uppercase tracking-[0.25em] font-space-grotesk text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    ABIODUN LED ADMINISTRATION
                  </span>
                  <span className="text-yellow-400 text-xs">🏛️</span>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className={`font-space-grotesk text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] bg-gradient-to-r ${isDarkMode ? 'from-white via-white to-yellow-400' : 'from-slate-900 via-slate-800 to-yellow-600'} bg-clip-text text-transparent uppercase`}>
                  NIGERIAN ASSOCIATION OF SCIENCE STUDENTS<br />
                  <span className="text-xl md:text-3xl lg:text-4xl text-yellow-500">LAGOS STATE UNIVERSITY</span>
                </h1>
                
                {/* TAGLINE BADGE */}
                <div className="relative inline-flex items-center justify-center mt-4 group">
                  <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur-xl -z-10 group-hover:bg-yellow-400/30 transition-all duration-500" />
                  
                  <div className="relative overflow-hidden rounded-full border border-yellow-400/40 bg-slate-950/80 px-6 sm:px-8 py-2 backdrop-blur-xl shadow-[0_0_25px_rgba(250,204,21,0.25)] flex items-center gap-3">
                    <div className="absolute inset-0 -translate-x-full animate-[shine_3.5s_infinite_linear] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                    <div className="p-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                      <PenTool size={14} className="text-yellow-400" />
                    </div>

                    <span className="font-mono tracking-[0.25em] text-[11px] sm:text-xs md:text-sm font-black uppercase text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]">
                      {siteContentMap.hero_tagline || 'Initiative Of A Digitalized Secretariat'}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className={`text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {siteContentMap.hero_subtitle || 'Powering the next generation of science students through immediate access, transparency, and digital excellence.'}
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <a 
                  href="#newsflash" 
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm"
                >
                  <Globe size={16} />
                  <span>News Flash</span>
                </a>
                <a 
                  href="#vision" 
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm"
                >
                  <Sparkles size={16} />
                  <span>The WebApp Vision</span>
                </a>
                <a 
                  href="#vault" 
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm"
                >
                  <BookOpen size={16} />
                  <span>Get Started</span>
                </a>
                <a 
                  href="#brands" 
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm"
                >
                  <ShoppingBag size={16} />
                  <span>Marketplace</span>
                </a>
              </div>
            </div>
          </section>

          {/* 1. NEW NEWS FLASH SECTION */}
          <NewsFlashSection news={newsFlashData} isDarkMode={isDarkMode} />

          {/* NASS LASU WEBAPP VISION SECTION */}
          <section id="vision" className="px-4 max-w-7xl mx-auto w-full">
            <div className="text-center mb-14 space-y-3">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-yellow-500 bg-yellow-400/10 border border-yellow-400/30 px-4 py-1.5 rounded-full inline-block">
                36TH ADMINISTRATION
              </span>
              <h2 className={`font-space-grotesk text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r ${isDarkMode ? 'from-white via-yellow-200 to-yellow-400' : 'from-slate-900 via-yellow-700 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight`}>
                NASS LASU WEBAPP
              </h2>
              <p className="text-yellow-400 font-mono text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase">
                THE VISION • THE PROCESS • THE BIRTH
              </p>
              
              <div className="relative inline-flex items-center justify-center pt-2 group">
                <div className="relative overflow-hidden rounded-full border border-yellow-400/40 bg-slate-950/80 px-5 py-1.5 backdrop-blur-xl shadow-[0_0_20px_rgba(250,204,21,0.25)] flex items-center gap-2">
                  <div className="absolute inset-0 -translate-x-full animate-[shine_3.5s_infinite_linear] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                  <PenTool size={12} className="text-yellow-400" />
                  <span className="font-mono tracking-[0.2em] text-[10px] sm:text-xs font-semibold italic text-yellow-300">
                    Initiative of a Digitalized and Innovative Secretariat
                  </span>
                </div>
              </div>
            </div>

            {/* Introductory Lead Card */}
            <div className={`p-8 md:p-12 rounded-3xl border backdrop-blur-xl mb-12 shadow-2xl relative overflow-hidden ${
              isDarkMode 
                ? 'bg-gradient-to-br from-white/5 via-slate-900/60 to-slate-950 border-yellow-400/30 shadow-[0_0_50px_rgba(250,204,21,0.08)]' 
                : 'bg-white border-slate-200 shadow-xl'
            }`}>
              <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-4xl mx-auto space-y-6 text-sm md:text-base leading-relaxed">
                <p className="text-base md:text-lg font-medium leading-relaxed">
                  The <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>NASS LASU WebApp</strong> is one of the flagship initiatives of the <strong className="text-yellow-500">DIGITALIZED AND INNOVATIVE SECRETARIAT</strong> under the Office of the 36th NASS LASU General Secretary, <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Comr. Onovwiome Honourable Onome</strong>.
                </p>
                <p className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                  It was conceived from a simple but transformative vision: <span className="text-yellow-400 font-semibold">to bring the Faculty of Science into a new era of digital accessibility, visibility, connectivity, and innovation.</span>
                </p>
                <p className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                  In an age where technology has become an essential part of education, communication, administration, and institutional development, the Faculty of Science must have a digital presence that reflects the calibre, creativity, and technological potential of its students.
                </p>
                <div className={`p-4 rounded-2xl border-l-4 border-yellow-500 font-semibold ${isDarkMode ? 'bg-yellow-400/10 text-yellow-200' : 'bg-yellow-50 text-slate-800'}`}>
                  The WebApp is therefore envisioned not merely as a website, but as a living digital ecosystem for the Faculty of Science.
                </div>
              </div>
            </div>

            {/* The 3 Pillars */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className={`p-8 rounded-3xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 hover:border-yellow-400/50 hover:shadow-[0_10px_30px_rgba(250,204,21,0.15)]' 
                  : 'bg-white border-slate-200 hover:border-yellow-500 hover:shadow-xl'
              }`}>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center mb-6 shadow-md">
                    <Compass size={24} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-yellow-500 block mb-1">Pillar 01</span>
                  <h3 className={`font-space-grotesk text-2xl font-black mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    THE VISION
                  </h3>
                  <div className={`text-xs md:text-sm leading-relaxed space-y-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <p>To create a centralized digital platform where Science students can easily access academic materials, faculty information, opportunities, announcements, events, departmental resources, student services, and other essential resources.</p>
                    <p>It seeks to reduce the gap between students and information by eliminating total dependence on scattered WhatsApp messages, physical notices, or word-of-mouth.</p>
                    <p>Beyond accessibility, it is designed to rebrand the Faculty of Science in the digital age—presenting it as a community capable of embracing technology, creativity, and modern administration.</p>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-3xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 hover:border-yellow-400/50 hover:shadow-[0_10px_30px_rgba(250,204,21,0.15)]' 
                  : 'bg-white border-slate-200 hover:border-yellow-500 hover:shadow-xl'
              }`}>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center mb-6 shadow-md">
                    <Cpu size={24} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-yellow-500 block mb-1">Pillar 02</span>
                  <h3 className={`font-space-grotesk text-2xl font-black mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    THE PROCESS
                  </h3>
                  <div className={`text-xs md:text-sm leading-relaxed space-y-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <p>The development of the WebApp represents a deliberate effort to transform an idea into a functional digital system capable of serving the Faculty.</p>
                    <p>The process involves identifying relevant services, organizing them into an accessible digital structure, developing the platform, and creating systems for continuous updates that future administrations can build upon.</p>
                    <p>It serves as a digital extension of the Secretariat to progressively document activities, preserve institutional records, and maintain a direct connection with students.</p>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-3xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 hover:border-yellow-400/50 hover:shadow-[0_10px_30px_rgba(250,204,21,0.15)]' 
                  : 'bg-white border-slate-200 hover:border-yellow-500 hover:shadow-xl'
              }`}>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center mb-6 shadow-md">
                    <Sparkles size={24} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-yellow-500 block mb-1">Pillar 03</span>
                  <h3 className={`font-space-grotesk text-2xl font-black mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    THE BIRTH
                  </h3>
                  <div className={`text-xs md:text-sm leading-relaxed space-y-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <p>The birth of the NASS LASU WebApp marks a significant step in the journey toward a more digitalized Faculty of Science.</p>
                    <p>It is a product of the belief that student leadership should not only respond to the needs of the present, but must build systems that remain useful beyond a single administration.</p>
                    <p>The platform is architected with continuity and institutional memory in mind—allowing future administrations to expand and improve rather than rebuilding from ground zero.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ABOUT NASS-LASU */}
          <section id="about" className="px-4 max-w-5xl mx-auto w-full">
            <h2 className={`font-space-grotesk text-3xl md:text-5xl font-extrabold mb-12 bg-gradient-to-r ${isDarkMode ? 'from-white to-yellow-400' : 'from-slate-900 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight text-center`}>
              ABOUT NASS-LASU
            </h2>
            <div className={`border rounded-3xl p-8 md:p-12 backdrop-blur-xl ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-xl'}`}>
              <div className="prose max-w-none space-y-6">
                <p className="text-lg leading-relaxed">
                  The <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Nigerian Association of Science Students - Lagos State University Chapter (NASS-LASU)</strong> is the official, indivisible student body representing all duly matriculated, full-time undergraduate students within the LASU Faculty of Science. Operating under the motto <span className="text-yellow-500 italic">"Toward Scientific Advancement,"</span> the association is dedicated to promoting the educational development, welfare, and unity of its members, while also defending them against all forms of victimization and projecting a positive image of the association.
                </p>
                <div className={`h-px w-full my-8 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                <p className="leading-relaxed">The association represents students across three main academic branches:</p>
                <ul className={`list-disc pl-6 space-y-2 marker:text-yellow-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <li><strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Biological Science:</strong> Biochemistry, Botany, Fisheries and Aquatic Biology, Microbiology, SLT, Zoology and Environment Biology</li>
                  <li><strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Chemical Science:</strong> Chemistry</li>
                  <li><strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Physical Science:</strong> Physics, Mathematics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* EXECUTIVES SECTION */}
          <section id="executives" className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-end justify-between mb-8">
              <h2 className={`font-space-grotesk text-3xl md:text-5xl font-extrabold bg-gradient-to-r ${isDarkMode ? 'from-white to-yellow-400' : 'from-slate-900 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight`}>
                TOP EXECUTIVES
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {executivesData.map((ex) => (
                <div 
                  key={ex.id} 
                  onClick={() => setSelectedExecutive(ex)}
                  className={`group relative rounded-3xl overflow-hidden transition-all cursor-pointer border-[3px] border-t-yellow-300 border-l-yellow-400 border-b-yellow-700 border-r-yellow-600 shadow-[0_5px_15px_rgba(234,179,8,0.4)] ${isDarkMode ? 'bg-white/5' : 'bg-white'} hover:scale-[1.02]`}
                >
                  <div className="aspect-[4/5] overflow-hidden relative rounded-[1.25rem]">
                    <div className="absolute inset-
