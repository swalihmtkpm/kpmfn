import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Layout from '@/components/Layout';
import BookGrid, { BookCard } from '@/components/BookGrid';
import GeometricLineBackground from '@/components/GeometricLineBackground';
import IslamicMedallion from '@/components/IslamicMedallion';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { signedCoverUrls, signedAdUrl } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { FullPageLoader } from '@/components/LogoSpinner';

const PAGE_SIZE = 50;

type Option = { id: string; name: string };
type RawBook = {
  id: string;
  si_number: number | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  book_code: string | null;
  cover_path: string | null;
  average_rating: number | null;
  ratings_count: number | null;
  author_id: string | null;
  category_id: string | null;
  publisher_id: string | null;
  status: string | null;
};
type Ad = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  image_path: string | null;
  link_url: string | null;
};

export default function Index() {
  const { t, lang, dir } = useI18n();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
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
  const [coverUrls, setCoverUrls] = useState<Map<string, string>>(new Map());
  const [ads, setAds] = useState<Ad[]>([]);
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [adIdx, setAdIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<number | null>(null);
  const catalogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: auts }, { data: pubs }, { data: bks }, { data: ad }] = await Promise.all([
        supabase.from('categories').select('id, name_ar, name_en').order('sort_order'),
        supabase.from('authors').select('id, name_ar, name_en'),
        supabase.from('publishers').select('id, name_ar, name_en'),
        supabase.from('books').select('id, si_number, title_ar, title_en, description_ar, book_code, cover_path, average_rating, ratings_count, author_id, category_id, publisher_id, status'),
        supabase.from('advertisements').select('id, title_ar, title_en, image_path, link_url').eq('is_active', true).order('sort_order'),
      ]);
      const pick = (ar: string, en: string | null) => (lang === 'ar' ? ar : (en || ar));
      setCategories((cats ?? []).map((c) => ({ id: c.id, name: pick(c.name_ar, c.name_en) })));
      setAuthors(new Map((auts ?? []).map((a) => [a.id, { id: a.id, name: pick(a.name_ar, a.name_en) }])));
      setPublishers(new Map((pubs ?? []).map((p) => [p.id, { id: p.id, name: pick(p.name_ar, p.name_en) }])));
      const books = (bks ?? []) as RawBook[];
      setAllBooks(books);
      const paths = books.map((b) => b.cover_path).filter(Boolean) as string[];
      setCoverUrls(await signedCoverUrls(paths));
      setAds(((ad ?? []) as Ad[]).filter((a) => a.image_path));
      setLoading(false);
    })();
  }, [lang]);

  useEffect(() => {
    if (ads.length < 2) return;
    const id = window.setInterval(() => setAdIdx((i) => (i + 1) % ads.length), 6000);
    return () => window.clearInterval(id);
  }, [ads.length]);

  useEffect(() => {
    const active = ads[adIdx];
    if (!active?.image_path) { setAdUrl(null); return; }
    signedAdUrl(active.image_path).then(setAdUrl);
  }, [ads, adIdx]);

  const authorOptions = useMemo(() => Array.from(authors.values()).sort((a, b) => a.name.localeCompare(b.name)), [authors]);
  const publisherOptions = useMemo(() => Array.from(publishers.values()).sort((a, b) => a.name.localeCompare(b.name)), [publishers]);

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
      const hay = [b.title_ar, b.title_en, b.description_ar, b.book_code, authorName, publisherName]
        .filter(Boolean).join(' ').toLowerCase();
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

  useEffect(() => { setPage(1); }, [query, categoryId, authorId, publisherId]);

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
    cover_url: b.cover_path ? coverUrls.get(b.cover_path) ?? null : null,
    average_rating: b.average_rating,
    ratings_count: b.ratings_count,
    author_name: b.author_id ? authors.get(b.author_id)?.name ?? null : null,
    book_code: b.book_code,
    status: b.status,
  }));

  const clearFilters = () => {
    setQuery('');
    setCategoryId('all');
    setAuthorId('all');
    setPublisherId('all');
    setPage(1);
  };
  const hasFilters = query || categoryId !== 'all' || authorId !== 'all' || publisherId !== 'all';
  const gotoPage = (n: number) => {
    setPage(n);
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const activeAd = ads[adIdx];
  const adTitle = activeAd ? (lang === 'ar' ? activeAd.title_ar : (activeAd.title_en || activeAd.title_ar)) ?? '' : '';

  const bookCountByCat = useMemo(() => {
    const m = new Map<string, number>();
    (allBooks ?? []).forEach((b) => { if (b.category_id) m.set(b.category_id, (m.get(b.category_id) ?? 0) + 1); });
    return m;
  }, [allBooks]);

  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <Layout>
      {/* ======================================================== */}
      {/* DESKTOP & MOBILE HERO SECTION                            */}
      {/* Desktop: Image 1 Inspiration (Clean Islamic Hero Layout) */}
      {/* Mobile: Image 3 Inspiration (Welcome Header & Banner)    */}
      {/* ======================================================== */}
      <section className="relative px-3 sm:px-4 pt-3 sm:pt-6 pb-6 md:pb-12 overflow-hidden">
        {/* Rounded container with subtle borders matching Image 1 */}
        <div className="max-w-6xl mx-auto relative rounded-3xl md:rounded-[2rem] bg-gradient-to-b from-primary/[0.04] via-card to-background border border-primary/10 shadow-sm p-4 sm:p-6 md:p-12 overflow-hidden">
          {/* Subtle animated Islamic geometric line texture in background */}
          <GeometricLineBackground />

          {/* Desktop Layout (Image 1) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Hero Text Content */}
            <div className="md:col-span-7 text-start space-y-4">
              {/* Mobile Welcome Greeting Badge (Image 3) */}
              <div className="md:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <span>👋</span>
                <span>{lang === 'ar' ? 'يا هلا ومرحبًا بكم' : 'Welcome to Makthaba'}</span>
              </div>

              {/* Islamic Library Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight leading-[1.15]">
                  {lang === 'ar' ? 'ابحث عن كتابك المفضل' : 'Find your favorite book'}
                </h1>
              </motion.div>

              {/* Subtitle / Description */}
              <motion.p
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed"
              >
                {lang === 'ar'
                  ? 'مكتبة الامتياز الرقمية منارة المعرفة والقراءة لطلاب وخريجي الامتياز، تضم آلاف المراجع والمصادر الإسلامية والعلمية في متناول يديك.'
                  : 'Makthabathul Imthiyaz digital library is a beacon of knowledge and reading, offering thousands of precious Islamic and academic references at your fingertips.'}
              </motion.p>

              {/* Quick stats / Highlights on desktop */}
              <div className="hidden sm:flex items-center gap-6 pt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{allBooks?.length ?? '...'}</span>
                  <span>{t('books')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{categories.length}</span>
                  <span>{t('categories')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{authors.size}</span>
                  <span>{t('authors')}</span>
                </div>
              </div>
            </div>

            {/* Right Side: Calligraphy Medallion with Emerald Glowing Halo (Image 1) */}
            <div className="hidden md:flex md:col-span-5 justify-center items-center">
              <IslamicMedallion size={300} />
            </div>
          </div>

          {/* ======================================================== */}
          {/* FLOATING UNIFIED SEARCH & FILTER BAR (Image 1 Inspiration) */}
          {/* ======================================================== */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 mt-6 md:mt-10"
          >
            <div className="bg-card/95 backdrop-blur-md rounded-2xl md:rounded-2xl p-2.5 sm:p-3 border border-border/80 shadow-lg flex flex-col md:flex-row items-center gap-2 sm:gap-2.5">
              {/* Search text input */}
              <div className="relative w-full md:flex-[1.5]">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchBooks')}
                  className="ps-10 pe-9 h-11 bg-background/80 border-border/60 rounded-xl text-sm focus-visible:ring-primary"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category selector */}
              <div className="w-full md:w-48">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/80 border-border/60 text-xs font-medium">
                    <SelectValue placeholder={t('category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('category')}: {t('all')}</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Author selector */}
              <div className="w-full md:w-48">
                <Select value={authorId} onValueChange={setAuthorId}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/80 border-border/60 text-xs font-medium">
                    <SelectValue placeholder={t('author')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('author')}: {t('all')}</SelectItem>
                    {authorOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distinctive Emerald Search Button (Image 1 Inspiration) */}
              <Button
                onClick={scrollToCatalog}
                className="w-full md:w-auto h-11 px-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all active:scale-95 shrink-0"
              >
                <Search className="w-4 h-4 me-1.5" />
                <span>{lang === 'ar' ? 'بحث' : 'Search'}</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* PROMO BANNER / CAROUSEL (Image 3 Inspiration)            */}
      {/* ======================================================== */}
      {(activeAd && adUrl) || ads.length === 0 ? (
        <section className="max-w-6xl mx-auto px-4 pt-2">
          {activeAd && adUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-md bg-accent aspect-[16/7] md:aspect-[16/4] clip-reveal-banner group">
              <a
                href={activeAd.link_url || '#'}
                target={activeAd.link_url ? '_blank' : undefined}
                rel="noreferrer"
                className="block w-full h-full relative"
              >
                <img
                  key={activeAd.id}
                  src={adUrl}
                  alt={adTitle}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {adTitle && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white p-4 text-sm md:text-base font-bold">
                    {adTitle}
                  </div>
                )}
              </a>

              {ads.length > 1 && (
                <div className="absolute bottom-3 end-3 flex gap-1.5 z-10">
                  {ads.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setAdIdx(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === adIdx ? 'w-6 bg-primary' : 'w-2 bg-white/60'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Elegant Islamic Library Banner when no ads uploaded */
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 flex items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 text-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {t('appNameShort')}
                </span>
                <p className="text-sm sm:text-base font-bold text-foreground">
                  {lang === 'ar'
                    ? '«طلبُ العِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ»'
                    : '“Seeking knowledge is an obligation upon every Muslim.”'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar' ? 'تصفح كتبك المفضلة واستمتع برحلة القراءة' : 'Browse your favorite books and enjoy the journey of reading'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToCatalog}
                className="shrink-0 rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-1.5 font-bold"
              >
                <span>{lang === 'ar' ? 'تصفح الآن' : 'Browse Now'}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </section>
      ) : null}

      {/* ======================================================== */}
      {/* HORIZONTAL CATEGORY CHIPS (Image 3 Inspiration - Mobile & Desktop) */}
      {/* ======================================================== */}
      <section id="categories" className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-extrabold text-foreground tracking-tight">
              {t('categories')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/browse')}
            className="text-xs font-bold text-primary hover:text-primary/80 gap-1"
          >
            <span>{lang === 'ar' ? 'عرض الكل' : 'View All'}</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Scrollable Category Chips row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          {/* All category pill */}
          <button
            onClick={() => { setCategoryId('all'); scrollToCatalog(); }}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              categoryId === 'all'
                ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                : 'bg-card hover:bg-accent border border-border/80 text-foreground'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('all')}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              categoryId === 'all' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {allBooks?.length ?? 0}
            </span>
          </button>

          {/* Dynamic Category Chips */}
          {categories.map((c) => {
            const count = bookCountByCat.get(c.id) ?? 0;
            const isSelected = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setCategoryId(c.id); scrollToCatalog(); }}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                    : 'bg-card hover:bg-accent border border-border/80 text-foreground'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-primary" />
                <span>{c.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* CATALOG SECTION (Image 2 Desktop 5 cols & Image 3 Mobile 3 cols) */}
      {/* ======================================================== */}
      <section ref={catalogRef} id="catalog" className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Section Header with Text-Reveal Animation (Image 1 & Image 2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-border/60">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
              <BookOpen className="w-6 h-6 text-primary" />
              <span>{lang === 'ar' ? 'مكتبة الكتب' : 'Library Catalog'}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('showingResults')}: <span className="font-bold text-foreground">{filteredSorted.length}</span> {t('books')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('clearFilters')}</span>
              </Button>
            )}

            {/* Quick Browse button matching Image 1's "All hadith books" button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/browse')}
              className="h-8 text-xs font-bold text-primary border-primary/40 hover:bg-primary hover:text-primary-foreground rounded-lg gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t('browseCategories')}</span>
            </Button>
          </div>
        </div>

        {/* Catalog Body */}
        {loading ? (
          <FullPageLoader />
        ) : (
          <>
            {/* BookGrid strictly enforcing 3 columns on mobile, 5 on desktop */}
            <BookGrid books={cards} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => gotoPage(safePage - 1)}
                  className="gap-1 h-9 rounded-xl font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('previous')}</span>
                </Button>

                <div className="text-xs font-semibold text-muted-foreground px-3 py-1.5 rounded-lg bg-secondary/80">
                  {t('page')} <span className="font-bold text-foreground">{safePage}</span> {t('of')} {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => gotoPage(safePage + 1)}
                  className="gap-1 h-9 rounded-xl font-bold"
                >
                  <span>{t('next')}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}
