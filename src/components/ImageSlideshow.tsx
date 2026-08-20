import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSlideshowProps {
  images: string[];
  interval?: number;
  alt: string;
  storageFolder?: string;
  fallbackImage?: string;
  onImagesFetched?: (urls: string[]) => void;
}

const FALLBACK_MAP: Record<string, string> = {
  pageant: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  awards: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
};

function getFallbackForAlt(alt: string): string {
  const lower = alt.toLowerCase();
  if (lower.includes('pageant') || lower.includes('fresher') || lower.includes('miss')) return FALLBACK_MAP.pageant;
  if (lower.includes('dinner') || lower.includes('award')) return FALLBACK_MAP.awards;
  if (lower.includes('food') || lower.includes('science vs')) return FALLBACK_MAP.food;
  return FALLBACK_MAP.default;
}

const STORAGE_IMAGE_CACHE = new Map<string, string[]>();

export function getCachedStorageFolderImages(folderName: string): string[] | null {
  if (!folderName) return null;
  const key = folderName.trim().toLowerCase();
  if (STORAGE_IMAGE_CACHE.has(key)) {
    return STORAGE_IMAGE_CACHE.get(key)!;
  }
  try {
    const cached = sessionStorage.getItem(`fb_storage_${key}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        STORAGE_IMAGE_CACHE.set(key, parsed);
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null;
}

export async function fetchFirebaseStorageFolderImages(folderName: string): Promise<string[]> {
  if (!storage) {
    console.warn("[Firebase Storage] Storage is not initialized.");
    return [];
  }

  const cacheKey = folderName.trim().toLowerCase();
  const cached = getCachedStorageFolderImages(folderName);

  if (cached && cached.length > 0) {
    // Preload top images in background
    cached.slice(0, 5).forEach(u => {
      const img = new Image();
      img.src = u;
    });

    // Run background refresh without blocking UI
    setTimeout(() => {
      fetchFirebaseStorageFolderImagesInternal(folderName).then(freshUrls => {
        if (freshUrls.length > 0) {
          STORAGE_IMAGE_CACHE.set(cacheKey, freshUrls);
          try { sessionStorage.setItem(`fb_storage_${cacheKey}`, JSON.stringify(freshUrls)); } catch (e) {}
        }
      }).catch(() => {});
    }, 200);

    return cached;
  }

  return fetchFirebaseStorageFolderImagesInternal(folderName);
}

async function fetchFirebaseStorageFolderImagesInternal(folderName: string): Promise<string[]> {
  console.log(`[Firebase Storage] Fetching images for folder: "${folderName}"`);

  const folderVariations = Array.from(new Set([
    folderName,
    folderName.trim(),
    folderName.replace(/\/+$/, ''),
    folderName.toLowerCase(),
    'Nass Lasu Dinner And Award Night',
    'Nass Lasu Dinner and Award Night',
    'nass_lasu_dinner_and_award_night',
    'nass-lasu-dinner-and-award-night',
    'nass lasu dinner and award night',
    'Dinner and Award Night',
    'Dinner And Award Night',
    'Science Vs Food',
    'Science Vs Food 3.0',
    'Science vs Food',
    'Science vs Food 3.0',
    'science_vs_food',
    'science-vs-food',
    'science vs food',
    'Mr and Miss Nass Lasu Fresher',
    'Mr And Miss Nass Lasu Fresher',
    'mr_and_miss_nass_lasu_fresher',
    'Mr and Miss NASS LASU Fresher',
    'pageant'
  ]));

  let foundItems: any[] = [];

  for (const folderPath of folderVariations) {
    try {
      const listRef = ref(storage, folderPath);
      const res = await listAll(listRef);

      if (res.items.length > 0) {
        foundItems = [...foundItems, ...res.items];
      }

      // Check subfolders in parallel
      if (res.prefixes.length > 0) {
        const subResults = await Promise.all(
          res.prefixes.map(prefixRef => listAll(prefixRef).catch(() => null))
        );
        subResults.forEach(subRes => {
          if (subRes && subRes.items.length > 0) {
            foundItems = [...foundItems, ...subRes.items];
          }
        });
      }

      if (foundItems.length > 0) {
        break;
      }
    } catch (err: any) {
      console.warn(`[Firebase Storage] Could not list folder "${folderPath}":`, err?.message || err);
    }
  }

  // Fallback: check root bucket if nothing found in specific folder names
  if (foundItems.length === 0) {
    try {
      const rootRef = ref(storage);
      const rootRes = await listAll(rootRef);

      if (rootRes.items.length > 0) {
        foundItems = [...foundItems, ...rootRes.items];
      }

      if (rootRes.prefixes.length > 0) {
        const subResults = await Promise.all(
          rootRes.prefixes.map(prefixRef => listAll(prefixRef).catch(() => null))
        );
        subResults.forEach(subRes => {
          if (subRes && subRes.items.length > 0) {
            foundItems = [...foundItems, ...subRes.items];
          }
        });
      }
    } catch (rootErr: any) {
      console.warn(`[Firebase Storage] Root bucket list error:`, rootErr?.message || rootErr);
    }
  }

  // Deduplicate items
  const uniqueMap = new Map();
  foundItems.forEach(item => uniqueMap.set(item.fullPath, item));
  const uniqueItems = Array.from(uniqueMap.values());

  if (uniqueItems.length === 0) {
    return [];
  }

  // PARALLEL URL Fetching for blazingly fast resolution!
  const itemsWithUrls = (await Promise.all(
    uniqueItems.map(async (itemRef) => {
      try {
        const downloadUrl = await getDownloadURL(itemRef);
        return {
          fullPath: itemRef.fullPath || '',
          name: itemRef.name || '',
          url: downloadUrl
        };
      } catch (urlErr) {
        return null;
      }
    })
  )).filter((item): item is { fullPath: string; name: string; url: string } => item !== null);

  // Priority sorting logic for cover picture ("Fresher Cover Image", "Fresher Cover Picture", "Fresher Cover", "Cover", etc.):
  const coverRegex = /cover/i;
  const photo22Regex = /(?:photo|pageant|image|img|pic|fresher)?[_\s%-]*22\b/i;

  const getItemRank = (item: { name: string; fullPath: string; url: string }) => {
    const decodedUrl = decodeURIComponent(item.url);
    const combined = `${item.name} ${item.fullPath} ${decodedUrl}`;
    if (coverRegex.test(combined)) return 1;
    if (photo22Regex.test(combined)) return 2;
    return 3;
  };

  itemsWithUrls.sort((a, b) => {
    const rankA = getItemRank(a);
    const rankB = getItemRank(b);

    if (rankA !== rankB) return rankA - rankB;

    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
    if (numA !== numB) return numA - numB;

    return a.name.localeCompare(b.name);
  });

  const urls = itemsWithUrls.map(i => i.url);
  console.log(`[Firebase Storage] Fast parallel fetch done. Total URLs: ${urls.length}. Cover:`, urls[0]);

  // Save to cache & sessionStorage
  const cacheKey = folderName.trim().toLowerCase();
  STORAGE_IMAGE_CACHE.set(cacheKey, urls);
  try {
    sessionStorage.setItem(`fb_storage_${cacheKey}`, JSON.stringify(urls));
  } catch (e) {}

  // Preload top 5 images into browser cache
  urls.slice(0, 5).forEach(u => {
    const img = new Image();
    img.src = u;
  });

  return urls;
}

export function ImageSlideshow({ images, interval = 3000, alt, storageFolder, fallbackImage, onImagesFetched }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [storageImages, setStorageImages] = useState<string[]>(() => {
    return storageFolder ? (getCachedStorageFolderImages(storageFolder) || []) : [];
  });

  // Use refs to stabilize callbacks and prevent infinite re-fetch loops
  const onImagesFetchedRef = useRef(onImagesFetched);
  useEffect(() => {
    onImagesFetchedRef.current = onImagesFetched;
  }, [onImagesFetched]);

  const fetchedFolderRef = useRef<string | null>(null);

  useEffect(() => {
    if (!storageFolder || fetchedFolderRef.current === storageFolder) return;
    fetchedFolderRef.current = storageFolder;

    let isCancelled = false;

    fetchFirebaseStorageFolderImages(storageFolder)
      .then((urls) => {
        if (isCancelled) return;
        if (urls && urls.length > 0) {
          setStorageImages(urls);
          if (onImagesFetchedRef.current) {
            onImagesFetchedRef.current(urls);
          }
        }
      })
      .catch((e) => {
        console.warn("Storage fetch error:", e);
      });

    return () => {
      isCancelled = true;
    };
  }, [storageFolder]);

  // Merge storage images and prop images, removing duplicates, prioritizing "Fresher Cover Picture" as cover
  const activeImages = useMemo(() => {
    const raw = storageImages.length > 0
      ? Array.from(new Set([...storageImages, ...(images || [])]))
      : (images && images.length > 0 ? images : []);

    const result = [...raw];
    const coverRegex = /cover/i;
    const photo22Regex = /(?:photo|pageant|image|img|pic|fresher)?[_\s%-]*22\b/i;

    result.sort((a, b) => {
      const decodedA = decodeURIComponent(a);
      const decodedB = decodeURIComponent(b);

      const isCoverA = coverRegex.test(decodedA);
      const isCoverB = coverRegex.test(decodedB);
      if (isCoverA && !isCoverB) return -1;
      if (!isCoverA && isCoverB) return 1;

      const is22A = photo22Regex.test(decodedA);
      const is22B = photo22Regex.test(decodedB);
      if (is22A && !is22B) return -1;
      if (!is22A && is22B) return 1;

      return 0;
    });

    return result;
  }, [storageImages, images]);

  const activeCount = activeImages.length;

  useEffect(() => {
    if (activeCount <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeCount);
    }, interval);

    return () => clearInterval(timer);
  }, [activeCount, interval]);

  // Preload next upcoming images for zero-lag transitions
  useEffect(() => {
    if (activeCount <= 1) return;
    const nextIndices = [
      (currentIndex + 1) % activeCount,
      (currentIndex + 2) % activeCount
    ];
    nextIndices.forEach(idx => {
      const imgUrl = activeImages[idx];
      if (imgUrl) {
        const clean = imgUrl.replace(/['"]/g, '').trim();
        const src = clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')
          ? clean
          : encodeURI(clean);
        const imgObj = new Image();
        imgObj.src = src;
      }
    });
  }, [currentIndex, activeImages, activeCount]);

  const defaultFallback = getFallbackForAlt(alt);
  const fallback = fallbackImage || defaultFallback;

  if (!activeImages || activeImages.length === 0) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-slate-900 group/slideshow">
        <img
          referrerPolicy="no-referrer"
          src={fallback}
          alt={alt}
          className="w-full h-full object-cover absolute inset-0 group-hover/slideshow:scale-105 transition-transform duration-1000"
        />
      </div>
    );
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  const currentRawUrl = activeImages[currentIndex] || '';
  const currentCleanUrl = currentRawUrl.replace(/['"]/g, '').trim();
  const isFailed = failedUrls[currentCleanUrl];
  const isFullUrl = currentCleanUrl.startsWith('http://') || currentCleanUrl.startsWith('https://') || currentCleanUrl.startsWith('data:') || currentCleanUrl.startsWith('blob:');
  const activeSrcUrl = isFailed ? fallback : (isFullUrl ? currentCleanUrl : encodeURI(currentCleanUrl));

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-900 group/slideshow">
      {/* Animated Cross-Fade Image Layer */}
      <AnimatePresence>
        <motion.img
          key={`${currentCleanUrl}-${currentIndex}`}
          referrerPolicy="no-referrer"
          src={activeSrcUrl}
          alt={`${alt} - ${currentIndex + 1}`}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1.0] }}
          onError={() => {
            if (!failedUrls[currentCleanUrl]) {
              console.warn(`[ImageSlideshow] Failed to load image: ${currentCleanUrl}`);
              setFailedUrls(prev => ({ ...prev, [currentCleanUrl]: true }));
            }
          }}
          className="w-full h-full object-cover absolute inset-0 group-hover/slideshow:scale-105 transition-transform duration-1000"
        />
      </AnimatePresence>

      {/* Navigation Arrows */}
      {activeImages.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 hover:bg-yellow-400 hover:text-slate-900 text-white rounded-full transition-all opacity-0 group-hover/slideshow:opacity-100 backdrop-blur-sm border border-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 hover:bg-yellow-400 hover:text-slate-900 text-white rounded-full transition-all opacity-0 group-hover/slideshow:opacity-100 backdrop-blur-sm border border-white/20"
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Indicator Dots */}
      {activeImages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center items-center gap-1 px-4 pointer-events-auto">
          {activeImages.slice(0, 10).map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-4 bg-yellow-400'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
          {activeImages.length > 10 && (
            <span className="text-[9px] text-white/70 font-mono ml-1 font-semibold select-none">+{activeImages.length - 10}</span>
          )}
        </div>
      )}
    </div>
  );
}

