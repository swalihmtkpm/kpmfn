import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import BookGrid, { BookCard } from '@/components/BookGrid';
import { useI18n } from '@/lib/i18n';
import { dataService, Book } from '@/lib/dataService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, BookOpen, Star, Sparkles, Filter } from 'lucide-react';

export default function Catalog() {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'missed'>('all');

  useEffect(() => {
    // Load all books from dataService
    const list = dataService.getBooks();
    setBooks(list);
  }, []);

  const categories = useMemo(() => {
    return dataService.getCategories().map((c) => ({
      id: c.id,
      name: lang === 'ar' ? c.name_ar : c.name_en,
    }));
  }, [lang]);

  // Filter and Sort strictly according to prompt requirement:
  // "the most rated book should allign as first.after that ,with respect to books name ascending order."
  const filteredAndSortedBooks = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = books.filter((b) => {
      // Category filter
      if (selectedCategory !== 'all' && b.category_id !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'available' && b.status !== 'available') return false;
      if (statusFilter === 'missed' && b.status !== 'missed') return false;

      // Wide search query match
      if (!q) return true;
      const title = (lang === 'ar' ? b.title_ar : b.title_en || b.title_ar).toLowerCase();
      const author = (lang === 'ar' ? b.author_ar : b.author_en || b.author_ar).toLowerCase();
      const publisher = (lang === 'ar' ? b.publisher_ar : b.publisher_en || b.publisher_ar).toLowerCase();
      const code = (b.book_code || '').toLowerCase();
      const cat = (lang === 'ar' ? b.category_name_ar : b.category_name_en || '').toLowerCase();

      return (
        title.includes(q) ||
        author.includes(q) ||
        publisher.includes(q) ||
        code.includes(q) ||
        cat.includes(q)
      );
    });

    // Sort order:
    // 1. Most rated book first (highest average rating, then ratings count)
    // 2. Ascending by book name
    filtered.sort((a, b) => {
      const ratingA = Number(a.average_rating ?? 0);
      const ratingB = Number(b.average_rating ?? 0);
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      const countA = Number(a.ratings_count ?? 0);
      const countB = Number(b.ratings_count ?? 0);
      if (countB !== countA) {
        return countB - countA;
      }
      const nameA = (lang === 'ar' ? a.title_ar : a.title_en || a.title_ar) || '';
      const nameB = (lang === 'ar' ? b.title_ar : b.title_en || b.title_ar) || '';
      return nameA.localeCompare(nameB);
    });

    return filtered;
  }, [books, query, selectedCategory, statusFilter, lang]);

  const cards: BookCard[] = filteredAndSortedBooks.map((b) => ({
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

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setSearchParams({});
  };

  const hasFilters = query || selectedCategory !== 'all' || statusFilter !== 'all';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('appNameShort')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground flex items-center gap-2.5 tracking-tight">
            <BookOpen className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            <span>{t('catalog')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {lang === 'ar'
              ? 'تصفح كامل محتويات المكتبة — مرتبة حسب الأعلى تقييماً ثم هجائياً'
              : 'Browse full library catalog — sorted by most rated first, then alphabetical'}
          </p>
        </div>

        {/* WIDE SEARCH OPTION ACROSS THE TOP (Prompt requirement) */}
        <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-4 shadow-sm mb-8 space-y-3">
          <div className="flex flex-col md:flex-row gap-2.5 items-center">
            {/* Wide Search Bar */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchBooks')}
                className="ps-10 pe-9 h-11 bg-background border-border/70 rounded-xl text-sm focus-visible:ring-primary w-full"
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

            {/* Category Selector */}
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

            {/* Status Filter (All, Available, Missed) */}
            <div className="w-full md:w-44 shrink-0">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/70 text-xs font-medium">
                  <SelectValue placeholder={t('status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('status')}: {t('all')}</SelectItem>
                  <SelectItem value="available">{t('available')}</SelectItem>
                  <SelectItem value="missed">{t('missed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear filters button */}
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-11 px-3.5 rounded-xl text-xs font-semibold gap-1.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('clearFilters')}</span>
              </Button>
            )}
          </div>

          {/* Quick stats & Sorting Notice */}
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <div>
              {t('showingResults')}: <span className="font-bold text-foreground">{filteredAndSortedBooks.length}</span> {t('books')}
            </div>
            <div className="flex items-center gap-1.5 font-medium text-[11px] text-primary">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{lang === 'ar' ? 'الترتيب: الأعلى تقييماً أولاً ثم أبجدياً' : 'Sorted: Highest rated first, then A-Z'}</span>
            </div>
          </div>
        </div>

        {/* The Whole Books Grid (Strictly 5 in a row on desktop) */}
        <BookGrid books={cards} />
      </div>
    </Layout>
  );
}
