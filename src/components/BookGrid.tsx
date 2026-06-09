import { BookOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export type BookCard = {
  id: string;
  title_ar: string;
  title_en: string | null;
  cover_url?: string | null;
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
          <div key={b.id} className="group cursor-pointer">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
