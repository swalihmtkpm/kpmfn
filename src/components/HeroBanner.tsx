import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Banner, convertDriveUrl, dataService } from '@/lib/dataService';
import { useI18n } from '@/lib/i18n';

type Props = {
  banners?: Banner[];
};

export default function HeroBanner({ banners: propBanners }: Props) {
  const { lang, dir } = useI18n();
  const [internalBanners, setInternalBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  // Load banners if not provided
  useEffect(() => {
    if (propBanners) {
      setInternalBanners(propBanners.filter((b) => b.is_active));
    } else {
      const all = dataService.getBanners().filter((b) => b.is_active);
      setInternalBanners(all);
    }
  }, [propBanners]);

  const banners = internalBanners;
  const count = banners.length;

  const currentBanner = useMemo(() => {
    if (!banners.length) return null;
    return banners[currentIndex % banners.length];
  }, [banners, currentIndex]);

  const nextSlide = () => {
    if (count <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % count);
  };

  const prevSlide = () => {
    if (count <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  };

  // Slideshow duration logic:
  // - Images: exactly 3 seconds (3000ms)
  // - Videos: wait for video duration / onEnded
  useEffect(() => {
    if (count <= 1 || !currentBanner) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentBanner.type === 'image') {
      timerRef.current = window.setTimeout(() => {
        nextSlide();
      }, 3000); // 3 seconds duration as requested
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, count, currentBanner]);

  // Video ended handler
  const handleVideoEnded = () => {
    nextSlide();
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  };

  if (!currentBanner) {
    return (
      <div className="w-full aspect-[21/9] sm:aspect-[21/8] md:aspect-[21/7] rounded-2xl md:rounded-3xl bg-secondary/50 border border-border/60 flex items-center justify-center p-6 text-muted-foreground">
        <span className="text-sm font-medium">مكتبة الامتياز الرقمية</span>
      </div>
    );
  }

  const title = lang === 'ar' ? currentBanner.title_ar : currentBanner.title_en || currentBanner.title_ar;
  const subtitle = lang === 'ar' ? currentBanner.subtitle_ar : currentBanner.subtitle_en || currentBanner.subtitle_ar;
  const mediaSrc = convertDriveUrl(currentBanner.media_url, currentBanner.type);

  // Framer motion variants for smart sliding animations
  const slideVariants: Variants = {
    enter: (d: number) => ({
      x: d > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 280, damping: 30 },
        opacity: { duration: 0.35 },
      },
    },
    exit: (d: number) => ({
      x: d > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 280, damping: 30 },
        opacity: { duration: 0.35 },
      },
    }),
  };

  const isRtl = dir === 'rtl';
  const ArrowPrev = isRtl ? ChevronRight : ChevronLeft;
  const ArrowNext = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      className="relative w-full aspect-[16/7] sm:aspect-[21/8] md:aspect-[21/7] rounded-2xl md:rounded-[1.75rem] overflow-hidden border border-border/80 shadow-md select-none bg-black group"
      // Prevent any clicks from opening pages or causing unwanted navigation
      onClick={(e) => {
        // Only allow clicking on slide navigation controls
        const target = e.target as HTMLElement;
        if (!target.closest('button')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentBanner.id + '-' + currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {currentBanner.type === 'video' ? (
            <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
              {/* If it's a Drive video preview link or direct video */}
              {mediaSrc.includes('drive.google.com/file') ? (
                <iframe
                  src={mediaSrc}
                  className="w-full h-full object-cover pointer-events-none"
                  allow="autoplay"
                  title="Banner Video"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={mediaSrc}
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleVideoEnded}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  className="w-full h-full object-cover pointer-events-none"
                />
              )}
            </div>
          ) : (
            <img
              src={mediaSrc}
              alt={title || 'Banner'}
              className="w-full h-full object-cover pointer-events-none"
              loading="eager"
            />
          )}

          {/* Optional Title and Subtitle Overlay with sleek gradient scrim */}
          {(title || subtitle) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-5 sm:p-8 md:p-12 text-white">
              <div className="max-w-3xl space-y-2 pointer-events-none">
                {title && (
                  <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="text-xl sm:text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md"
                  >
                    {title}
                  </motion.h2>
                )}
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed max-w-2xl drop-shadow-sm font-medium"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Controls (Only if > 1 banner) */}
      {count > 1 && (
        <>
          {/* Previous / Next Arrow buttons on hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous slide"
            className="absolute top-1/2 -translate-y-1/2 start-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 focus:outline-none"
          >
            <ArrowPrev className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next slide"
            className="absolute top-1/2 -translate-y-1/2 end-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 focus:outline-none"
          >
            <ArrowNext className="w-5 h-5" />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-3 end-4 flex items-center gap-1.5 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDirection(i > currentIndex ? 1 : -1);
                  setCurrentIndex(i);
                }}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none ${
                  i === currentIndex % count
                    ? 'w-7 bg-primary shadow-sm'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
