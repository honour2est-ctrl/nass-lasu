import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { BackgroundEngine } from './components/BackgroundEngine';
import { CursorTrail } from './components/CursorTrail';
import { Chatbot } from './components/Chatbot';
import { AdminGate } from './components/AdminGate';
import { SecretariatFeedback } from './components/SecretariatFeedback';
import { AdminPanel } from './components/AdminPanel';
import { PageantGallery } from './components/PageantGallery';
import { EmergencyHotline } from './components/EmergencyHotline';
import { User as UserIcon, ArrowRight, ArrowUp, Search, Menu, X, BookOpen, MessageSquare, Download, Navigation, Eye, Flame, ChevronLeft, ChevronRight, ShoppingBag, Siren, PhoneCall, MessageCircle, MapPin, ExternalLink, Globe, Handshake, Award, PenTool, Trophy, Sparkles, Compass, Cpu, Users, Settings, Calendar, Upload, Image as ImageIcon } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
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

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('File size should be under 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, secretariat_image_url: reader.result as string }));
        addToast('Logo uploaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Secretariat Banner / Logo (Upload File Directly)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all active:scale-95">
                      <Upload size={14} />
                      <span>Choose File / Logo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileUpload} 
                        className="hidden" 
                      />
                    </label>
                    
                    {formData.secretariat_image_url && (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-yellow-400/50 shrink-0">
                          <img src={formData.secretariat_image_url} alt="Logo preview" className="w-full h-full object-cover" />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormData(p => ({ ...p, secretariat_image_url: '' }))} 
                          className="text-red-400 hover:text-red-300 text-xs font-bold underline"
                        >
                          Remove Logo
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Upload a JPG/PNG image directly from your device (Max 2MB).</p>
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
    const unsubBrands = onSnapshot(collection(db, 'studentBrands'), (snap) => {
      setStudentBrandsData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (err) => console.warn(err.message));
    
    const unsubExecs = onSnapshot(collection(db, 'executives'), (snap) => {
      setExecutivesData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (err) => console.warn(err.message));

    const unsubSsrc = onSnapshot(collection(db, 'ssrcMembers'), (snap) => {
      setSsrcMembersData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (err) => console.warn(err.message));

    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => {
      setPartnersData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (err) => console.warn(err.message));

    const unsubSponsors = onSnapshot(collection(db, 'sponsors'), (snap) => {
      setSponsorsData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (err) => console.warn(err.message));

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
    }, (err) => console.warn(err.message));

    const unsubVaultItems = onSnapshot(collection(db, 'vaultItems'), (snap) => {
      setVaultItemsData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (err) => console.warn(err.message));

    const unsubLegislativeDocs = onSnapshot(collection(db, 'legislative_documents'), (snap) => {
      setLegislativeDocsData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn(err.message));

    const unsubCorePillars = onSnapshot(collection(db, 'corePillars'), (snap) => {
      setCorePillarsData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (err) => console.warn(err.message));

    let combinedMap: Record<string, string> = {};
    const unsubSiteContent = onSnapshot(collection(db, 'siteContent'), (snap) => {
      snap.docs.forEach((doc) => {
        const d = doc.data();
        const key = d.contentKey || doc.id;
        const val = d.value !== undefined ? d.value : (d.url || d.image || d.text || '');
        if (key) combinedMap[key] = val;
      });
      setSiteContentMap({ ...combinedMap });
    }, (err) => console.warn(err.message));

    return () => {
      unsubBrands();
      unsubExecs();
      unsubSsrc();
      unsubEvents();
      unsubVaultItems();
      unsubLegislativeDocs();
      unsubCorePillars();
      unsubSiteContent();
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

    setDownloadingDocType(null);

    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast(`Successfully downloaded ${docName}!`, 'success');
    } else {
      addToast(`Could not locate ${docName} URL in backend. Please verify document upload in Admin Panel.`, 'error');
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
      updateDoc(docRef, { viewCount: increment(1) }).catch(err => console.error("Error updating view count:", err));
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
        
        {/* TOP NAVIGATION BAR */}
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
              <a href="#events" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <Eye size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Events</span>
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
          
          {/* HERO SECTION */}
          <section id="hero" className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center">
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
                <a href="#vision" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm">
                  <Sparkles size={16} />
                  <span>The WebApp Vision</span>
                </a>
                <a href="#events" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm">
                  <Eye size={16} />
                  <span>View Events</span>
                </a>
              </div>
            </div>
          </section>

          {/* EVENTS & GALLERY SECTION WITH ANIMATED "SWIPE RIGHT" BADGE */}
          <section id="events" className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 block mb-1">
                  FACULTY ACTIVITIES & MEMORIES
                </span>
                <h2 className={`font-space-grotesk text-3xl md:text-5xl font-extrabold bg-gradient-to-r ${isDarkMode ? 'from-white to-yellow-400' : 'from-slate-900 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight`}>
                  EVENTS & GALLERIES
                </h2>
              </div>

              {/* ANIMATED "SWIPE RIGHT" BUTTON */}
              <div className="flex items-center gap-3">
                <motion.div 
                  className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.5)] flex items-center gap-2 border border-yellow-300 cursor-pointer"
                  onClick={() => scrollEvents('right')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>SWIPE RIGHT</span>
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  >
                    <ArrowRight size={16} className="text-slate-950 font-bold" />
                  </motion.div>
                </motion.div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollEvents('left')}
                    className={`p-2.5 rounded-full border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-900'} hover:scale-105 active:scale-95 cursor-pointer`}
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scrollEvents('right')}
                    className={`p-2.5 rounded-full border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-900'} hover:scale-105 active:scale-95 cursor-pointer`}
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div 
              ref={eventsScrollRef} 
              className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory"
            >
              {eventsData.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventGallery({ title: ev.title, images: ev.images })}
                  className={`min-w-[300px] sm:min-w-[360px] md:min-w-[400px] snap-start group relative rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between ${
                    isDarkMode ? 'bg-white/5 border-white/10 hover:border-yellow-400/50' : 'bg-white border-slate-200 hover:border-yellow-500 shadow-md'
                  }`}
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent z-10 opacity-90" />
                    <img 
                      referrerPolicy="no-referrer" 
                      src={ev.image || (ev.images && ev.images[0]) || undefined} 
                      alt={ev.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      loading="lazy" 
                    />
                    <div className="absolute top-4 right-4 z-20">
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 shadow-md">
                        {ev.images ? ev.images.length : 0} Photos
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-500 mb-2 block">
                      {ev.category || 'Faculty Event'}
                    </span>
                    <h3 className={`text-lg font-black tracking-tight uppercase line-clamp-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {ev.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-yellow-400">
                      <span>Explore Gallery</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* EDITABLE SECRETARIAT SECTION */}
          <section id="secretariat" className="px-4 max-w-7xl mx-auto w-full pt-8 space-y-12">
            <div className={`p-8 md:p-12 border rounded-3xl backdrop-blur-xl relative overflow-hidden group transition-all flex flex-col gap-8 items-center shadow-xl ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-yellow-400/30' : 'bg-white border-slate-200 hover:border-yellow-500'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Secretariat Direct Uploaded Logo Display */}
              {siteContentMap.secretariat_image_url && (
                <div className="relative z-10 w-full flex justify-center items-center">
                  <div className="max-w-xs w-full aspect-square rounded-2xl overflow-hidden border-2 border-yellow-400/50 shadow-2xl bg-black/40 p-4 flex items-center justify-center">
                    <img 
                      src={siteContentMap.secretariat_image_url} 
                      alt="Secretariat Logo" 
                      className="max-w-full max-h-full object-contain" 
                      loading="lazy" 
                    />
                  </div>
                </div>
              )}

              <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
                <h2 className={`font-space-grotesk text-3xl md:text-5xl font-black mb-2 flex items-center justify-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-yellow-500 text-4xl">🏛️</span> {siteContentMap.secretariat_title || 'The Secretariat'}
                </h2>
                <p className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-6">
                  {siteContentMap.secretariat_subtitle || 'Faculty of Science'}
                </p>
                
                <div className={`space-y-6 leading-relaxed text-sm md:text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <p>
                    {siteContentMap.secretariat_description_1 || "The Secretariat is the administrative backbone of the Faculty of Science Students' Association, serving as the custodian of the Association's records, official documents, and institutional memory. It is responsible for managing official correspondence, maintaining accurate records, documenting proceedings, and ensuring the continuity of the Association's activities."}
                  </p>
                  <p>
                    {siteContentMap.secretariat_description_2 || "As the backbone of innovation within the Faculty, the Secretariat is committed to driving digital transformation, improving communication, and implementing technology-driven systems that promote efficiency, transparency, and better service delivery for every science student."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ADMIN PANEL WITH INLINE EDITOR */}
          <section id="admin" className="px-4 max-w-7xl mx-auto w-full pt-8">
            <AdminGate>
              <div className="space-y-8">
                <AdminPanel />
                <SecretariatInlineEditor siteContentMap={siteContentMap} isDarkMode={isDarkMode} />
              </div>
            </AdminGate>
          </section>

          {/* SECRETARIAT FEEDBACK */}
          <section id="feedback" className="px-4 max-w-7xl mx-auto w-full pb-12 mt-8">
            <SecretariatFeedback />
          </section>

        </main>
      </div>

      <Chatbot />

      {selectedEventGallery && (
        <PageantGallery
          title={selectedEventGallery.title}
          images={selectedEventGallery.images}
          onClose={() => setSelectedEventGallery(null)}
        />
      )}
    </div>
  );
}
