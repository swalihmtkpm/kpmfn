import { BookOpen, Star, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { convertDriveUrl } from '@/lib/dataService';

export type BookCard = {
  id: string;
  title_ar: string;
  title_en?: string | null;
  cover_url?: string | null;
  average_rating?: number | null;
  ratings_count?: number | null;
  author_name?: string | null;
  book_code?: string | null;
  category_name?: string | null;
  status?: string | null;
  borrowState?: 'borrowed' | 'requested' | 'missed' | 'available' | string | null;
};

type Props = {
  books: BookCard[];
};

export default function BookGrid({ books }: Props) {
  const { t, lang } = useI18n();
  const shouldReduceMotion = useReducedMotion();

  if (books.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
          <BookOpen className="w-8 h-8" />
        </div>
        <p className="text-muted-foreground text-sm">{t('noBooksYet')}</p>
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.45,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <motion.div
      key={books.map((b) => b.id).slice(0, 10).join('-') || 'empty'}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
    >
      {books.map((b) => {
        const title = lang === 'ar' ? b.title_ar : b.title_en || b.title_ar;
        const rating = Number(b.average_rating ?? 0);
        const ratingsCount = b.ratings_count ?? 0;
        const isMissed = b.status === 'missed';
        const coverSrc = convertDriveUrl(b.cover_url);

        return (
          <motion.div
            key={b.id}
            variants={cardVariants}
            className="group flex flex-col"
          >
            <Link
              to={`/book/${b.id}`}
              className={`flex flex-col h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-all duration-300 ${
                isMissed ? 'book-missed rounded-2xl' : 'hover:bg-accent/40'
              }`}
            >
              {/* Cover Frame */}
              <div
                className={`relative aspect-[1/1.45] w-full rounded-xl overflow-hidden bg-accent/70 shadow-book group-hover:shadow-book-hover transition-all duration-300 transform group-hover:-translate-y-1 group-hover:scale-[1.025] border ${
                  isMissed ? 'border-destructive/60' : 'border-border/60'
                }`}
              >
                {/* 3D Spine Highlight */}
                <div className="book-spine-highlight" />

                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 will-change-transform"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-between p-3 text-center bg-gradient-to-b from-primary/10 via-primary/5 to-primary/15 text-foreground">
                    <div className="w-full flex justify-end">
                      <Sparkles className="w-3.5 h-3.5 text-primary/40" />
                    </div>
                    <div className="flex flex-col items-center px-1">
                      <BookOpen className="w-8 h-8 text-primary/70 mb-1.5" />
                      <span className="text-xs font-bold line-clamp-3 leading-snug">
                        {title}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t('appNameShort')}
                    </span>
                  </div>
                )}

                {/* Red Shading Overlay for Missed Books (Requested) */}
                {isMissed && (
                  <div className="absolute inset-0 bg-red-600/25 dark:bg-red-900/35 backdrop-blur-[0.5px] flex flex-col justify-between p-2">
                    <span className="self-start px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{t('missed')}</span>
                    </span>
                    <span className="text-center text-[10px] font-bold text-white bg-black/75 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {t('bookMissedBadge')}
                    </span>
                  </div>
                )}

                {/* Status indicator badge for borrowed books */}
                {!isMissed && (b.status === 'borrowed' || b.borrowState === 'borrowed') && (
                  <div className="absolute top-2 start-2 z-20">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-amber-950 text-[10px] sm:text-[11px] font-black shadow-md border border-amber-300 flex items-center gap-1.5 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-950 animate-pulse" />
                      <span>{t('borrowed')}</span>
                    </span>
                  </div>
                )}

                {/* Status indicator badge for requested books */}
                {!isMissed && b.status !== 'borrowed' && b.borrowState !== 'borrowed' && b.borrowState === 'requested' && (
                  <div className="absolute top-2 start-2 z-20">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500 text-white text-[10px] sm:text-[11px] font-black shadow-md border border-sky-300 flex items-center gap-1.5 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>{t('requested')}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Book Metadata: Clean, Minimalist International Typography */}
              <div className="mt-2.5 flex-1 flex flex-col justify-between px-0.5 text-start">
                <div>
                  {/* Category Badge on each book (Requested) */}
                  {b.category_name && (
                    <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md mb-1 truncate max-w-full">
                      {b.category_name}
                    </span>
                  )}

                  {b.author_name ? (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium tracking-wide">
                      {b.author_name}
                    </p>
                  ) : null}

                  <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 leading-snug mt-0.5 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                </div>

                {/* Rating & Quick Details (Ratings shown prominently on each book) */}
                <div className="mt-2 flex items-center justify-between gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="font-bold text-foreground text-xs">
                      {rating > 0 ? rating.toFixed(1) : '5.0'}
                    </span>
                    {ratingsCount > 0 && (
                      <span className="text-[10px] opacity-70">({ratingsCount})</span>
                    )}
                  </div>

                  <span className="text-[10px] font-semibold opacity-70 truncate">
                    {b.book_code || (isMissed ? t('missed') : t('available'))}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
