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
import { User as UserIcon, ArrowRight, ArrowUp, Search, Menu, X, BookOpen, MessageSquare, Download, Navigation, Eye, Flame, ChevronLeft, ChevronRight, ShoppingBag, Siren, PhoneCall, MessageCircle, MapPin, ExternalLink, Globe, Handshake, Award } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
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
  
  // New Partners and Sponsors state
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

  const [announcementsData, setAnnouncementsData] = useState<any[]>([
    {
      id: "a1",
      tag: "New Deadline",
      title: "Course Registration Closing Soon",
      description: "Ensure your courses are properly registered before Nov 15th to avoid penalties.",
      event1Date: "NOV 15",
      event1Text: "Portal Closes",
      event2Date: "DEC 02",
      event2Text: "Exams Begin"
    }
  ]);

  useEffect(() => {
    const unsubBrands = onSnapshot(collection(db, 'studentBrands'), (snap) => {
      setStudentBrandsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => console.warn("Firestore listener warning (studentBrands):", error.message));

    const unsubExecs = onSnapshot(collection(db, 'executives'), (snap) => {
      setExecutivesData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => console.warn("Firestore listener warning (executives):", error.message));

    const unsubSsrc = onSnapshot(collection(db, 'ssrcMembers'), (snap) => {
      setSsrcMembersData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => console.warn("Firestore listener warning (ssrcMembers):", error.message));

    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snap) => {
      if (!snap.empty) {
        setAnnouncementsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
      }
    }, (error) => console.warn("Firestore listener warning (announcements):", error.message));

    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => {
      setPartnersData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => console.warn("Firestore listener warning (partners):", error.message));

    const unsubSponsors = onSnapshot(collection(db, 'sponsors'), (snap) => {
      setSponsorsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => console.warn("Firestore listener warning (sponsors):", error.message));

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
    }, (error) => console.warn("Firestore listener warning (events):", error.message));

    const unsubVaultItems = onSnapshot(collection(db, 'vaultItems'), (snap) => {
      setVaultItemsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => console.warn("Firestore listener warning (vaultItems):", error.message));

    const unsubLegislativeDocs = onSnapshot(collection(db, 'legislative_documents'), (snap) => {
      setLegislativeDocsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.warn("Firestore listener warning (legislative_documents):", error.message));

    const unsubCorePillars = onSnapshot(collection(db, 'corePillars'), (snap) => {
      setCorePillarsData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => console.warn("Firestore listener warning (corePillars):", error.message));

    const unsubHallOfFame = onSnapshot(collection(db, 'hallOfFame'), (snap) => {
      setHallOfFameData(snap.empty ? [] : snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(sortByOrder));
    }, (error) => console.warn("Firestore listener warning (hallOfFame):", error.message));

    const updateMapFromSnap = (snap: any, existingMap: Record<string, string>) => {
      const map = { ...existingMap };
      snap.docs.forEach((doc: any) => {
        const d = doc.data();
        const key = d.contentKey || doc.id;
        const val = d.value !== undefined ? d.value : (d.url || d.image || d.text || d.imageUrl || d.name || d.bio || '');
        if (key) map[key] = val;
      });
      return map;
    };

    let combinedMap: Record<string, string> = {};
    const unsubSiteContent = onSnapshot(collection(db, 'siteContent'), (snap) => {
      combinedMap = updateMapFromSnap(snap, combinedMap);
      setSiteContentMap({ ...combinedMap });
    }, (error) => console.warn("Firestore listener warning (siteContent):", error.message));

    const unsubSiteContentAlt = onSnapshot(collection(db, 'site_content'), (snap) => {
      combinedMap = updateMapFromSnap(snap, combinedMap);
      setSiteContentMap({ ...combinedMap });
    }, (error) => console.warn("Firestore listener warning (site_content):", error.message));

    return () => {
      unsubBrands();
      unsubExecs();
      unsubSsrc();
      unsubAnnouncements();
      unsubPartners();
      unsubSponsors();
      unsubEvents();
      unsubVaultItems();
      unsubLegislativeDocs();
      unsubCorePillars();
      unsubHallOfFame();
      unsubSiteContent();
      unsubSiteContentAlt();
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
      try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast(`Successfully downloaded ${docName}!`, 'success');
      } catch (err) {
        window.open(downloadUrl, '_blank');
      }
    } else {
      addToast(`Could not locate ${docName} download URL.`, 'error');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResourceClick = (e: React.MouseEvent<HTMLAnchorElement>, item: any) => {
    e.preventDefault();
    if (item.link) window.open(item.link, '_blank');

    setLastViewedResources(prev => {
      const filtered = prev.filter(p => p.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem('lastViewedResources', JSON.stringify(updated));
      return updated;
    });

    if (item.id) {
      const docRef = doc(db, 'vaultItems', item.id);
      updateDoc(docRef, { viewCount: increment(1) }).catch(() => {});
    }
  };

  const activeMarqueeText = siteContentMap.marquee_text || DEFAULT_MARQUEE;

  return (
    // overflow-x-hidden and max-w-[100vw] prevent mobile horizontal wobble
    <div className={`relative min-h-screen w-full max-w-[100vw] overflow-x-hidden font-sans pb-16 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      <BackgroundEngine />
      <CursorTrail />
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-yellow-400 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      
      <div className="relative z-10 w-full overflow-x-hidden selection:bg-yellow-400 selection:text-slate-900">
        
        {/* Navigation */}
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
              <a href="#executives" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <UserIcon size={14} />
                <span className="hidden lg:inline">Excos</span>
              </a>
              <a href="#vault" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <BookOpen size={14} />
                <span className="hidden lg:inline">Vault</span>
              </a>
              <a href="#brands" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <ShoppingBag size={14} />
                <span className="hidden lg:inline">Market</span>
              </a>
              <a href="#partners" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <Handshake size={14} />
                <span className="hidden lg:inline">Partners</span>
              </a>
              <a href="#sponsors" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <Award size={14} />
                <span className="hidden lg:inline">Sponsors</span>
              </a>
              <a href="#events" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <Eye size={14} />
                <span className="hidden lg:inline">Events</span>
              </a>
              <a href="#hotline" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0">
                <Siren size={14} className="animate-pulse" />
                <span className="hidden lg:inline">Hotline</span>
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

        <main className="flex flex-col gap-32 pb-16 pt-24 overflow-x-hidden">
          
          {/* Hero Section */}
          <section id="hero" className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center">
              <div className="space-y-4">
                <h1 className={`font-space-grotesk text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] bg-gradient-to-r ${isDarkMode ? 'from-white via-white to-yellow-400' : 'from-slate-900 via-slate-800 to-yellow-600'} bg-clip-text text-transparent uppercase`}>
                  NIGERIAN ASSOCIATION OF SCIENCE STUDENTS<br />
                  <span className="text-xl md:text-3xl lg:text-4xl text-yellow-500">LAGOS STATE UNIVERSITY</span>
                </h1>
                <p className="text-yellow-500 font-mono tracking-[0.3em] text-[10px] md:text-xs font-semibold uppercase mt-4">
                  {siteContentMap.hero_tagline || 'Initiative Of A Digitalized Secretariat'}
                </p>
              </div>
              
              <p className={`text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {siteContentMap.hero_subtitle || 'Powering the next generation of science students through immediate access, transparency, and digital excellence.'}
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <a href="#vault" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm">
                  <BookOpen size={16} />
                  <span>Get Started</span>
                </a>
                <a href="#brands" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm">
                  <ShoppingBag size={16} />
                  <span>Explore Marketplace</span>
                </a>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="px-4 max-w-5xl mx-auto w-full">
            <h2 className={`font-space-grotesk text-3xl md:text-5xl font-extrabold mb-12 bg-gradient-to-r ${isDarkMode ? 'from-white to-yellow-400' : 'from-slate-900 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight text-center`}>
              ABOUT NASS-LASU
            </h2>
            <div className={`border rounded-3xl p-8 md:p-12 backdrop-blur-xl ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-xl'}`}>
              <div className="prose max-w-none space-y-6">
                <p className="text-lg leading-relaxed">
                  The <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Nigerian Association of Science Students - Lagos State University Chapter (NASS-LASU)</strong> is the official, indivisible student body representing all duly matriculated, full-time undergraduate students within the LASU Faculty of Science. Operating under the motto <span className="text-yellow-500 italic">"Toward Scientific Advancement,"</span> the association is dedicated to promoting educational development, welfare, and student excellence.
                </p>
              </div>
            </div>
          </section>

          {/* Executives Section */}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent z-10 opacity-90" />
                    <img referrerPolicy="no-referrer" src={ex.imageUrl || undefined} alt={ex.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    <div className="absolute bottom-6 left-6 right-6 z-20">
                      <div className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest rounded backdrop-blur-md bg-yellow-400/20 border border-yellow-400/50 text-yellow-400">
                        {ex.office}
                      </div>
                      <h4 className="text-xl font-bold text-yellow-400 tracking-tight mb-1">
                        {ex.name}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Academic Vault Section */}
          <section id="vault" className="px-4 max-w-4xl mx-auto w-full">
            <div className="text-center mb-10">
              <div className="text-yellow-500 text-4xl mb-4">📚</div>
              <h3 className={`font-space-grotesk text-xl md:text-2xl font-extrabold uppercase tracking-wide mb-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                The Office Of The 36th Vice President (Dami PR)
              </h3>
              <p className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Initiative Of A Digitalized and Innovative Secretariat
              </p>
              <h2 className={`font-space-grotesk text-3xl md:text-5xl font-extrabold bg-gradient-to-r ${isDarkMode ? 'from-white to-yellow-400' : 'from-slate-900 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight mb-2`}>
                ACADEMIC VAULT
              </h2>
            </div>

            <div className="space-y-3">
              {vaultItemsData.map((item) => (
                <div key={item.id} className="p-4 border rounded-2xl flex justify-between items-center bg-white/5 border-white/10">
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.department} • {item.level}</p>
                  </div>
                  <a href={item.link} onClick={(e) => handleResourceClick(e, item)} className="px-4 py-2 bg-yellow-400 text-slate-900 text-xs font-bold rounded-full uppercase">
                    View
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* NEW SECTION: MEET OUR PARTNERS */}
          <section id="partners" className="px-4 max-w-7xl mx-auto w-full">
            <div className="text-center mb-12">
              <div className="text-yellow-500 text-4xl mb-4">🤝</div>
              <h2 className={`font-space-grotesk text-3xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r ${isDarkMode ? 'from-white to-yellow-400' : 'from-slate-900 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight`}>
                MEET OUR PARTNERS
              </h2>
              <p className={`text-sm md:text-base leading-relaxed max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Strategic organizations, student initiatives, and ecosystem enablers collaborating with NASS-LASU toward scientific and career advancement.
              </p>
            </div>

            {partnersData.length === 0 ? (
              <div className="text-center py-12 border rounded-3xl backdrop-blur-xl bg-white/5 border-white/10 text-slate-400 text-xs uppercase tracking-widest font-bold">
                Partners directory will be announced soon.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partnersData.map((partner) => (
                  <div key={partner.id} className={`p-6 rounded-3xl border flex flex-col justify-between backdrop-blur-xl transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-yellow-400/50' : 'bg-white border-slate-200 hover:border-yellow-500 shadow-md'}`}>
                    <div>
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-yellow-400/40 mb-4 bg-black/20 p-2 flex items-center justify-center">
                        <img referrerPolicy="no-referrer" src={partner.logoUrl || '/nass_logo.jpg'} alt={partner.name} className="w-full h-full object-contain" loading="lazy" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-1 block">{partner.partnershipType || 'Official Partner'}</span>
                      <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{partner.name}</h3>
                      <p className={`text-xs leading-relaxed mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{partner.bio}</p>
                      
                      {partner.services && (
                        <div className="mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Focus & Services</span>
                          <div className="flex flex-wrap gap-1.5">
                            {partner.services.split(',').map((srv: string, i: number) => (
                              <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-semibold">{srv.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                      {partner.website && (
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-yellow-400 hover:text-slate-900 transition-colors text-slate-300" title="Website">
                          <Globe size={16} />
                        </a>
                      )}
                      {partner.instagram && (
                        <a href={partner.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-yellow-400 hover:text-slate-900 transition-colors text-slate-300 text-xs font-bold" title="Instagram">
                          IG
                        </a>
                      )}
                      {partner.twitter && (
                        <a href={partner.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-yellow-400 hover:text-slate-900 transition-colors text-slate-300 text-xs font-bold" title="X / Twitter">
                          X
                        </a>
                      )}
                      {partner.linkedin && (
                        <a href={partner.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-yellow-400 hover:text-slate-900 transition-colors text-slate-300 text-xs font-bold" title="LinkedIn">
                          IN
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* NEW SECTION: MEET OUR SPONSORS */}
          <section id="sponsors" className="px-4 max-w-7xl mx-auto w-full">
            <div className="text-center mb-12">
              <div className="text-yellow-500 text-4xl mb-4">🏆</div>
              <h2 className={`font-space-grotesk text-3xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r ${isDarkMode ? 'from-white to-yellow-400' : 'from-slate-900 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight`}>
                MEET OUR SPONSORS
              </h2>
              <p className={`text-sm md:text-base leading-relaxed max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Our generous corporate brands and benefactors powering student projects, faculty events, and educational drives across the faculty.
              </p>
            </div>

            {sponsorsData.length === 0 ? (
              <div className="text-center py-12 border rounded-3xl backdrop-blur-xl bg-white/5 border-white/10 text-slate-400 text-xs uppercase tracking-widest font-bold">
                Sponsors will be updated soon.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sponsorsData.map((sponsor) => (
                  <div key={sponsor.id} className={`p-6 rounded-3xl border flex flex-col justify-between backdrop-blur-xl transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-yellow-400/50' : 'bg-white border-slate-200 hover:border-yellow-500 shadow-md'}`}>
                    <div>
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-yellow-400/40 mb-4 bg-black/20 p-2 flex items-center justify-center">
                        <img referrerPolicy="no-referrer" src={sponsor.logoUrl || '/nass_logo.jpg'} alt={sponsor.name} className="w-full h-full object-contain" loading="lazy" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-1 block">{sponsor.tier || 'Official Sponsor'}</span>
                      <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sponsor.name}</h3>
                      <p className={`text-xs leading-relaxed mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{sponsor.bio}</p>
                      
                      {sponsor.products && (
                        <div className="mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Highlighted Products / Offers</span>
                          <div className="flex flex-wrap gap-1.5">
                            {sponsor.products.split(',').map((prd: string, i: number) => (
                              <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-semibold">{prd.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                      {sponsor.website && (
                        <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-yellow-400 hover:text-slate-900 transition-colors text-slate-300" title="Website">
                          <Globe size={16} />
                        </a>
                      )}
                      {sponsor.instagram && (
                        <a href={sponsor.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-yellow-400 hover:text-slate-900 transition-colors text-slate-300 text-xs font-bold" title="Instagram">
                          IG
                        </a>
                      )}
                      {sponsor.twitter && (
                        <a href={sponsor.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-yellow-400 hover:text-slate-900 transition-colors text-slate-300 text-xs font-bold" title="X / Twitter">
                          X
                        </a>
                      )}
                      {sponsor.linkedin && (
                        <a href={sponsor.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-yellow-400 hover:text-slate-900 transition-colors text-slate-300 text-xs font-bold" title="LinkedIn">
                          IN
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Events Gallery Section */}
          <section id="events" className="px-4 max-w-7xl mx-auto w-full">
            <div className="text-center mb-10">
              <h3 className={`font-space-grotesk text-xl md:text-2xl font-extrabold uppercase tracking-wide mb-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                The Office Of The 36th Social Director (Comr. Big Mike)
              </h3>
              <p className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Initiative Of A Digitalized and Innovative Secretariat
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <h2 className={`font-space-grotesk text-3xl md:text-5xl font-extrabold bg-gradient-to-r ${isDarkMode ? 'from-white to-yellow-400' : 'from-slate-900 to-yellow-600'} bg-clip-text text-transparent uppercase tracking-tight`}>
                EVENTS GALLERY
              </h2>
            </div>
          </section>

          {/* Faculty Hotline & Emergency Section */}
          <section id="hotline" className="px-4 max-w-7xl mx-auto w-full pt-8 space-y-4">
            <div className="text-center">
              <h3 className={`font-space-grotesk text-xl md:text-2xl font-extrabold uppercase tracking-wide mb-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                The Office of The 36th Welfare Director (Comrade Awe Oba)
              </h3>
              <p className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Initiative Of A Digitalized and Innovative Secretariat
              </p>
            </div>
            <EmergencyHotline />
          </section>

          {/* Admin Section */}
          <section id="admin" className="px-4 max-w-7xl mx-auto w-full pt-8">
            <AdminGate>
              <AdminPanel />
            </AdminGate>
          </section>

          {/* Feedback Section */}
          <section id="feedback" className="px-4 max-w-7xl mx-auto w-full pb-12 mt-8">
            <SecretariatFeedback />
          </section>

        </main>
      </div>

      {/* Sticky Bottom Persistent Marquee */}
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
    </div>
  );
}
