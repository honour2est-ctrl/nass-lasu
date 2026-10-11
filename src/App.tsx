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

function NewsFlashSection({ news, isDarkMode }: { news: any[], isDarkMode: boolean }) {
  return (
    <section id="newsflash" className="px-4 max-w-7xl mx-auto w-full">
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-slate-900/60 border-yellow-400/30' 
          : 'bg-white border-slate-200 shadow-xl'
      }`}>
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

function SubAdminPortal({ isDarkMode }: { isDarkMode: boolean }) {
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'news' | 'gallery'>('news');

  const [newsTitle, setNewsTitle] = useState('');
  const [newsDesc, setNewsDesc] = useState('');
  const [newsLink, setNewsLink] = useState('');
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

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
      addToast('Error publishing bulletin: ' + (err?.message || 'Unknown error'), 'error');
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
      addToast('Error uploading event photo: ' + (err?.message || 'Unknown error'), 'error');
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
    secretariat_description_1: siteContentMap.secretariat_description_1 || "The Secretariat is the administrative backbone of the Faculty of Science Students' Association...",
    secretariat_description_2: siteContentMap.secretariat_description_2 || "As the backbone of innovation within the Faculty...",
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
      secretariat_description_1: siteContentMap.secretariat_description_1 || "The Secretariat is the administrative backbone of the Faculty of Science Students' Association...",
      secretariat_description_2: siteContentMap.secretariat_description_2 || "As the backbone of innovation within the Faculty...",
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
      addToast('Failed to update Secretariat content: ' + (err?.message || 'Unknown error'), 'error');
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    name="secretariat_image_url"
                    placeholder="https://..."
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

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');
  const [executivesData, setExecutivesData] = useState<any[]>([]);
  const [siteContentMap, setSiteContentMap] = useState<Record<string, string>>({});
  const [selectedExecutive, setSelectedExecutive] = useState<any | null>(null);
  const [studentBrandsData, setStudentBrandsData] = useState<any[]>([]);
  const [vaultItemsData, setVaultItemsData] = useState<any[]>([]);
  const [newsFlashData, setNewsFlashData] = useState<any[]>([]);

  useEffect(() => {
    const unsubNewsFlash = onSnapshot(query(collection(db, 'newsFlash'), orderBy('createdAt', 'desc')), (snap) => {
      setNewsFlashData(snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore error:", err.message));

    const unsubBrands = onSnapshot(collection(db, 'studentBrands'), (snap) => {
      setStudentBrandsData(snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sortByOrder));
    }, (err) => console.warn("Firestore error:", err.message));
    
    const unsubExecs = onSnapshot(collection(db, 'executives'), (snap) => {
      setExecutivesData(snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sortByOrder));
    }, (err) => console.warn("Firestore error:", err.message));

    const unsubVaultItems = onSnapshot(collection(db, 'vaultItems'), (snap) => {
      setVaultItemsData(snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sortByOrder));
    }, (err) => console.warn("Firestore error:", err.message));

    const unsubSiteContent = onSnapshot(collection(db, 'siteContent'), (snap) => {
      const map: Record<string, string> = {};
      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        map[d.contentKey || docSnap.id] = d.value ?? '';
      });
      setSiteContentMap(map);
    }, (err) => console.warn("Firestore error:", err.message));

    return () => {
      unsubNewsFlash();
      unsubBrands();
      unsubExecs();
      unsubVaultItems();
      unsubSiteContent();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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
              <a href="#newsflash" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <Globe size={14} className="text-slate-900" />
                <span className="hidden lg:inline">News Flash</span>
              </a>
              <a href="#vision" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <Sparkles size={14} className="text-slate-900" />
                <span className="hidden lg:inline">WebApp Story</span>
              </a>
              <a href="#executives" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <UserIcon size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Excos</span>
              </a>
              <a href="#vault" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <BookOpen size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Vault</span>
              </a>
              <a href="#brands" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <ShoppingBag size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Market</span>
              </a>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full border transition-all flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-yellow-400 hover:bg-white/20' 
                    : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
                }`}
                aria-label="Toggle Theme"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </nav>

        <main className="flex flex-col gap-32 pb-16 pt-24 w-full overflow-x-hidden">
          <section id="hero" className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center">
              <div className="relative inline-flex items-center justify-center mb-1">
                <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 text-white border-y border-x-2 border-yellow-400/70 px-5 sm:px-8 py-1.5 sm:py-2 rounded-full shadow-[0_0_25px_rgba(30,58,138,0.5)] flex items-center gap-2.5">
                  <span className="text-yellow-400 text-xs">🏛️</span>
                  <span className="text-[11px] sm:text-xs md:text-sm font-extrabold uppercase tracking-[0.25em] font-space-grotesk text-yellow-300">
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
              </div>

              <p className={`text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {siteContentMap.hero_subtitle || 'Powering the next generation of science students through immediate access, transparency, and digital excellence.'}
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <a href="#newsflash" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm">
                  <Globe size={16} />
                  <span>News Flash</span>
                </a>
                <a href="#vault" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm">
                  <BookOpen size={16} />
                  <span>Academic Vault</span>
                </a>
              </div>
            </div>
          </section>

          <NewsFlashSection news={newsFlashData} isDarkMode={isDarkMode} />

          <section id="secretariat" className="px-4 max-w-7xl mx-auto w-full pt-8 space-y-12">
            <div className={`p-8 md:p-12 border rounded-3xl backdrop-blur-xl relative overflow-hidden group transition-all flex flex-col gap-8 items-center shadow-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
                <h2 className={`font-space-grotesk text-3xl md:text-5xl font-black mb-2 flex items-center justify-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-yellow-500 text-4xl">🏛️</span> {siteContentMap.secretariat_title || 'The Secretariat'}
                </h2>
                <p className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-6">
                  {siteContentMap.secretariat_subtitle || 'Faculty of Science'}
                </p>
              </div>
            </div>
          </section>

          <section id="admin" className="px-4 max-w-7xl mx-auto w-full pt-8 space-y-8">
            <AdminGate>
              <div className="space-y-8">
                <AdminPanel />
                <SecretariatInlineEditor siteContentMap={siteContentMap} isDarkMode={isDarkMode} />
              </div>
            </AdminGate>

            <SubAdminPortal isDarkMode={isDarkMode} />
          </section>

          <section id="feedback" className="px-4 max-w-7xl mx-auto w-full pb-12 mt-8">
            <SecretariatFeedback />
            
            <div className="pt-8 text-center flex flex-col items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <p>&copy; 2026 NASS LASU 36TH ADMINISTRATION. ALL RIGHTS RESERVED.</p>
              <p className="text-yellow-400 font-bold">Initiated by the Office of the General Secretary, Comr. Onovwiome Honourable.</p>
            </div>
          </section>
        </main>
      </div>

      <aside aria-label="Announcement ticker" className={`fixed bottom-0 left-0 right-0 z-40 h-11 border-t backdrop-blur-md flex items-center overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.7)] ${isDarkMode ? 'border-yellow-400/30 bg-slate-950/95 text-slate-200' : 'border-yellow-500/40 bg-white/95 text-slate-800'}`}>
        <div className="flex items-center gap-12 whitespace-nowrap px-6 text-[11px] font-bold tracking-wider animate-[marquee_28s_linear_infinite]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 shrink-0">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shrink-0" />
              <span>{activeMarqueeText}</span>
            </div>
          ))}
        </div>
      </aside>

      <Chatbot />

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-50 p-3 bg-yellow-400/20 hover:bg-yellow-400/40 border border-yellow-400/50 backdrop-blur-xl text-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
        >
          <ArrowUp size={24} />
        </button>
      )}

      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
