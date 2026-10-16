import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Layout from '@/components/Layout';
import BookGrid, { BookCard } from '@/components/BookGrid';
import HeroBanner from '@/components/HeroBanner';
import CategoriesTicker from '@/components/CategoriesTicker';
import { useI18n } from '@/lib/i18n';
import { dataService, Book, Banner } from '@/lib/dataService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  X,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function Index() {
  const { t, lang, dir } = useI18n();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [allBooks, setAllBooks] = useState<Book[]>(() => dataService.getBooks());
  const [banners, setBanners] = useState<Banner[]>(() => dataService.getBanners());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Refresh books and banners in case of background updates
    const bks = dataService.getBooks();
    const bans = dataService.getBanners();
    setAllBooks(bks);
    setBanners(bans);
  }, []);

  const categories = useMemo(() => {
    return dataService.getCategories().map((c) => ({
      id: c.id,
      name: lang === 'ar' ? c.name_ar : c.name_en,
    }));
  }, [lang]);

  // Book counts per category for ticker
  const categoryCounts = useMemo(() => {
    const countsMap = new Map<string, number>();
    allBooks.forEach((b) => {
      if (b.category_id) {
        countsMap.set(b.category_id, (countsMap.get(b.category_id) ?? 0) + 1);
      }
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      count: countsMap.get(c.id) ?? 0,
    }));
  }, [allBooks, categories]);

  // Filter books for the homepage
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allBooks.filter((b) => {
      if (selectedCategory !== 'all' && b.category_id !== selectedCategory) return false;
      if (!q) return true;
      const title = (lang === 'ar' ? b.title_ar : b.title_en || b.title_ar).toLowerCase();
      const author = (lang === 'ar' ? b.author_ar : b.author_en || b.author_ar).toLowerCase();
      const code = (b.book_code || '').toLowerCase();
      return title.includes(q) || author.includes(q) || code.includes(q);
    });
  }, [allBooks, searchQuery, selectedCategory, lang]);

  // Strictly EXACTLY 10 BOOKS on homepage (5 in one row, 2 rows)
  const homepageBooks = useMemo(() => {
    return filteredBooks.slice(0, 10);
  }, [filteredBooks]);

  const cards: BookCard[] = homepageBooks.map((b) => ({
    id: b.id,
    title_ar: b.title_ar,
    title_en: b.title_en,
    cover_url: b.cover_url,
    average_rating: b.average_rating,
    ratings_count: b.ratings_count,
    author_name: lang === 'ar' ? b.author_ar : b.author_en || b.author_ar,
    book_code: b.book_code,
    category_name: lang === 'ar' ? b.category_name_ar : b.category_name_en || b.category_name_ar,
    status: b.status,
  }));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedCategory !== 'all') {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      navigate(`/catalog?${params.toString()}`);
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <Layout>
      {/* ======================================================== */}
      {/* 1. HERO RECTANGLE BANNER AREA (Position marked by user)    */}
      {/* Medallion Logo removed as requested                      */}
      {/* Slideshow with 3s image duration, video duration, Drive   */}
      {/* URLs, and smart sliding animation                        */}
      {/* ======================================================== */}
      <section className="relative px-3 sm:px-4 pt-3 sm:pt-6 pb-4 overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Banner Slideshow Container in marked rectangle */}
          <HeroBanner banners={banners} />

          {/* Quick Floating Search Bar right below banner */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-card border border-border/80 rounded-2xl p-2.5 sm:p-3 shadow-sm flex flex-col md:flex-row items-center gap-2 sm:gap-2.5"
          >
            {/* Search text input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchBooks')}
                className="ps-10 pe-9 h-11 bg-background border-border/70 rounded-xl text-sm focus-visible:ring-primary w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category selector */}
            <div className="w-full md:w-56 shrink-0">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/70 text-xs font-medium">
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

            {/* Search Button */}
            <Button
              type="submit"
              className="w-full md:w-auto h-11 px-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-sm transition-all shrink-0 gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>{lang === 'ar' ? 'بحث' : 'Search'}</span>
            </Button>
          </form>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. HOMEPAGE BOOKS (EXACTLY 10 BOOKS, 5 IN ONE ROW)       */}
      {/* Prompt: "make the homepage with 10 books showing in ther */}
      {/* with 5 in one row.there want an option for view full      */}
      {/* catalogue in there."                                     */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* Section Header with "View full catalogue" option */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold mb-1">
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'ar' ? 'مختارات مميزة' : 'Featured Selection'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
              <BookOpen className="w-6 h-6 text-primary" />
              <span>{lang === 'ar' ? 'أبرز الكتب والنفائس' : 'Featured Books & Classics'}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'ar' ? 'أول 10 كتب مختارة بعناية من نفائس المكتبة' : 'Top 10 selected library treasures'}
            </p>
          </div>

          {/* Option for VIEW FULL CATALOGUE (Prompt requirement) */}
          <Button
            variant="outline"
            onClick={() => navigate('/catalog')}
            className="h-10 px-5 rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs gap-2 shrink-0 shadow-sm"
          >
            <span>{t('viewFullCatalogue')}</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* 10 Books Grid (5 in one row on desktop) */}
        <BookGrid books={cards} />

        {/* Bottom Callout to View Full Catalogue */}
        <div className="mt-8 pt-4 flex justify-center">
          <Button
            onClick={() => navigate('/catalog')}
            className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-sm gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('viewFullCatalogue')}</span>
            <ArrowIcon className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. AUTOMATIC HORIZONTAL MOVING ANIMATION OF CATEGORIES   */}
      {/* BELOW THE 10 BOOKS WITH BOOK COUNTS                      */}
      {/* Prompt: "below that add a automatic horizontal moving    */}
      {/* animation of categories name boxes,with count of how     */}
      {/* much books include in that category.the moving animation */}
      {/* make very slow."                                         */}
      {/* ======================================================== */}
      <CategoriesTicker categories={categoryCounts} />
    </Layout>
  );
}
