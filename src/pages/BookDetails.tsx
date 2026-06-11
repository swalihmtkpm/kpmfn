import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { signedCoverUrl } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';
import StarRating from '@/components/StarRating';
import BorrowRequestModal from '@/components/BorrowRequestModal';
import BookReader from '@/components/BookReader';
import BookAssistant from '@/components/BookAssistant';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { FullPageLoader } from '@/components/LogoSpinner';

type Detail = {
  id: string; si_number: number | null; book_code: string | null;
  title_ar: string; title_en: string | null;
  description_ar: string | null; description_en: string | null;
  volume: string | null; pages: number | null;
  cover_path: string | null; full_text: string | null; status: string;
  average_rating: number | null; ratings_count: number | null;
  authors: { name_ar: string; name_en: string } | null;
  publishers: { name_ar: string; name_en: string } | null;
  categories: { name_ar: string; name_en: string } | null;
};

type Review = { id: string; reviewer_name: string | null; content: string; created_at: string };

export default function BookDetails() {
  const { id } = useParams();
  const { t, lang, dir } = useI18n();

  const [book, setBook] = useState<Detail | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stars, setStars] = useState(0);
  const [reviewerName, setReviewerName] = useState(() => localStorage.getItem('imthiyaz_user_name') || '');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [showReader, setShowReader] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from('books')
      .select('id, si_number, book_code, title_ar, title_en, description_ar, description_en, volume, pages, cover_path, full_text, status, average_rating, ratings_count, authors(name_ar, name_en), publishers(name_ar, name_en), categories(name_ar, name_en)')
      .eq('id', id).maybeSingle();
    setBook(data as Detail | null);
    if (data?.cover_path) setCover(await signedCoverUrl(data.cover_path));
    const { data: rv } = await supabase.from('reviews').select('id, reviewer_name, content, created_at').eq('book_id', id).order('created_at', { ascending: false });
    setReviews((rv ?? []) as Review[]);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const saveName = (v: string) => { setReviewerName(v); localStorage.setItem('imthiyaz_user_name', v); };

  const submitRating = async (s: number) => {
    if (!id) return;
    if (!reviewerName.trim()) return toast.error(t('yourName'));
    setStars(s);
    const { error } = await supabase.from('ratings').insert({ book_id: id, stars: s, rater_name: reviewerName.trim() });
    if (error) return toast.error(error.message);
    toast.success(t('ratingSaved'));
    const { data } = await supabase.from('books').select('average_rating, ratings_count').eq('id', id).maybeSingle();
    if (data) setBook((b) => b ? { ...b, average_rating: data.average_rating, ratings_count: data.ratings_count } : b);
  };

  const submitReview = async () => {
    if (!id || !reviewText.trim()) return;
    if (!reviewerName.trim()) return toast.error(t('yourName'));
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({ book_id: id, content: reviewText.trim(), reviewer_name: reviewerName.trim() });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setReviewText('');
    toast.success(t('reviewSaved'));
    load();
  };

  if (loading) return <Layout><FullPageLoader /></Layout>;
  if (!book) return <Layout><div className="max-w-3xl mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">{t('notFound')}</p><Link to="/" className="text-primary underline mt-3 inline-block">{t('backToCatalog')}</Link></div></Layout>;

  const title = lang === 'ar' ? book.title_ar : (book.title_en || book.title_ar);
  const desc = lang === 'ar' ? book.description_ar : (book.description_en || book.description_ar);
  const authorName = book.authors ? (lang === 'ar' ? book.authors.name_ar : book.authors.name_en) : null;
  const publisherName = book.publishers ? (lang === 'ar' ? book.publishers.name_ar : book.publishers.name_en) : null;
  const categoryName = book.categories ? (lang === 'ar' ? book.categories.name_ar : book.categories.name_en) : null;
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <BackIcon className="w-4 h-4" /> {t('backToCatalog')}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-8">
          <div className="mx-auto md:mx-0 w-40 md:w-full">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-accent shadow-elevated">
              {cover ? <img src={cover} alt={title} className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center gradient-primary text-primary-foreground"><BookOpen className="w-12 h-12 opacity-70" /></div>}
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{title}</h1>
            {authorName && <p className="mt-1 text-muted-foreground">{authorName}</p>}
            <div className="mt-3 flex items-center gap-3">
              <StarRating value={Number(book.average_rating ?? 0)} readOnly />
              <span className="text-sm text-muted-foreground">{Number(book.average_rating ?? 0).toFixed(1)} ({book.ratings_count ?? 0})</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{t(book.status as any)}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              {book.book_code && <Meta label={t('bookCode')} value={book.book_code} />}
              {book.si_number != null && <Meta label={t('siNumber')} value={String(book.si_number)} />}
              {categoryName && <Meta label={t('category')} value={categoryName} />}
              {publisherName && <Meta label={t('publisher')} value={publisherName} />}
              {book.volume && <Meta label={t('volume')} value={book.volume} />}
              {book.pages != null && <Meta label={t('pages')} value={String(book.pages)} />}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => setShowRequest(true)}>{t('requestBook')}</Button>
              {book.full_text && <Button variant="outline" onClick={() => setShowReader(true)}>{t('readFullText')}</Button>}
            </div>

            {desc && (
              <div className="mt-5">
                <h2 className="font-semibold text-foreground mb-1.5">{t('description')}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{desc}</p>
              </div>
            )}
          </div>
        </div>

        {book.full_text && (
          <div className="mt-8">
            <BookAssistant bookId={book.id} />
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-bold text-foreground mb-4">{t('reviews')}</h2>
          <Card className="p-4 mb-5">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1.5">{t('yourName')}</p>
                <Input value={reviewerName} onChange={(e) => saveName(e.target.value)} />
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium mb-1.5">{t('yourRating')}</p>
                  <StarRating value={stars} onChange={submitRating} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">{t('writeReview')}</p>
                <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} placeholder={t('writeReview')} />
                <Button onClick={submitReview} disabled={submitting || !reviewText.trim()} className="mt-2" size="sm">{t('postReview')}</Button>
              </div>
            </div>
          </Card>

          {reviews.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">{t('noReviews')}</p> : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-sm text-foreground">{r.reviewer_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BorrowRequestModal bookId={book.id} open={showRequest} onClose={() => setShowRequest(false)} />
      {book.full_text && <BookReader bookId={book.id} title={title} text={book.full_text} open={showReader} onClose={() => setShowReader(false)} />}
    </Layout>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div>;
}
