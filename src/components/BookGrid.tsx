import { BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

export type BookCard = {
  id: string;
  title_ar: string;
  title_en: string | null;
  cover_url?: string | null;
  average_rating?: number | null;
  ratings_count?: number | null;
  author_name?: string | null;
};

export default function BookGrid({ books }: { books: BookCard[] }) {
  const { t, lang } = useI18n();

  if (books.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground">{t('noBooksYet')}</p>
      </div>
    );
  }

  return (
    <div className="book-grid">
      {books.map((b) => {
        const title = lang === 'ar' ? b.title_ar : (b.title_en || b.title_ar);
        return (
          <Link key={b.id} to={`/book/${b.id}`} className="group">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-accent shadow-soft group-hover:shadow-elevated transition-shadow">
              {b.cover_url ? (
                <img src={b.cover_url} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center gradient-primary text-primary-foreground">
                  <BookOpen className="w-10 h-10 opacity-70" />
                </div>
              )}
            </div>
            <div className="mt-2 px-0.5">
              <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{title}</p>
              {b.author_name ? (
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{b.author_name}</p>
              ) : null}
              {(b.ratings_count ?? 0) > 0 ? (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span className="font-semibold text-foreground">{Number(b.average_rating ?? 0).toFixed(1)}</span>
                  <span>({b.ratings_count})</span>
                </div>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
