import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import BookGrid, { BookCard } from '@/components/BookGrid';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Index() {
  const { t } = useI18n();
  const [books, setBooks] = useState<BookCard[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('books')
        .select('id, title_ar, title_en, cover_path')
        .order('created_at', { ascending: false })
        .limit(60);

      const items: BookCard[] = await Promise.all(
        (data ?? []).map(async (b) => {
          let cover_url: string | null = null;
          if (b.cover_path) {
            const { data: signed } = await supabase.storage
              .from('book-covers')
              .createSignedUrl(b.cover_path, 60 * 60);
            cover_url = signed?.signedUrl ?? null;
          }
          return { id: b.id, title_ar: b.title_ar, title_en: b.title_en, cover_url };
        })
      );
      setBooks(items);
      setLoading(false);
    })();
  }, []);

  const filtered = query
    ? books.filter((b) =>
        [b.title_ar, b.title_en].filter(Boolean).some((s) => s!.toLowerCase().includes(query.toLowerCase()))
      )
    : books;

  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">{t('appName')}</h1>
          <p className="mt-2 opacity-85 text-sm md:text-base">{t('tagline')}</p>
          <div className="mt-5 max-w-md relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchBooks')}
              className="ps-9 bg-background/95 text-foreground"
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BookGrid books={filtered} />
        )}
      </section>
    </Layout>
  );
}
