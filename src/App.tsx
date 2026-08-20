import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { BackgroundEngine } from './components/BackgroundEngine';
import { CursorTrail } from './components/CursorTrail';
import { Chatbot } from './components/Chatbot';
import { SecretariatFeedback } from './components/SecretariatFeedback';
import { AdminPanel } from './components/AdminPanel';
import { ImageSlideshow, fetchFirebaseStorageFolderImages } from './components/ImageSlideshow';
import { PageantGallery } from './components/PageantGallery';
import { EmergencyHotline } from './components/EmergencyHotline';
import { executivesData as staticExecs, ssrcData as staticSsrc, studentBrandsData as staticBrands } from './data';
import { User as UserIcon, ArrowRight, ArrowUp, Search, Menu, X, BookOpen, Vote, MessageSquare, Download, Navigation, Eye, Flame, ChevronLeft, ChevronRight, ShoppingBag, Siren, PhoneCall } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage } from './lib/firebase';
import { useToast } from './components/Toast';

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text;
  const escapedQuery = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <span key={i} className="bg-yellow-400/30 text-yellow-300 rounded-sm px-0.5">{part}</span>
      : part
  );
};

const renderWithBold = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
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

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');
  const [vaultLevelFilter, setVaultLevelFilter] = useState<string | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [eventsData, setEventsData] = useState<any[]>(INITIAL_EVENTS_DATA);
  const [executivesData, setExecutivesData] = useState<any[]>(staticExecs);
  const [selectedExecutive, setSelectedExecutive] = useState<any | null>(null);
  const [selectedEventGallery, setSelectedEventGallery] = useState<{ title: string, images: string[], storageFolder?: string } | null>(null);
  const [studentBrandsData, setStudentBrandsData] = useState<any[]>(staticBrands);
  const [ssrcMembersData, setSsrcMembersData] = useState<any[]>(staticSsrc);
  const [vaultItemsData, setVaultItemsData] = useState<any[]>([]);
  const [legislativeDocsData, setLegislativeDocsData] = useState<any[]>([]);
  const [downloadingDocType, setDownloadingDocType] = useState<string | null>(null);
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
    // Instantly end initial loading skeleton
    setIsLoadingData(false);

    // Prefetch all event image folders in background in parallel
    fetchFirebaseStorageFolderImages("Mr and Miss Nass Lasu Fresher");
    fetchFirebaseStorageFolderImages("Nass Lasu Dinner And Award Night");
    fetchFirebaseStorageFolderImages("Nass Lasu Dinner and Award Night");
    fetchFirebaseStorageFolderImages("Science Vs Food");
    fetchFirebaseStorageFolderImages("Science Vs Food 3.0");
    
    // Fetch data from Firebase
    const unsubBrands = onSnapshot(collection(db, 'studentBrands'), (snap) => {
      if (!snap.empty) {
        setStudentBrandsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => {
      console.warn("Firestore listener warning (studentBrands):", error.message);
    });
    
    const unsubExecs = onSnapshot(collection(db, 'executives'), (snap) => {
      if (!snap.empty) {
        setExecutivesData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => {
      console.warn("Firestore listener warning (executives):", error.message);
    });

    const unsubSsrc = onSnapshot(collection(db, 'ssrcMembers'), (snap) => {
      if (!snap.empty) {
        setSsrcMembersData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => {
      console.warn("Firestore listener warning (ssrcMembers):", error.message);
    });

    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snap) => {
      if (!snap.empty) {
        setAnnouncementsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => {
      console.warn("Firestore listener warning (announcements):", error.message);
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
            storageFolder: data.storageFolder || undefined,
            images: cleanImages
          };
        });
        setEventsData(fetchedEvents);
      } else {
        setEventsData(INITIAL_EVENTS_DATA);
      }
    }, (error) => {
      console.warn("Firestore listener warning (events):", error.message);
    });

    const unsubVaultItems = onSnapshot(collection(db, 'vaultItems'), (snap) => {
      if (!snap.empty) {
        setVaultItemsData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

    return () => {
      unsubBrands();
      unsubExecs();
      unsubSsrc();
      unsubAnnouncements();
      unsubEvents();
      unsubVaultItems();
      unsubLegislativeDocs();
    };
  }, []);

  const handleDownloadDocument = async (docType: 'constitution' | 'standing_orders') => {
    const isConstitution = docType === 'constitution';
    const docName = isConstitution ? 'NASS LASU Constitution' : 'NASS LASU Standing Orders';
    const defaultFileName = isConstitution ? 'NASS_LASU_CONSTITUTION.pdf' : 'NASS_LASU_STANDING_ORDERS.pdf';
    
    setDownloadingDocType(docType);
    addToast(`Searching backend for ${docName}...`, 'info');

    let downloadUrl: string | null = null;

    // 1. Check legislativeDocsData collection from Firestore
    const legMatch = legislativeDocsData.find(item => {
      const typeStr = (item.type || item.docType || item.title || item.name || '').toLowerCase();
      return isConstitution ? typeStr.includes('constitution') : (typeStr.includes('standing') || typeStr.includes('order'));
    });
    if (legMatch && (legMatch.url || legMatch.downloadUrl || legMatch.fileUrl || legMatch.link)) {
      downloadUrl = legMatch.url || legMatch.downloadUrl || legMatch.fileUrl || legMatch.link;
    }

    // 2. Check vaultItemsData for matching document
    if (!downloadUrl) {
      const vaultMatch = vaultItemsData.find(item => {
        const titleStr = (item.title || item.name || item.department || '').toLowerCase();
        return isConstitution ? titleStr.includes('constitution') : (titleStr.includes('standing') || titleStr.includes('order'));
      });
      if (vaultMatch && (vaultMatch.link || vaultMatch.url || vaultMatch.downloadUrl || vaultMatch.fileUrl)) {
        downloadUrl = vaultMatch.link || vaultMatch.url || vaultMatch.downloadUrl || vaultMatch.fileUrl;
      }
    }

    // 3. Search Firebase Storage directly if storage is available
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
        'documents/NASS_LASU_STANDING_ORDERS.pdf',
        'documents/nass_lasu_standing_orders.pdf',
        'documents/standing_orders.pdf',
        'documents/Nass_Lasu_Standing_Orders.pdf',
        'nass_lasu_standing_orders.pdf',
        'standing_orders.pdf',
        'NASS_LASU_STANDING_ORDERS.pdf'
      ];

      for (const path of candidatePaths) {
        try {
          const fileRef = ref(storage, path);
          const url = await getDownloadURL(fileRef);
          if (url) {
            downloadUrl = url;
            break;
          }
        } catch (e) {
          // continue checking
        }
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
        } catch (e) {
          // ignore error
        }
      }
    }

    setDownloadingDocType(null);

    if (downloadUrl) {
      addToast(`Downloading ${docName} to your device...`, 'info');
      try {
        const res = await fetch(downloadUrl);
        const blob = await res.blob();
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
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast(`Opened ${docName} download link!`, 'success');
      }
    } else {
      addToast(`Could not locate ${docName} download URL in backend. Please verify document upload in Admin Panel.`, 'error');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled past ~80vh (hero section height approx)
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

  return (
    <div className="relative min-h-screen font-sans text-slate-200">
      <BackgroundEngine />
      <CursorTrail />
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-yellow-400 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* Content wrapper to sit above background z-0 */}
      <div className="relative z-10 selection:bg-yellow-400 selection:text-slate-900">
        
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 h-16 border-b border-white/10 bg-white/5 backdrop-blur-md px-3 md:px-8 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <img referrerPolicy="no-referrer" src="/nass_logo.jpg" alt="NASS Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-yellow-400/50" />
              <div>
                <h1 className="text-xs md:text-sm font-bold tracking-tighter text-white font-space-grotesk uppercase">NASS LASU</h1>
                <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-semibold leading-tight">36th Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-3 text-[11px] uppercase tracking-widest font-semibold overflow-x-auto no-scrollbar">
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
                href="#events" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Eye size={14} className="text-slate-900" />
                <span className="hidden lg:inline">Events</span>
              </a>
              <a 
                href="#hotline" 
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold p-2 lg:px-3.5 lg:py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 shrink-0"
              >
                <Siren size={14} className="text-slate-900 animate-pulse" />
                <span className="hidden lg:inline">Hotline</span>
              </a>
            </div>
          </div>
        </nav>

        <main className="flex flex-col gap-32 pb-32 pt-24">
          
          {/* Hero Section */}
          <section id="hero" className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center">
              <div className="space-y-4">
                <h1 className="font-space-grotesk text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] bg-gradient-to-r from-white via-white to-yellow-400 bg-clip-text text-transparent uppercase">
                  NIGERIAN ASSOCIATION OF SCIENCE STUDENTS<br />
                  <span className="text-xl md:text-3xl lg:text-4xl text-yellow-500">LAGOS STATE UNIVERSITY</span>
                </h1>
                <p className="text-yellow-400 font-mono tracking-[0.3em] text-[10px] md:text-xs font-semibold uppercase mt-4">
                  Initiative Of A Digitalized Secretariat
                </p>
              </div>
              
              <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Powering the next generation of science students through immediate access, transparency, and digital excellence.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
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
                  <span>Explore Marketplace</span>
                </a>
                <a 
                  href="#about" 
                  className="hidden md:flex bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-8 py-3.5 rounded-full transition-all items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wide text-xs md:text-sm"
                >
                  <Download size={16} />
                  <span>Download App</span>
                </a>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="px-4 max-w-5xl mx-auto w-full">
            <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold mb-12 bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight text-center">
              ABOUT NASS-LASU
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
              <div className="prose prose-invert max-w-none text-slate-300 space-y-6">
                <p className="text-lg leading-relaxed">
                  The <strong className="text-white">Nigerian Association of Science Students - Lagos State University Chapter (NASS-LASU)</strong> is the official, indivisible student body representing all duly matriculated, full-time undergraduate students within the LASU Faculty of Science. Operating under the motto <span className="text-yellow-400 italic">"Toward Scientific Advancement,"</span> the association is dedicated to promoting the educational development, welfare, and unity of its members, while also defending them against all forms of victimization and projecting a positive image of the association.
                </p>
                <div className="h-px w-full bg-white/10 my-8" />
                <p className="leading-relaxed">
                  The association represents students across three main academic branches:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-400 marker:text-yellow-400">
                  <li><strong className="text-white">Biological Science:</strong> Biochemistry, Botany, Fisheries and Aquatic Biology, Microbiology, SLT, Zoology and Environment Biology</li>
                  <li><strong className="text-white">Chemical Science:</strong> Chemistry</li>
                  <li><strong className="text-white">Physical Science:</strong> Physics, Mathematics</li>
                </ul>
                <div className="h-px w-full bg-white/10 my-8" />
                <p className="leading-relaxed">
                  NASS-LASU is structured like a formal micro-government, governed by a strict constitution with distinct branches of power:
                </p>
                <ul className="space-y-4 text-slate-400">
                  <li className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <strong className="text-yellow-400 font-bold text-lg block mb-2">The Executive Arm</strong>
                    Led by the <strong className="text-white">Science Students’ Executive Council (SSEC)</strong>, this body handles the day-to-day administration, organizes activities, and initiates policies and projects. Each individual department also has its own Departmental Students’ Executive Council (DSEC).
                  </li>
                  <li className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <strong className="text-yellow-400 font-bold text-lg block mb-2">The Legislative Arm</strong>
                    Headed by the <strong className="text-white">Science Students’ Representative Council (SSRC)</strong>, this body serves as a strict check and balance on the SSEC.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Digitalized Secretariat */}
          <section id="digitalized" className="px-4 max-w-7xl mx-auto w-full">
            <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold mb-12 bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight">
              CORE PILLARS
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '🗳️', title: "E-Voting", desc: "Secure digital ballot system for faculty elections." },
                { icon: '📚', title: "PDF Vault", desc: "Instant access to academic past questions & materials." },
                { icon: '⚡', title: "Live Info", desc: "Real-time notifications and administrative updates." }
              ].map((F, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl backdrop-blur-xl hover:border-yellow-400/50 transition-all hover:-translate-y-1">
                  <div className="text-yellow-400 text-2xl md:text-3xl mb-4">{F.icon}</div>
                  <h3 className="text-xs font-bold uppercase mb-2 tracking-wide text-white">{F.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{F.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Executives */}
          <section id="executives" className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight">
                TOP EXECUTIVES
              </h2>
              <span className="text-[10px] text-yellow-400 underline cursor-pointer font-bold tracking-widest uppercase">View All</span>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingData ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden animate-pulse">
                    <div className="aspect-[4/5] relative">
                      <div className="absolute bottom-6 left-6 right-6 z-20 space-y-3">
                        <div className="h-5 w-24 bg-yellow-400/20 rounded"></div>
                        <div className="h-8 w-48 bg-white/10 rounded"></div>
                        <div className="h-4 w-32 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                executivesData.map((ex, idx) => {
                  const isGolden = ['President', 'Vice President', 'General Secretary'].includes(ex.office);
                  const borderClasses = isGolden 
                    ? "border-[3px] border-t-yellow-300 border-l-yellow-400 border-b-yellow-700 border-r-yellow-600 shadow-[0_5px_15px_rgba(234,179,8,0.4)]"
                    : "border-[3px] border-t-blue-400 border-l-blue-500 border-b-blue-800 border-r-blue-700 shadow-[0_5px_15px_rgba(59,130,246,0.3)]";
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      key={ex.id} 
                      onClick={() => setSelectedExecutive(ex)}
                      className={`group relative rounded-3xl bg-white/5 backdrop-blur-xl overflow-hidden transition-all cursor-pointer ${borderClasses} hover:scale-[1.02]`}
                    >
                      <div className="aspect-[4/5] overflow-hidden relative rounded-[1.25rem]">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-10 opacity-90" />
                        <img referrerPolicy="no-referrer" src={ex.imageUrl || undefined} alt={ex.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute bottom-6 left-6 right-6 z-20">
                          <div className={`inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest rounded backdrop-blur-md ${isGolden ? 'bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}>
                            {ex.office}
                          </div>
                          <h4 className="text-xl font-bold text-white tracking-tight mb-1">
                            {ex.nickname ? (
                              <div className="flex flex-col gap-1">
                                <span className={`text-3xl font-extrabold uppercase font-space-grotesk ${isGolden ? 'text-yellow-400' : 'text-blue-300'}`}>'{ex.nickname}'</span>
                                <span className="text-base font-normal text-slate-200">{ex.name}</span>
                              </div>
                            ) : (
                              ex.name
                            )}
                          </h4>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">{ex.department}</p>
                            <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1.5 rounded backdrop-blur-md transition-colors ${isGolden ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 group-hover:bg-yellow-400 group-hover:text-slate-900' : 'bg-blue-900/60 text-blue-300 border border-blue-600/50 group-hover:bg-blue-500 group-hover:text-white'}`}>
                              Read More <ArrowRight size={10} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </section>

          {/* SSRC */}
          <section id="ssrc" className="px-4 max-w-7xl mx-auto w-full">
            <h2 className="font-space-grotesk text-2xl md:text-4xl font-extrabold mb-12 bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight">
              SCIENCE STUDENT REPRESENTATIVE COUNCIL<br />
              <span className="text-xl md:text-2xl text-slate-400 block mt-2">(36th Legislative Council)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoadingData ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden animate-pulse">
                    <div className="aspect-[4/5] relative">
                      <div className="absolute bottom-6 left-6 right-6 z-20 space-y-3">
                        <div className="h-5 w-24 bg-yellow-400/20 rounded"></div>
                        <div className="h-6 w-32 bg-white/10 rounded"></div>
                        <div className="h-3 w-20 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                ssrcMembersData.map((mem, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    key={mem.id} 
                    className="group relative rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden hover:border-yellow-400/50 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/5] overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10 opacity-90" />
                      <img referrerPolicy="no-referrer" src={mem.imageUrl || undefined} alt={mem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute bottom-6 left-6 right-6 z-20 text-left">
                        <div className="inline-block px-3 py-1 mb-3 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-[10px] font-bold uppercase tracking-widest rounded backdrop-blur-md">
                          {mem.duty}
                        </div>
                        <h4 className="text-lg font-bold text-white tracking-tight mb-1">{mem.name}</h4>
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">{mem.department}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-12 p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(250,204,21,0.05)]">
              <div>
                <h3 className="font-space-grotesk text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <span>Legislative Documents</span>
                </h3>
                <p className="text-sm text-slate-400">Download the official constitution and standing orders of NASS LASU directly to your device.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <button 
                  onClick={() => handleDownloadDocument('constitution')}
                  disabled={downloadingDocType === 'constitution'}
                  className="px-6 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full font-extrabold text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow.md hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Download size={16} className={downloadingDocType === 'constitution' ? 'animate-bounce' : ''} />
                  <span>{downloadingDocType === 'constitution' ? 'Downloading...' : 'NASS LASU CONSTITUTION'}</span>
                </button>
                <button 
                  onClick={() => handleDownloadDocument('standing_orders')}
                  disabled={downloadingDocType === 'standing_orders'}
                  className="px-6 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full font-extrabold text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Download size={16} className={downloadingDocType === 'standing_orders' ? 'animate-bounce' : ''} />
                  <span>{downloadingDocType === 'standing_orders' ? 'Downloading...' : 'NASS LASU STANDING ORDERS'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Departments */}
          <section id="departments" className="px-4 max-w-7xl mx-auto w-full">
            <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold mb-12 bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight text-center">
              DEPARTMENTS
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Biological Science */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-yellow-400/30 transition-all">
                <h3 className="font-space-grotesk text-xl font-bold text-yellow-400 uppercase tracking-widest mb-6">A. Biological Science</h3>
                <ul className="space-y-4">
                  {[
                    "Department of Biochemistry",
                    "Department of Botany",
                    "Department of Fisheries and Aquatic Biology",
                    "Department of Microbiology",
                    "Department of Science Laboratory Technology",
                    "Department of Zoology and Environment Biology"
                  ].map((dept, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/50 mt-2 shrink-0" />
                      <span className="text-sm text-slate-300 font-medium">{dept}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chemical Science */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-yellow-400/30 transition-all">
                <h3 className="font-space-grotesk text-xl font-bold text-yellow-400 uppercase tracking-widest mb-6">B. Chemical Science</h3>
                <ul className="space-y-4">
                  {[
                    "Department of Chemistry"
                  ].map((dept, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/50 mt-2 shrink-0" />
                      <span className="text-sm text-slate-300 font-medium">{dept}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Physical Science */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-yellow-400/30 transition-all">
                <h3 className="font-space-grotesk text-xl font-bold text-yellow-400 uppercase tracking-widest mb-6">C. Physical Science</h3>
                <ul className="space-y-4">
                  {[
                    "Department of Physics",
                    "Department of Mathematics"
                  ].map((dept, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/50 mt-2 shrink-0" />
                      <span className="text-sm text-slate-300 font-medium">{dept}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* E-Voting Section Placeholder */}
          <section id="e-voting" className="px-4 max-w-4xl mx-auto w-full my-20">
            <div className="text-center mb-10">
              <div className="text-yellow-400 text-4xl mb-4">🗳️</div>
              <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight mb-2">
                E-VOTING PORTAL
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-8">Secure digital ballot system</p>
              
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <Vote className="w-16 h-16 text-slate-500 mx-auto mb-6 opacity-50" />
                  <h3 className="text-2xl font-bold text-white mb-4">Elections Currently Closed</h3>
                  <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                    The faculty e-voting system is currently inactive. Announcements will be made when the next election cycle begins.
                  </p>
                  <button disabled className="px-8 py-3 rounded-xl bg-slate-800 text-slate-500 font-bold uppercase tracking-widest cursor-not-allowed border border-white/5">
                    Login to Vote
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Academic Vault */}
          <section id="vault" className="px-4 max-w-4xl mx-auto w-full">
            <div className="text-center mb-10">
              <div className="text-yellow-400 text-4xl mb-4">📚</div>
              <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight mb-2">
                ACADEMIC VAULT
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-8">Secure access to past questions & syllabi</p>
              
              <div className="relative max-w-md mx-auto mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by department or year..."
                  value={vaultSearchQuery}
                  onChange={(e) => setVaultSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all text-sm"
                />
              </div>

              {/* Level Filter Toggles */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {['All Levels', '100 Level', '200 Level', '300 Level', '400 Level'].map((level) => {
                  const isActive = level === 'All Levels' ? vaultLevelFilter === null : vaultLevelFilter === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setVaultLevelFilter(level === 'All Levels' ? null : level)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors border ${
                        isActive 
                          ? 'bg-yellow-400 text-slate-900 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                          : 'bg-white/5 text-slate-400 border-white/10 hover:border-yellow-400/50 hover:text-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {lastViewedResources.length > 0 && !vaultSearchQuery && (
              <div className="mb-8 space-y-3">
                <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest px-1">Recently Viewed</h3>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-2">
                  {lastViewedResources.map((item, index) => (
                    <motion.div 
                      key={`recent-${item.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-10%" }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-yellow-400/30 transition-colors group/item"
                    >
                      <div className="flex items-center gap-3 text-slate-300">
                        <div className="bg-yellow-400/10 p-1.5 rounded-md group-hover/item:bg-yellow-400/20 transition-colors">
                          <span className="text-yellow-400 text-sm">📄</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium text-white">{item.title || 'Past Questions'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-mono">{item.year || ''} Session</span>
                            {item.department && <span className="text-[9px] text-slate-500 font-mono hidden sm:inline-block truncate max-w-[150px]">{item.department}</span>}
                            {(item.viewCount || 0) > 50 && (
                              <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(249,115,22,0.3)]">
                                <Flame size={10} /> Trending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <a href={item.link || '#'} onClick={(e) => handleResourceClick(e, item)} className="text-[9px] uppercase font-bold tracking-tight px-4 py-2 rounded-full bg-white/5 text-slate-300 hover:bg-yellow-400 hover:text-slate-900 transition-colors border border-white/10 hover:border-yellow-400 inline-block">
                        View Material
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {[
                'Department of Biochemistry',
                'Department of Botany',
                'Department of Fisheries and Aquatic Biology',
                'Department of Microbiology',
                'Department of Science Laboratory Technology',
                'Department of Zoology and Environment Biology',
                'Department of Chemistry',
                'Department of Physics',
                'Department of Mathematics'
              ].map((dept, i) => {
                const query = vaultSearchQuery.toLowerCase();
                const deptMatches = dept.toLowerCase().includes(query);
                
                const deptItems = vaultItemsData.filter(item => item.department === dept);
                
                const levels = ['100 Level', '200 Level', '300 Level', '400 Level'];
                const filteredLevels = vaultLevelFilter ? levels.filter(l => l === vaultLevelFilter) : levels;

                const hasMatchingItems = deptItems.some(item => 
                  filteredLevels.includes(item.level) && 
                  (deptMatches || (item.title && item.title.toLowerCase().includes(query)) || (item.year && item.year.toLowerCase().includes(query)))
                );

                if (query) {
                  if (!hasMatchingItems && !deptMatches) return null;
                }

                return (
                  <details key={i} className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex justify-between items-center p-5 cursor-pointer hover:bg-white/5 transition-colors">
                      <span className="font-bold text-sm tracking-wide text-white">{highlightText(`${dept} Resources`, vaultSearchQuery)}</span>
                      <span className="text-yellow-400 text-sm group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 pt-0 border-t border-white/5 space-y-3 mt-4">
                      {deptItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-slate-900/30 rounded-xl border border-white/5">
                          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2">
                            <BookOpen className="w-5 h-5 text-slate-500" />
                          </div>
                          <p className="text-slate-300 font-medium text-sm">No resources uploaded yet</p>
                          <p className="text-slate-500 text-xs max-w-[250px] leading-relaxed">
                            Check back later. The academic team is currently gathering materials for this department.
                          </p>
                        </div>
                      ) : (
                        filteredLevels.map(level => {
                          const levelItems = deptItems.filter(item => item.level === level && (deptMatches || (item.title && item.title.toLowerCase().includes(query)) || (item.year && item.year.toLowerCase().includes(query))));
                          if (levelItems.length === 0) return null;

                          return (
                            <details key={level} className="group/level bg-slate-800/30 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden border border-white/5">
                              <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-white/5 transition-colors group/summary">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-xs tracking-wide text-slate-200">{level}</span>
                                </div>
                                <span className="text-yellow-400/50 text-xs group-open/level:rotate-180 transition-transform">▼</span>
                              </summary>
                              <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2">
                                {['First Semester', 'Second Semester'].map(semester => {
                                  const semesterItems = levelItems.filter(item => item.semester === semester);
                                  if (semesterItems.length === 0) return null;

                                  return (
                                    <div key={semester} className="space-y-2">
                                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-yellow-400/80 ml-1">{semester}</h4>
                                      <div className="space-y-2">
                                        {semesterItems.map((item, index) => (
                                          <motion.div 
                                            key={item.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-10%" }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-yellow-400/30 transition-colors group/item"
                                          >
                                            <div className="flex items-center gap-3 text-slate-300">
                                              <div className="bg-yellow-400/10 p-1.5 rounded-md group-hover/item:bg-yellow-400/20 transition-colors">
                                                <span className="text-yellow-400 text-sm">📄</span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[11px] font-medium text-white">{highlightText(item.title || 'Past Questions', vaultSearchQuery)}</span>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-[9px] text-slate-400 font-mono">{highlightText(`${item.year || ''} Session`, vaultSearchQuery)}</span>
                                                  {(item.viewCount !== undefined) && (
                                                    <span className="flex items-center gap-1 text-[9px] text-slate-500 font-mono" title={`${item.viewCount} views`}>
                                                      <Eye size={10} /> {item.viewCount}
                                                    </span>
                                                  )}
                                                  {(item.viewCount || 0) > 50 && (
                                                    <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(249,115,22,0.3)]">
                                                      <Flame size={10} /> Trending
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            <a href={item.link || '#'} onClick={(e) => handleResourceClick(e, item)} className="text-[9px] uppercase font-bold tracking-tight px-4 py-2 rounded-full bg-white/5 text-slate-300 hover:bg-yellow-400 hover:text-slate-900 transition-colors border border-white/10 hover:border-yellow-400 inline-block">
                                              View Material
                                            </a>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          );
                        })
                      )}
                    </div>
                  </details>
                );
              })}
              
              {vaultSearchQuery && [
                'Department of Biochemistry',
                'Department of Botany',
                'Department of Fisheries and Aquatic Biology',
                'Department of Microbiology',
                'Department of Science Laboratory Technology',
                'Department of Zoology and Environment Biology',
                'Department of Chemistry',
                'Department of Physics',
                'Department of Mathematics'
              ].every(dept => {
                const query = vaultSearchQuery.toLowerCase();
                const deptMatches = dept.toLowerCase().includes(query);
                const years = [2021, 2022];
                return !deptMatches && years.filter(year => year.toString().includes(query) || deptMatches).length === 0;
              }) && (
                <div className="text-center py-8 text-slate-400 text-sm bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                  No past questions found matching "{vaultSearchQuery}"
                </div>
              )}
            </div>
          </section>

          {/* NASS LASU ONLINE MARKETPLACE */}
          <section id="brands" className="px-4 max-w-7xl mx-auto w-full relative">
            <div className="text-center mb-10">
              <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight">
                NASS LASU ONLINE MARKETPLACE
              </h2>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-3xl mx-auto">
                NASS LASU is committed to empowering student-owned businesses by providing visibility and promotional opportunities through the faculty website. By showcasing student brands, products, and services on this platform, we aim to increase their reach, enhance brand awareness, and drive sales. This initiative reflects our dedication to fostering innovation, entrepreneurship, and economic growth within the student community, ensuring that student entrepreneurs have the support they need to thrive.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentBrandsData.map((brand) => (
                <div key={brand.id} className="group relative rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden hover:border-yellow-400/50 transition-all flex flex-col">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-10 opacity-90" />
                    <img referrerPolicy="no-referrer" src={brand.imageUrl || undefined} alt={brand.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-4 items-end">
                      {brand.productImageUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/20 shrink-0 shadow-lg">
                           <img referrerPolicy="no-referrer" src={brand.productImageUrl || undefined} alt={`${brand.name} product`} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="inline-block px-3 py-1 mb-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-[10px] font-bold uppercase tracking-widest rounded backdrop-blur-md">
                          {brand.category}
                        </div>
                        <h4 className="text-xl font-bold text-white tracking-tight">{brand.name}</h4>
                        <p className="text-xs text-slate-200 font-medium">Owned by: <span className="text-yellow-400">{brand.owner}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed line-clamp-3">{brand.description}</p>
                    {brand.price && (
                      <p className="text-sm font-bold text-white mb-4">Price: <span className="text-yellow-400 font-mono">{brand.price}</span></p>
                    )}
                    <div className="mt-auto space-y-3">
                      {brand.website && (
                        <a href={brand.website} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-slate-300 transition-colors">
                          Visit Website
                        </a>
                      )}
                      {brand.whatsappNumber && (
                        <a href={`https://wa.me/${brand.whatsappNumber}?text=Hello%20${encodeURIComponent(brand.name || '')}%2C%20I%20saw%20your%20brand%20on%20the%20NASS%20LASU%20Online%20Marketplace%20and%20I%20would%20like%20to%20place%20an%20order.`} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-xl text-sm font-bold transition-colors">
                          Place an Order (WhatsApp)
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Hall of Fame */}
          <section id="hall-of-fame" className="px-4 max-w-7xl mx-auto w-full relative">
            <div className="text-center mb-10">
              <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight">
                HALL OF FAME
              </h2>
              <p className="text-sm md:text-base text-slate-400 italic tracking-wide max-w-2xl mx-auto">
                "A Legacy Remembered, The Present Preserved, Future Scientific Leaders Inspired."
              </p>
            </div>
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-4xl flex flex-col items-center bg-white/5 backdrop-blur-xl border border-yellow-400/50 rounded-3xl overflow-hidden group shadow-[0_0_40px_rgba(250,204,21,0.1)] p-8 lg:p-12 mt-4">
                
                {/* Hall Of Fame Photocard */}
                <div className="group relative rounded-3xl bg-white/5 backdrop-blur-xl overflow-hidden transition-all border-[3px] border-t-yellow-300 border-l-yellow-400 border-b-yellow-700 border-r-yellow-600 shadow-[0_5px_15px_rgba(234,179,8,0.4)] hover:scale-[1.02] mb-8 mt-6 w-full max-w-[400px] aspect-[4/5] shrink-0 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-10 opacity-90" />
                  <img src="/zechariah.jpg" alt="Zechariah Oresanya" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute bottom-6 left-6 right-6 z-20 text-left">
                    <div className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest rounded backdrop-blur-md bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                      Hall Of Fame
                    </div>
                    <h4 className="text-xl font-bold text-white tracking-tight mb-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-3xl font-extrabold uppercase font-space-grotesk text-yellow-400">'Zechariah'</span>
                        <span className="text-base font-normal text-slate-200">Zechariah Oresanya</span>
                      </div>
                    </h4>
                  </div>
                </div>

                <div className="w-full relative z-20 flex flex-col items-center text-center mt-2">
                  
                  <h3 className="text-lg md:text-xl text-yellow-400 font-bold uppercase tracking-wide mb-6 flex flex-col gap-1.5">
                    <span className="tracking-widest">30th NASS LASU PRESIDENT</span>
                    <span className="text-white text-sm md:text-base opacity-90">[1ST PRESIDENT WITH FIRST CLASS HONOURS]</span>
                  </h3>
                  
                  <div className="text-slate-300 text-sm leading-relaxed space-y-4 max-w-3xl mb-4">
                    <p className="text-yellow-400/80 font-semibold tracking-wider uppercase text-xs md:text-sm">
                      Researcher | Chemist | Education Advocate | Student Leader
                    </p>
                    <p>
                      Zechariah Oresanya is a Nigerian researcher, educator, and chemistry graduate of Lagos State University (LASU). He earned a Bachelor of Science in Chemistry with a high grade point average and distinguished himself as a visionary student leader, serving as the <strong className="text-white">30th President of the Nigerian Association of Science Students (NASS)</strong> at Lagos State University.
                    </p>
                    <p>
                      Passionate about education and knowledge sharing, Zechariah has impacted the lives of over <strong className="text-white">5,000 students</strong> by teaching a wide range of science courses. His teaching philosophy encourages students to take bold and daring steps, fostering not only academic excellence but also a mindset of innovation, creativity, and lifelong learning.
                    </p>
                    <p>
                      As a leader, Zechariah is committed to excellence and refuses to settle for mediocrity. He believes that effective leadership is built on collaboration, empowering individuals, and creating environments where every team member is valued. He champions diversity and inclusion, recognizing them as essential drivers of innovation and sustainable success.
                    </p>
                    <p>
                      Beyond the classroom, Zechariah's work in chemistry spans multiple research domains, reflecting his unwavering dedication to advancing scientific knowledge and addressing real-world challenges. His curiosity, resilience, and passion for discovery continue to shape his contributions to research and academia.
                    </p>
                    <p>
                      Through his leadership, research, and educational impact, Zechariah Oresanya remains committed to inspiring others to embrace transformative journeys, pursue excellence, and make meaningful contributions to science and society.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-yellow-400/30 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl transition-colors" />
                <div className="text-yellow-400/50 text-4xl font-serif mb-4">"</div>
                <h3 className="text-lg font-bold text-white mb-1">Comr. Adebayo Daniel</h3>
                <p className="text-[10px] text-yellow-400 uppercase font-bold tracking-tighter mb-4">35th President, 2024/2025</p>
                <p className="text-xs text-slate-300 italic mb-6 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">Established the foundation for the Digital Secretariat and unified the faculty under one voice.</p>
                <div className="inline-block px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded text-[9px] font-bold uppercase tracking-widest">Legacy Honoree</div>
              </div>
            </div>
          </section>

          {/* Events Gallery */}
          <section id="events" className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <h2 className="font-space-grotesk text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent uppercase tracking-tight">
                EVENTS GALLERY
              </h2>
              <button 
                onClick={() => setIsRsvpOpen(true)}
                className="px-6 py-3 border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 rounded-full text-sm font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] whitespace-nowrap self-start md:self-auto"
              >
                RSVP for Events
              </button>
            </div>
            <div className="relative group/scroll">
              <button
                onClick={() => scrollEvents('left')}
                className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-40 bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-900 text-white p-2 md:p-3 rounded-full border border-white/20 transition-all opacity-100 md:opacity-0 group-hover/scroll:opacity-100 shadow-xl flex items-center justify-center pointer-events-auto"
                aria-label="Scroll left"
              >
                <ChevronLeft size={24} className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              
              <button
                onClick={() => scrollEvents('right')}
                className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-40 bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-900 text-white p-2 md:p-3 rounded-full border border-white/20 transition-all opacity-100 md:opacity-0 group-hover/scroll:opacity-100 shadow-xl flex items-center justify-center pointer-events-auto"
                aria-label="Scroll right"
              >
                <ChevronRight size={24} className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div ref={eventsScrollRef} className="flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory hide-scrollbar scroll-smooth px-4 md:px-0">
                {eventsData.map((event) => {
                  const targetFolder = event.storageFolder;

                  const rawImages = event.images 
                    ? (typeof event.images === 'string' ? event.images.split(',') : event.images)
                    : [];

                  const imagesArray = rawImages
                    .map((s: any) => String(s).trim())
                    .filter((s: string) => s.startsWith('/') || s.startsWith('./') || s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:'));

                  const shouldRenderSlideshow = imagesArray.length > 0 || Boolean(targetFolder);

                  return (
                  <div key={event.id} className="w-[85vw] sm:w-[320px] flex-none aspect-[4/5] relative rounded-2xl overflow-hidden group snap-center border border-white/10 hover:border-yellow-400/50 transition-all p-1 bg-white/5 backdrop-blur-xl">
                  <div className="w-full h-full rounded-xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-900 animate-pulse" />
                    {shouldRenderSlideshow ? (
                      <ImageSlideshow 
                        images={imagesArray} 
                        interval={1500}
                        alt={event.title} 
                        storageFolder={targetFolder}
                        fallbackImage={(event.image || '').trim().startsWith('http') || (event.image || '').trim().startsWith('/') ? (event.image || '').trim() : encodeURI((event.image || '').replace(/['"]/g, '').trim())}
                        onImagesFetched={(fetchedUrls) => {
                          setEventsData(prevEvents =>
                            prevEvents.map(e => {
                              if (e.id === event.id || e.title === event.title) {
                                const currentImages = (e.images || []).filter((s: string) => typeof s === 'string' && (s.startsWith('/') || s.startsWith('./') || s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:')));
                                const merged = Array.from(new Set([...fetchedUrls, ...currentImages]));
                                if (merged.length === (e.images || []).length && merged.every((val, idx) => val === (e.images || [])[idx])) {
                                  return e;
                                }
                                return { ...e, images: merged };
                              }
                              return e;
                            })
                          );
                        }}
                      />
                    ) : (
                      <img 
                        referrerPolicy="no-referrer" 
                        src={(event.image || '').trim().startsWith('http') || (event.image || '').trim().startsWith('/') ? (event.image || '').trim() : encodeURI((event.image || '').replace(/['"]/g, '').trim())} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90 pointer-events-none z-20" />
                    <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 z-30">
                      <div>
                        <span className="text-[9px] bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded font-bold uppercase tracking-widest mb-1.5 inline-block">{event.category}</span>
                        <h3 className="text-sm font-bold text-white tracking-wide leading-snug">{event.title}</h3>
                      </div>
                      <div className="flex justify-start">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            const validImages = (event.images || []).filter((s: string) => typeof s === 'string' && (s.startsWith('/') || s.startsWith('./') || s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:')));
                            setSelectedEventGallery({
                              title: event.title,
                              images: validImages,
                              storageFolder: targetFolder
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-xs font-bold rounded-lg transition-colors shadow-lg cursor-pointer"
                        >
                          <span>See More</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
              </div>
            </div>
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
          </section>

          {/* Directory & Calendar Split */}
          <section className="px-4 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
              <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                <UserIcon size={16} className="text-yellow-400" /> Faculty Directory
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-yellow-400/30 transition-colors">
                  <div className="w-12 h-12 rounded-full border border-yellow-400/50 bg-slate-800 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Prof. A.O. Akinkurolere</h4>
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-yellow-400">Dean of Science</p>
                  </div>
                </div>
                <div className="p-5 border-l border-yellow-400 bg-gradient-to-r from-yellow-400/5 to-transparent rounded-r-2xl">
                  <p className="text-[11px] text-slate-300 leading-relaxed italic">"Welcome to a new era of digital efficiency and transparent administration in the Faculty of Science."</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/20 backdrop-blur-xl rounded-2xl p-6 md:p-8 relative overflow-hidden">
              <div className="relative z-10">
                {announcementsData.length > 0 ? (
                  <>
                    <span className="bg-yellow-400 text-slate-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-4 inline-block">{announcementsData[0].tag}</span>
                    <h3 className="text-xl font-bold leading-tight mb-2 text-white font-space-grotesk tracking-tight" dangerouslySetInnerHTML={{ __html: announcementsData[0].title.replace('\n', '<br/>') }} />
                    <p className="text-[11px] text-slate-300 mb-6 w-3/4 leading-relaxed">{announcementsData[0].description}</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[11px] font-bold bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="w-20 text-slate-400 tracking-widest">{announcementsData[0].event1Date}</span>
                        <span className="text-white">{announcementsData[0].event1Text}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold bg-black/20 p-3 rounded-xl border border-white/5 opacity-70">
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                        <span className="w-20 text-slate-500 tracking-widest">{announcementsData[0].event2Date}</span>
                        <span className="text-slate-400">{announcementsData[0].event2Text}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 text-sm">No new announcements at this time.</p>
                )}
              </div>
              <div className="absolute -right-10 -bottom-10 text-9xl opacity-5">📅</div>
            </div>
          </section>

          {/* Faculty Hotline & Emergency Squad Section */}
          <section id="hotline" className="px-4 max-w-7xl mx-auto w-full pt-8">
            <EmergencyHotline />
          </section>

          {/* The Secretariat Section */}
          <section id="secretariat" className="px-4 max-w-7xl mx-auto w-full pt-8">
            <div className="p-8 md:p-12 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl relative overflow-hidden group hover:border-yellow-400/30 transition-all flex flex-col gap-10 items-center">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Logo Section - Top Center */}
              <div className="relative z-10 w-full flex justify-center items-center shrink-0">
                <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full p-2 bg-gradient-to-br from-yellow-400/30 to-yellow-600/10 backdrop-blur-sm border border-yellow-400/20 shadow-[0_0_40px_rgba(250,204,21,0.15)] group-hover:shadow-[0_0_60px_rgba(250,204,21,0.25)] transition-all duration-500">
                  <img 
                    src="/secretariat_logo.png" 
                    alt="The Secretariat Logo" 
                    className="w-full h-full object-contain rounded-full drop-shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/nass_logo.jpg';
                    }}
                  />
                  <div className="absolute inset-0 rounded-full bg-yellow-400/10 animate-pulse mix-blend-overlay"></div>
                </div>
              </div>

              <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
                <h2 className="font-space-grotesk text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                  <span className="text-yellow-400 text-4xl">🏛️</span> The Secretariat
                </h2>
                <p className="text-yellow-400/80 font-bold uppercase tracking-widest text-sm mb-6">Faculty of Science</p>
                
                <div className="space-y-6 text-slate-300 leading-relaxed text-sm md:text-base">
                  <p>
                    The Secretariat is the administrative backbone of the Faculty of Science Students' Association, serving as the custodian of the Association's records, official documents, and institutional memory. It is responsible for managing official correspondence, maintaining accurate records, documenting proceedings, and ensuring the continuity of the Association's activities.
                  </p>
                  <p>
                    As the backbone of innovation within the Faculty, the Secretariat is committed to driving digital transformation, improving communication, and implementing technology-driven systems that promote efficiency, transparency, and better service delivery for every science student.
                  </p>
                  
                  <div className="mt-8 p-6 bg-slate-900/50 rounded-2xl border border-white/5 text-left w-full mx-auto max-w-2xl">
                    <p className="text-yellow-400 font-bold mb-4 text-center sm:text-left">For all official correspondence, inquiries, requests, or submissions to the Association, kindly contact:</p>
                    
                    <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-6 mb-6">
                      <a href="tel:+2348141693252" className="flex items-center gap-3 text-white hover:text-yellow-400 transition-colors group/link w-fit">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover/link:bg-yellow-400/20 group-hover/link:text-yellow-400 transition-colors">
                          <PhoneCall size={18} />
                        </div>
                        <span className="font-bold tracking-wider">+234 814 169 3252</span>
                      </a>
                      
                      <a href="mailto:nasslasu@gmail.com" className="flex items-center gap-3 text-white hover:text-yellow-400 transition-colors group/link w-fit">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover/link:bg-yellow-400/20 group-hover/link:text-yellow-400 transition-colors">
                          <MessageSquare size={18} />
                        </div>
                        <span className="font-bold tracking-wider">nasslasu@gmail.com</span>
                      </a>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10 text-center sm:text-left">
                      <p className="text-white font-bold text-lg">Comr. Onovwiome Honourable Onome</p>
                      <p className="text-yellow-400/80 text-sm font-semibold tracking-widest uppercase mt-1">36th NASS LASU General Secretary</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-20 -bottom-20 text-[200px] opacity-5 pointer-events-none hidden md:block">🏛️</div>
            </div>
          </section>

          {/* Marquee */}
          <footer className="h-16 mt-8 border-y border-white/10 bg-black/40 backdrop-blur-md flex items-center overflow-hidden">
            <div className="flex items-center gap-12 whitespace-nowrap px-8 text-[11px] font-bold tracking-widest text-slate-400 animate-[marquee_30s_linear_infinite]">
              {[...Array(6)].map((_, i) => (
                <React.Fragment key={i}>
                  <span className="flex items-center gap-2"><div className="w-1 h-1 bg-yellow-400 rounded-full"></div> SPONSOR: PEPSI NIGERIA</span>
                  <span className="flex items-center gap-2"><div className="w-1 h-1 bg-yellow-400 rounded-full"></div> BRAND: TECH-FLOW SOLUTIONS</span>
                  <span className="flex items-center gap-2"><div className="w-1 h-1 bg-yellow-400 rounded-full"></div> PARTNER: LASU ACADEMIC BOARD</span>
                  <span className="flex items-center gap-2"><div className="w-1 h-1 bg-yellow-400 rounded-full"></div> POWERED BY: NASS 36TH ADMIN</span>
                </React.Fragment>
              ))}
            </div>
          </footer>

          {/* Admin Panel */}
          <section id="admin" className="px-4 max-w-7xl mx-auto w-full pt-8">
            <AdminPanel />
          </section>

          {/* Footer - Secretariat Forms */}
          <section id="feedback" className="px-4 max-w-7xl mx-auto w-full pb-12 mt-8">
            <SecretariatFeedback />
            
            <div className="mt-16 pt-8 text-center flex flex-col items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <div className="flex gap-6 mb-2">
                <a href="#" className="hover:text-yellow-400 transition-colors">X (Twitter)</a>
                <a href="#" className="hover:text-yellow-400 transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-yellow-400 transition-colors">Instagram</a>
              </div>
              <p>&copy; 2026 NASS LASU 36TH ADMINISTRATION. ALL RIGHTS RESERVED.</p>
              <p className="text-yellow-400/80 mt-1">Initiated by the Office of the General Secretary, Comr. Onovwiome Honourable.</p>
            </div>
          </section>

        </main>
      </div>

      <Chatbot />

      {/* RSVP Modal */}
      <AnimatePresence>
        {isRsvpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl"
            >
              <button
                onClick={() => setIsRsvpOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="text-yellow-400 text-3xl mb-4">🎟️</div>
              <h3 className="text-2xl font-bold mb-2">RSVP for Events</h3>
              <p className="text-slate-400 text-sm mb-6">Register your attendance for upcoming faculty events. An email confirmation will be sent to you.</p>
              
              <form className="space-y-4" onSubmit={(e) => { 
                e.preventDefault(); 
                setIsRsvpOpen(false); 
                addToast('RSVP submitted successfully! Check your email for confirmation.', 'success');
              }}>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Select Event</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 appearance-none text-white">
                    <option value="science-week" className="bg-slate-900">Science Week 2024</option>
                    <option value="inauguration" className="bg-slate-900">Inauguration Event</option>
                    <option value="tech-fair" className="bg-slate-900">Tech Fair & Exhibition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
                  <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 text-white placeholder-slate-500" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Matric Number</label>
                  <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 text-white placeholder-slate-500" placeholder="e.g. 18/555... " />
                </div>
                
                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold uppercase tracking-widest py-4 rounded-xl transition-colors mt-4 text-xs shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                  Confirm Attendance
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Menu */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4">
        <AnimatePresence>
          {isQuickActionsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <button 
                onClick={() => {
                  document.getElementById('hotline')?.scrollIntoView({ behavior: 'smooth' });
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all group font-extrabold"
              >
                <div className="bg-slate-900/10 p-2 rounded-full group-hover:bg-slate-900/20 transition-colors">
                  <Siren size={18} className="text-slate-900 animate-pulse" />
                </div>
                <span className="text-xs uppercase tracking-wider font-extrabold">Emergency Hotline</span>
              </button>
              <button 
                onClick={() => {
                  document.getElementById('brands')?.scrollIntoView({ behavior: 'smooth' });
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all group font-extrabold"
              >
                <div className="bg-slate-900/10 p-2 rounded-full group-hover:bg-slate-900/20 transition-colors">
                  <ShoppingBag size={18} className="text-slate-900" />
                </div>
                <span className="text-xs uppercase tracking-wider font-extrabold">Online Marketplace</span>
              </button>
              <button 
                onClick={() => {
                  document.getElementById('vault')?.scrollIntoView({ behavior: 'smooth' });
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all group font-extrabold"
              >
                <div className="bg-slate-900/10 p-2 rounded-full group-hover:bg-slate-900/20 transition-colors">
                  <BookOpen size={18} className="text-slate-900" />
                </div>
                <span className="text-xs uppercase tracking-wider font-extrabold">Academic Vault</span>
              </button>
              <button 
                onClick={() => {
                  document.getElementById('e-voting')?.scrollIntoView({ behavior: 'smooth' });
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all group font-extrabold"
              >
                <div className="bg-slate-900/10 p-2 rounded-full group-hover:bg-slate-900/20 transition-colors">
                  <Vote size={18} className="text-slate-900" />
                </div>
                <span className="text-xs uppercase tracking-wider font-extrabold">E-Voting</span>
              </button>
              <button 
                onClick={() => {
                  document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all group font-extrabold"
              >
                <div className="bg-slate-900/10 p-2 rounded-full group-hover:bg-slate-900/20 transition-colors">
                  <Navigation size={18} className="text-slate-900" />
                </div>
                <span className="text-xs uppercase tracking-wider font-extrabold">Faculty Map</span>
              </button>
              <button 
                onClick={() => {
                  document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth' });
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all group font-extrabold"
              >
                <div className="bg-slate-900/10 p-2 rounded-full group-hover:bg-slate-900/20 transition-colors">
                  <MessageSquare size={18} className="text-slate-900" />
                </div>
                <span className="text-xs uppercase tracking-wider font-extrabold">Feedback Form</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
          className="p-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all duration-300 transform hover:scale-105 flex items-center justify-center z-50"
          aria-label="Quick Actions"
        >
          {isQuickActionsOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Executive Profile Modal */}
      <AnimatePresence>
        {selectedExecutive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedExecutive(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="relative aspect-[3/2] w-full shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
                  <img 
                    src={selectedExecutive.imageUrl || undefined} 
                    alt={selectedExecutive.name} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setSelectedExecutive(null)}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6 z-20">
                    <div className="inline-block px-3 py-1 mb-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-[10px] font-bold uppercase tracking-widest rounded backdrop-blur-md">
                      {selectedExecutive.office}
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {selectedExecutive.name}
                    </h3>
                    {selectedExecutive.nickname && (
                      <p className="text-yellow-400 font-space-grotesk font-bold uppercase mt-1">'{selectedExecutive.nickname}'</p>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4 text-sm text-slate-400 font-semibold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    {selectedExecutive.department}
                  </div>
                  <div className="text-slate-300 leading-relaxed text-sm bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                    {selectedExecutive.summary ? renderWithBold(selectedExecutive.summary) : "No profile summary available."}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-50 p-3 bg-yellow-400/20 hover:bg-yellow-400/40 border border-yellow-400/50 backdrop-blur-xl text-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
          aria-label="Back to top"
        >
          <ArrowUp size={24} />
        </button>
      )}

      {selectedEventGallery && (
        <PageantGallery
          title={selectedEventGallery.title}
          images={selectedEventGallery.images}
          storageFolder={selectedEventGallery.storageFolder}
          onClose={() => setSelectedEventGallery(null)}
        />
      )}
      
      <style>{`
        .font-space-grotesk { font-family: 'Space Grotesk', system-ui, sans-serif; }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.5);
        }
      `}</style>
    </div>
  );
}

