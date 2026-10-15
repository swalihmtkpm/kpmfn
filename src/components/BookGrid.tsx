import { BookOpen, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

export type BookCard = {
  id: string;
  title_ar: string;
  title_en: string | null;
  cover_url?: string | null;
  average_rating?: number | null;
  ratings_count?: number | null;
  author_name?: string | null;
  book_code?: string | null;
  status?: string | null;
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

  // Animation variants for staggered appearance as cards enter the viewport
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.45,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      className="grid grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3.5 md:gap-5"
    >
      {books.map((b) => {
        const title = lang === 'ar' ? b.title_ar : (b.title_en || b.title_ar);
        const rating = Number(b.average_rating ?? 0);
        const ratingsCount = b.ratings_count ?? 0;

        return (
          <motion.div
            key={b.id}
            variants={cardVariants}
            className="group flex flex-col"
          >
            <Link
              to={`/book/${b.id}`}
              className="flex flex-col h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            >
              {/* Cover Frame: Style 2 (Desktop Minimalist) & Style 3 (Mobile) */}
              <div className="relative aspect-[1/1.45] w-full rounded-lg md:rounded-xl overflow-hidden bg-accent/70 shadow-book group-hover:shadow-book-hover transition-all duration-300 transform group-hover:-translate-y-1 group-hover:scale-[1.025] border border-border/40">
                {/* 3D Spine Highlight (LTR & RTL aware) */}
                <div className="book-spine-highlight" />

                {b.cover_url ? (
                  <img
                    src={b.cover_url}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 will-change-transform"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-between p-2.5 text-center bg-gradient-to-b from-primary/15 via-primary/5 to-primary/20 text-foreground">
                    <div className="w-full flex justify-end">
                      <Sparkles className="w-3.5 h-3.5 text-primary/40" />
                    </div>
                    <div className="flex flex-col items-center px-1">
                      <BookOpen className="w-7 h-7 md:w-9 md:h-9 text-primary/70 mb-1.5" />
                      <span className="text-[10px] md:text-xs font-bold line-clamp-3 leading-snug">
                        {title}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {t('appNameShort')}
                    </span>
                  </div>
                )}

                {/* Subtle sheen highlight on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Status indicator badge (Optional small dot/pill) */}
                {b.status === 'borrowed' && (
                  <div className="absolute top-1.5 start-1.5 z-10">
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white text-[9px] font-bold shadow-sm backdrop-blur-sm">
                      {t('borrowed')}
                    </span>
                  </div>
                )}
              </div>

              {/* Book Metadata: Clean, Minimalist Typography (Image 2 Inspiration) */}
              <div className="mt-2 flex-1 flex flex-col justify-between px-0.5 text-start">
                <div>
                  {b.author_name ? (
                    <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 font-medium tracking-wide">
                      {b.author_name}
                    </p>
                  ) : null}
                  <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-foreground line-clamp-2 leading-tight mt-0.5 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                </div>

                {/* Rating or Quick Details */}
                <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] md:text-xs text-muted-foreground">
                  {ratingsCount > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                      <span className="font-semibold text-foreground text-[10px] md:text-xs">
                        {rating.toFixed(1)}
                      </span>
                      <span className="text-[9px] opacity-70">({ratingsCount})</span>
                    </div>
                  ) : (
                    <span className="text-[9px] md:text-[10px] opacity-60">
                      {b.book_code || t('available')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
