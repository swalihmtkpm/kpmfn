import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import BookGrid, { BookCard } from '@/components/BookGrid';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { signedCoverUrl } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 50;

type Option = { id: string; name: string };
type RawBook = {
  id: string;
  si_number: number | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  book_code: string | null;
  cover_path: string | null;
  average_rating: number | null;
  ratings_count: number | null;
  author_id: string | null;
  category_id: string | null;
  publisher_id: string | null;
};

export default function Index() {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') ?? 'all');
  const [authorId, setAuthorId] = useState(searchParams.get('author') ?? 'all');
  const [publisherId, setPublisherId] = useState(searchParams.get('publisher') ?? 'all');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1') || 1);

  const [categories, setCategories] = useState<Option[]>([]);
  const [authors, setAuthors] = useState<Map<string, Option>>(new Map());
  const [publishers, setPublishers] = useState<Map<string, Option>>(new Map());

  const [allBooks, setAllBooks] = useState<RawBook[] | null>(null);
  const [covers, setCovers] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<number | null>(null);

  // Load lookups + all books once (catalog ≤5000)
  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: auts }, { data: pubs }, { data: bks }] = await Promise.all([
        supabase.from('categories').select('id, name_ar, name_en').order('sort_order'),
        supabase.from('authors').select('id, name_ar, name_en'),
        supabase.from('publishers').select('id, name_ar, name_en'),
        supabase.from('books').select('id, si_number, title_ar, title_en, description_ar, description_en, book_code, cover_path, average_rating, ratings_count, author_id, category_id, publisher_id'),
      ]);

      const pick = (ar: string, en: string | null) => (lang === 'ar' ? ar : (en || ar));
      setCategories((cats ?? []).map((c) => ({ id: c.id, name: pick(c.name_ar, c.name_en) })));
      setAuthors(new Map((auts ?? []).map((a) => [a.id, { id: a.id, name: pick(a.name_ar, a.name_en) }])));
      setPublishers(new Map((pubs ?? []).map((p) => [p.id, { id: p.id, name: pick(p.name_ar, p.name_en) }])));
      setAllBooks((bks ?? []) as RawBook[]);
      setLoading(false);
    })();
  }, [lang]);

  const authorOptions = useMemo(() => Array.from(authors.values()).sort((a, b) => a.name.localeCompare(b.name)), [authors]);
  const publisherOptions = useMemo(() => Array.from(publishers.values()).sort((a, b) => a.name.localeCompare(b.name)), [publishers]);

  // Filter + sort
  const filteredSorted = useMemo(() => {
    if (!allBooks) return [];
    const q = query.trim().toLowerCase();
    const result = allBooks.filter((b) => {
      if (categoryId !== 'all' && b.category_id !== categoryId) return false;
      if (authorId !== 'all' && b.author_id !== authorId) return false;
      if (publisherId !== 'all' && b.publisher_id !== publisherId) return false;
      if (!q) return true;
      const authorName = b.author_id ? authors.get(b.author_id)?.name ?? '' : '';
      const publisherName = b.publisher_id ? publishers.get(b.publisher_id)?.name ?? '' : '';
      const hay = [
        b.title_ar, b.title_en, b.description_ar, b.description_en,
        b.book_code, authorName, publisherName,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });

    result.sort((a, b) => {
      const ra = Number(a.average_rating ?? 0);
      const rb = Number(b.average_rating ?? 0);
      if (rb !== ra) return rb - ra;
      const ca = a.cover_path ? 1 : 0;
      const cb = b.cover_path ? 1 : 0;
      if (cb !== ca) return cb - ca;
      const ta = (lang === 'ar' ? a.title_ar : (a.title_en || a.title_ar)) || '';
      const tb = (lang === 'ar' ? b.title_ar : (b.title_en || b.title_ar)) || '';
      return ta.localeCompare(tb);
    });

    return result;
  }, [allBooks, query, categoryId, authorId, publisherId, authors, publishers, lang]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageBooks = useMemo(() => filteredSorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filteredSorted, safePage]);

  // Resolve cover URLs for visible page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const need = pageBooks.filter((b) => b.cover_path && !covers.has(b.id));
      if (need.length === 0) return;
      const entries = await Promise.all(need.map(async (b) => [b.id, await signedCoverUrl(b.cover_path)] as const));
      if (cancelled) return;
      setCovers((prev) => {
        const next = new Map(prev);
        for (const [id, url] of entries) next.set(id, url);
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [pageBooks, covers]);

  // Sync URL (debounced for query)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const params: Record<string, string> = {};
      if (query.trim()) params.q = query.trim();
      if (categoryId !== 'all') params.category = categoryId;
      if (authorId !== 'all') params.author = authorId;
      if (publisherId !== 'all') params.publisher = publisherId;
      if (safePage > 1) params.page = String(safePage);
      setSearchParams(params, { replace: true });
    }, 250);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryId, authorId, publisherId, safePage]);

  // Reset to page 1 when filters/query change
  useEffect(() => { setPage(1); }, [query, categoryId, authorId, publisherId]);

  // Scroll position memory
  useEffect(() => {
    const stored = sessionStorage.getItem('catalog_scroll');
    if (stored && !loading) {
      const y = Number(stored);
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    }
    const onScroll = () => sessionStorage.setItem('catalog_scroll', String(window.scrollY));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading]);

  const cards: BookCard[] = pageBooks.map((b) => ({
    id: b.id,
    title_ar: b.title_ar,
    title_en: b.title_en,
    cover_url: covers.get(b.id) ?? null,
    average_rating: b.average_rating,
    ratings_count: b.ratings_count,
    author_name: b.author_id ? authors.get(b.author_id)?.name ?? null : null,
  }));

  const clearFilters = () => {
    setQuery(''); setCategoryId('all'); setAuthorId('all'); setPublisherId('all'); setPage(1);
  };
  const hasFilters = query || categoryId !== 'all' || authorId !== 'all' || publisherId !== 'all';

  const gotoPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">{t('appName')}</h1>
          <p className="mt-1.5 opacity-85 text-sm md:text-base">{t('tagline')}</p>
          <div className="mt-4 max-w-2xl relative">
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

      <section className="max-w-6xl mx-auto px-4 py-5 md:py-7">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 mb-4">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder={t('category')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('category')}: {t('all')}</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={authorId} onValueChange={setAuthorId}>
            <SelectTrigger><SelectValue placeholder={t('author')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('author')}: {t('all')}</SelectItem>
              {authorOptions.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={publisherId} onValueChange={setPublisherId}>
            <SelectTrigger><SelectValue placeholder={t('publisher')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('publisher')}: {t('all')}</SelectItem>
              {publisherOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground flex-1">
              {t('showingResults')}: <span className="font-semibold text-foreground">{filteredSorted.length}</span>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="w-3.5 h-3.5" /> {t('clearFilters')}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <BookGrid books={cards} />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => gotoPage(safePage - 1)} className="gap-1">
                  <ChevronLeft className="w-4 h-4" /> {t('previous')}
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {t('page')} <span className="font-semibold text-foreground">{safePage}</span> {t('of')} {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => gotoPage(safePage + 1)} className="gap-1">
                  {t('next')} <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}
