import { useNavigate } from 'react-router-dom';
import { FolderOpen, BookOpen, Sparkles, Scale, Compass, Heart, Feather } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

type CategoryItem = {
  id: string;
  name: string;
  count: number;
};

type Props = {
  categories: CategoryItem[];
};

const iconMap: Record<string, any> = {
  BookOpen,
  Scale,
  Sparkles,
  Compass,
  Heart,
  Feather,
  FolderOpen,
};

export default function CategoriesTicker({ categories }: Props) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  if (!categories || categories.length === 0) return null;

  // Duplicate items to ensure seamless infinite looping marquee
  const repeated = [...categories, ...categories, ...categories];

  return (
    <section className="w-full py-8 overflow-hidden select-none">
      <div className="max-w-6xl mx-auto px-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
              {t('categories')}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {lang === 'ar' ? 'تصفح الكتب حسب التصنيف والتخصص العلمي' : 'Explore books by academic field and category'}
            </p>
          </div>
        </div>
      </div>

      {/* Infinite Slow Horizontal Marquee Container */}
      <div className="relative w-full overflow-hidden mask-gradient-x">
        {/* Subtle fade masks at left & right borders */}
        <div className="pointer-events-none absolute inset-y-0 start-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="animate-marquee-slow flex items-center gap-3 sm:gap-4 py-2">
          {repeated.map((cat, index) => {
            return (
              <button
                key={`${cat.id}-${index}`}
                onClick={() => navigate(`/catalog?category=${cat.id}`)}
                className="group shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/70 hover:border-primary/50 hover:bg-primary/[0.03] transition-all shadow-sm hover:shadow-md cursor-pointer text-start"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      {cat.count} {t('books')}
                    </span>
                  </div>
                </div>
                <span className="ms-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
