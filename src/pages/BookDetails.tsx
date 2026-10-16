import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { signedCoverUrl } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';
import StarRating from '@/components/StarRating';
import BorrowRequestModal from '@/components/BorrowRequestModal';
import BookReader from '@/components/BookReader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Home,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { FullPageLoader } from '@/components/LoadingIndicator';
import { dataService, convertDriveUrl, Review as DataReview } from '@/lib/dataService';

type Detail = {
  id: string;
  si_number: number | null;
  book_code: string | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  volume: string | null;
  pages: number | null;
  cover_path: string | null;
  full_text: string | null;
  status: string;
  average_rating: number | null;
  ratings_count: number | null;
  authors: any;
  publishers: any;
  categories: any;
};

type Review = {
  id: string;
  reviewer_name: string | null;
  content: string;
  rating?: number;
  created_at: string;
};

type ActiveBorrow = {
  borrower_name: string | null;
  due_at: string | null;
};

// Safe helper to extract localized name whether entity is string, object, or array
function getEntityName(entity: any, lang: string): string {
  if (!entity) return '';
  if (typeof entity === 'string') return entity.trim();
  if (Array.isArray(entity)) {
    return getEntityName(entity[0], lang);
  }
  if (typeof entity === 'object') {
    if (lang === 'ar') return entity.name_ar || entity.name_en || entity.name || '';
    return entity.name_en || entity.name_ar || entity.name || '';
  }
  return String(entity);
}

export default function BookDetails() {
  const { id } = useParams();
  const { t, lang, dir } = useI18n();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Instant synchronous initialization from dataService
  const initialLocalBook = id ? dataService.getBookById(id) : undefined;

  const [book, setBook] = useState<Detail | null>(() => {
    if (!initialLocalBook) return null;
    return {
      id: initialLocalBook.id,
      si_number: initialLocalBook.si_number,
      book_code: initialLocalBook.book_code,
      title_ar: initialLocalBook.title_ar,
      title_en: initialLocalBook.title_en,
      description_ar: initialLocalBook.description_ar || null,
      volume: initialLocalBook.volume,
      pages: initialLocalBook.pages,
      cover_path: null,
      full_text: null,
      status: initialLocalBook.status,
      average_rating: initialLocalBook.average_rating,
      ratings_count: initialLocalBook.ratings_count,
      authors: { name_ar: initialLocalBook.author_ar, name_en: initialLocalBook.author_en },
      publishers: { name_ar: initialLocalBook.publisher_ar, name_en: initialLocalBook.publisher_en },
      categories: { name_ar: initialLocalBook.category_name_ar, name_en: initialLocalBook.category_name_en },
    };
  });

  const [cover, setCover] = useState<string | null>(() => {
    if (!initialLocalBook?.cover_url) return null;
    return convertDriveUrl(initialLocalBook.cover_url) || initialLocalBook.cover_url;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    if (!id) return [];
    return (dataService.getReviews(id) as Review[]) || [];
  });

  const [activeBorrow, setActiveBorrow] = useState<ActiveBorrow | null>(() => {
    if (!id) return null;
    const activeRecord = dataService.getBorrowRecords().find(
      (r) => (r.book_id === id || r.book_id === initialLocalBook?.id) && r.status === 'active'
    );
    return activeRecord ? { borrower_name: activeRecord.borrower_name, due_at: activeRecord.due_at } : null;
  });

  const [stars, setStars] = useState(0);
  const [reviewerName, setReviewerName] = useState(() => {
    try {
      return localStorage.getItem('imthiyaz_user_name') || '';
    } catch {
      return '';
    }
  });
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState<boolean>(() => !initialLocalBook);
  const [error, setError] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [showReader, setShowReader] = useState(false);

  const load = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setError(null);

    try {
      // 1. Check dataService first (instant local access)
      const localBook = dataService.getBookById(id);
      if (localBook) {
        setBook({
          id: localBook.id,
          si_number: localBook.si_number,
          book_code: localBook.book_code,
          title_ar: localBook.title_ar,
          title_en: localBook.title_en,
          description_ar: localBook.description_ar || null,
          volume: localBook.volume,
          pages: localBook.pages,
          cover_path: null,
          full_text: null,
          status: localBook.status,
          average_rating: localBook.average_rating,
          ratings_count: localBook.ratings_count,
          authors: { name_ar: localBook.author_ar, name_en: localBook.author_en },
          publishers: { name_ar: localBook.publisher_ar, name_en: localBook.publisher_en },
          categories: { name_ar: localBook.category_name_ar, name_en: localBook.category_name_en },
        });

        if (localBook.cover_url) {
          setCover(convertDriveUrl(localBook.cover_url) || localBook.cover_url);
        }

        const activeRecord = dataService.getBorrowRecords().find(
          (r) => (r.book_id === id || r.book_id === localBook.id) && r.status === 'active'
        );
        if (activeRecord) {
          setActiveBorrow({
            borrower_name: activeRecord.borrower_name,
            due_at: activeRecord.due_at,
          });
        }

        const localReviews = dataService.getReviews(localBook.id);
        if (localReviews.length > 0) {
          setReviews(localReviews as Review[]);
        }

        setLoading(false);
        return;
      }

      // 2. Fallback to Supabase with strict 2.5s timeout guard
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2500)
      );

      const supabaseQuery = supabase
        .from('books')
        .select('id, si_number, book_code, title_ar, title_en, description_ar, volume, pages, cover_path, full_text, status, average_rating, ratings_count, authors(name_ar, name_en), publishers(name_ar, name_en), categories(name_ar, name_en)')
        .eq('id', id)
        .maybeSingle();

      const { data } = await (Promise.race([supabaseQuery, timeoutPromise]) as Promise<any>);

      if (data) {
        setBook(data as Detail | null);
        if (data?.cover_path) setCover(await signedCoverUrl(data.cover_path));

        const { data: rv } = await supabase
          .from('reviews')
          .select('id, reviewer_name, content, created_at')
          .eq('book_id', id)
          .order('created_at', { ascending: false });

        if (rv && rv.length > 0) {
          setReviews(rv as Review[]);
        }

        const { data: br } = await supabase
          .from('borrow_records')
          .select('borrower_name, due_at')
          .eq('book_id', id)
          .is('returned_at', null)
          .order('borrowed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (br) setActiveBorrow(br as ActiveBorrow);
      }
    } catch (e: any) {
      console.warn('Note on book details load:', e);
      if (!initialLocalBook) {
        setError(e?.message || 'Failed to load book data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!book) {
      setLoading(true);
    }
    load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id]);

  const saveName = (v: string) => {
    setReviewerName(v);
    try {
      localStorage.setItem('imthiyaz_user_name', v);
    } catch {}
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/catalog');
    }
  };

  // Submit Rating (Saves in dataService + syncs with Supabase if UUID)
  const submitRating = async (s: number) => {
    if (!id) return;
    if (!reviewerName.trim()) {
      toast.error(t('yourName'));
      return;
    }
    setStars(s);

    try {
      const res = dataService.addRating(id, s, reviewerName.trim());
      setBook((b) => (b ? { ...b, average_rating: res.average_rating, ratings_count: res.ratings_count } : b));
      toast.success(t('ratingSaved'));

      // If id is a valid UUID, also sync to Supabase
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        supabase.from('ratings').insert({ book_id: id, stars: s, rater_name: reviewerName.trim() }).catch(() => {});
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving rating');
    }
  };

  // Submit Review (Saves in dataService + syncs with Supabase if UUID)
  const submitReview = async () => {
    if (!id || !reviewText.trim()) return;
    if (!reviewerName.trim()) {
      toast.error(t('yourName'));
      return;
    }

    setSubmitting(true);
    try {
      const newRev = dataService.addReview({
        book_id: id,
        reviewer_name: reviewerName.trim(),
        content: reviewText.trim(),
        rating: stars > 0 ? stars : undefined,
      });

      setReviews((prev) => [newRev as Review, ...prev]);
      setReviewText('');
      toast.success(t('reviewSaved'));

      // If id is a valid UUID, also sync to Supabase
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        supabase.from('reviews').insert({ book_id: id, content: reviewText.trim(), reviewer_name: reviewerName.trim() }).catch(() => {});
      }
    } catch (err: any) {
      toast.error(err.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading State (With brand spinner)
  if (loading) {
    return (
      <Layout>
        <FullPageLoader text={lang === 'ar' ? 'جارٍ تحميل تفاصيل الكتاب...' : 'Loading book details...'} />
      </Layout>
    );
  }

  // 2. Error State (With Retry Button)
  if (error && !book) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {lang === 'ar' ? 'تعذر تحميل تفاصيل الكتاب' : 'Unable to load book details'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'حدث خطأ في الاتصال بقاعدة البيانات. يمكنك المحاولة مرة أخرى أو العودة إلى الكتالوج.'
              : 'A network or server error occurred while retrieving book records.'}
          </p>
          <div className="flex gap-2.5 justify-center pt-2">
            <Button onClick={load} className="h-10 px-6 rounded-xl font-bold bg-primary text-primary-foreground gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/catalog')} className="h-10 px-6 rounded-xl font-bold">
              <span>{t('backToCatalog')}</span>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // 3. Not Found State (With Return links)
  if (!book) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">
            {lang === 'ar' ? 'الكتاب غير موجود' : 'Book Not Found'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {lang === 'ar'
              ? 'لم نتمكن من العثور على هذا الكتاب في سجلات المكتبة. قد يكون الرمز غير صحيح أو تم نقله.'
              : 'We could not find this book in the library catalogue. The book code may be invalid or moved.'}
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center pt-2">
            <Button onClick={() => navigate('/catalog')} className="h-10 px-6 rounded-xl font-bold bg-primary text-primary-foreground">
              <span>{t('backToCatalog')}</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="h-10 px-6 rounded-xl font-bold gap-2">
              <Home className="w-4 h-4" />
              <span>{t('home')}</span>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const title = lang === 'ar' ? book.title_ar : (book.title_en || book.title_ar);
  const desc = book.description_ar;
  const authorName = getEntityName(book.authors, lang);
  const publisherName = getEntityName(book.publishers, lang);
  const categoryName = getEntityName(book.categories, lang);
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto px-4 py-6 md:py-10"
      >
        {/* Back navigation */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-6 cursor-pointer focus:outline-none"
        >
          <BackIcon className="w-4 h-4" />
          <span>{t('backToCatalog')}</span>
        </button>

        {/* Book Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-10 items-start">
          {/* Book Cover Frame */}
          <div className="mx-auto md:mx-0 w-44 sm:w-52 md:w-full">
            <div className="relative aspect-[1/1.45] rounded-xl overflow-hidden bg-accent shadow-book-hover border border-border/60">
              <div className="book-spine-highlight" />
              {cover ? (
                <img
                  src={cover}
                  alt={title}
                  className="w-full h-full object-cover clip-reveal-banner"
                  onError={() => setCover(null)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-primary/15 via-primary/5 to-primary/20 text-foreground">
                  <BookOpen className="w-12 h-12 text-primary/70 mb-2" />
                  <span className="text-xs font-bold line-clamp-3">{title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{t('appNameShort')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Book Metadata & Actions */}
          <div className="space-y-4">
            <div>
              {authorName && (
                <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">
                  {authorName}
                </p>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mt-1 tracking-tight leading-tight">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <StarRating value={Number(book.average_rating ?? 0)} readOnly />
              <span className="text-sm text-muted-foreground font-semibold">
                {Number(book.average_rating ?? 0).toFixed(1)} ({book.ratings_count ?? 0})
              </span>
              {activeBorrow ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-warning/15 text-warning font-bold">
                  {t('currentlyBorrowed')}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-success/15 text-success font-bold">
                  {t('available')}
                </span>
              )}
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-secondary/40 border border-border/60 text-sm">
              {book.book_code && <Meta label={t('bookCode')} value={book.book_code} />}
              {book.si_number != null && <Meta label={t('siNumber')} value={String(book.si_number)} />}
              {categoryName && <Meta label={t('category')} value={categoryName} />}
              {publisherName && <Meta label={t('publisher')} value={publisherName} />}
              {book.volume && <Meta label={t('volume')} value={book.volume} />}
              {book.pages != null && <Meta label={t('pages')} value={String(book.pages)} />}
            </div>

            {/* Missed Book Warning Notice */}
            {book.status === 'missed' && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-destructive">
                <BookOpen className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">{t('bookMissedBadge')}</p>
                  <p className="text-xs mt-0.5 opacity-90">{t('missedBookNotice')}</p>
                </div>
              </div>
            )}

            {/* Currently Borrowed Notice */}
            {activeBorrow && book.status !== 'missed' && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 flex items-start gap-2.5">
                <BookMarked className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-foreground">{t('currentlyBorrowed')}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {activeBorrow.borrower_name && (
                      <>{t('borrowedBy')}: <span className="font-semibold text-foreground">{activeBorrow.borrower_name}</span>. </>
                    )}
                    {activeBorrow.due_at && (
                      <>{t('expectedReturn')}: <span className="font-semibold text-foreground">{new Date(activeBorrow.due_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</span></>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {book.status === 'missed' ? (
                <Button
                  disabled
                  variant="outline"
                  className="h-11 rounded-xl px-6 font-bold border-destructive/50 text-destructive bg-destructive/5 cursor-not-allowed opacity-80"
                >
                  <BookOpen className="w-4 h-4 me-1.5" />
                  <span>{t('bookMissedBadge')}</span>
                </Button>
              ) : !activeBorrow && (
                <Button
                  onClick={() => setShowRequest(true)}
                  className="h-11 rounded-xl px-6 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <BookOpen className="w-4 h-4 me-1.5" />
                  <span>{t('requestBook')}</span>
                </Button>
              )}
              {book.full_text && (
                <Button
                  variant="outline"
                  onClick={() => setShowReader(true)}
                  className="h-11 rounded-xl px-6 font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Sparkles className="w-4 h-4 me-1.5" />
                  <span>{t('readFullText')}</span>
                </Button>
              )}
            </div>

            {/* Book Description */}
            {desc && (
              <div className="pt-4 border-t border-border/50">
                <h2 className="text-base font-bold text-foreground mb-2">{t('description')}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" dir="rtl">
                  {desc}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-14 pt-8 border-t border-border/60">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-extrabold text-foreground">{t('reviews')}</h2>
          </div>

          <Card className="p-4 sm:p-6 mb-6 rounded-2xl border-border/60 shadow-sm bg-card">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">{t('yourName')}</label>
                <Input
                  value={reviewerName}
                  onChange={(e) => saveName(e.target.value)}
                  className="rounded-xl h-10"
                  placeholder={lang === 'ar' ? 'أدخل اسمك الكريم' : 'Enter your name'}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">{t('yourRating')}</label>
                <StarRating value={stars} onChange={submitRating} />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">{t('writeReview')}</label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  className="rounded-xl"
                  placeholder={t('writeReview')}
                />
                <Button
                  onClick={submitReview}
                  disabled={submitting || !reviewText.trim()}
                  className="mt-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5"
                  size="sm"
                >
                  {t('postReview')}
                </Button>
              </div>
            </div>
          </Card>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('noReviews')}</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id} className="p-4 rounded-xl border-border/60 shadow-sm bg-card">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="font-bold text-sm text-foreground">{r.reviewer_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <BorrowRequestModal
        bookId={book.id}
        bookTitle={title}
        isMissed={book.status === 'missed'}
        open={showRequest}
        onClose={() => setShowRequest(false)}
      />
      {book.full_text && (
        <BookReader bookId={book.id} title={title} text={book.full_text} open={showReader} onClose={() => setShowReader(false)} />
      )}
    </Layout>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}
