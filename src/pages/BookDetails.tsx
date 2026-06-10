import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { signedCoverUrl } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import StarRating from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type Detail = {
  id: string;
  si_number: number | null;
  book_code: string | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  volume: string | null;
  pages: number | null;
  cover_path: string | null;
  full_text: string | null;
  average_rating: number | null;
  ratings_count: number | null;
  authors: { name_ar: string; name_en: string } | null;
  publishers: { name_ar: string; name_en: string } | null;
  categories: { name_ar: string; name_en: string } | null;
};

type Review = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { username: string; full_name: string | null } | null;
};

export default function BookDetails() {
  const { id } = useParams();
  const { t, lang, dir } = useI18n();
  const { user } = useAuth();

  const [book, setBook] = useState<Detail | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFullText, setShowFullText] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('books')
      .select('id, si_number, book_code, title_ar, title_en, description_ar, description_en, volume, pages, cover_path, full_text, average_rating, ratings_count, authors(name_ar, name_en), publishers(name_ar, name_en), categories(name_ar, name_en)')
      .eq('id', id)
      .maybeSingle();
    setBook(data as Detail | null);
    if (data?.cover_path) setCover(await signedCoverUrl(data.cover_path));

    const { data: rv } = await supabase
      .from('reviews')
      .select('id, user_id, content, created_at')
      .eq('book_id', id)
      .order('created_at', { ascending: false });
    const userIds = Array.from(new Set((rv ?? []).map((r) => r.user_id)));
    let profilesMap = new Map<string, { username: string; full_name: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', userIds);
      profilesMap = new Map((profs ?? []).map((p) => [p.id, { username: p.username, full_name: p.full_name }]));
    }
    setReviews((rv ?? []).map((r) => ({ ...r, profile: profilesMap.get(r.user_id) ?? null })));

    if (user) {
      const { data: mine } = await supabase
        .from('ratings')
        .select('stars')
        .eq('book_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      setMyRating(mine?.stars ?? 0);
    } else {
      setMyRating(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const submitRating = async (stars: number) => {
    if (!user || !id) return;
    setMyRating(stars);
    const { error } = await supabase
      .from('ratings')
      .upsert({ book_id: id, user_id: user.id, stars }, { onConflict: 'book_id,user_id' });
    if (error) { toast.error(error.message); return; }
    toast.success(t('ratingSaved'));
    // refresh aggregate
    const { data } = await supabase.from('books').select('average_rating, ratings_count').eq('id', id).maybeSingle();
    if (data) setBook((b) => b ? { ...b, average_rating: data.average_rating, ratings_count: data.ratings_count } : b);
  };

  const submitReview = async () => {
    if (!user || !id || !reviewText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({ book_id: id, user_id: user.id, content: reviewText.trim() });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setReviewText('');
    toast.success(t('reviewSaved'));
    loadAll();
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">{t('notFound')}</p>
          <Link to="/" className="text-primary underline mt-3 inline-block">{t('backToCatalog')}</Link>
        </div>
      </Layout>
    );
  }

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
              {cover ? (
                <img src={cover} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center gradient-primary text-primary-foreground">
                  <BookOpen className="w-12 h-12 opacity-70" />
                </div>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{title}</h1>
            {authorName && <p className="mt-1 text-muted-foreground">{authorName}</p>}

            <div className="mt-3 flex items-center gap-3">
              <StarRating value={Number(book.average_rating ?? 0)} readOnly />
              <span className="text-sm text-muted-foreground">
                {Number(book.average_rating ?? 0).toFixed(1)} ({book.ratings_count ?? 0})
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              {book.book_code && <Meta label={t('bookCode')} value={book.book_code} />}
              {book.si_number != null && <Meta label={t('siNumber')} value={String(book.si_number)} />}
              {categoryName && <Meta label={t('category')} value={categoryName} />}
              {publisherName && <Meta label={t('publisher')} value={publisherName} />}
              {book.volume && <Meta label={t('volume')} value={book.volume} />}
              {book.pages != null && <Meta label={t('pages')} value={String(book.pages)} />}
            </div>

            {desc && (
              <div className="mt-5">
                <h2 className="font-semibold text-foreground mb-1.5">{t('description')}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{desc}</p>
              </div>
            )}

            {book.full_text && (
              <div className="mt-5">
                <Button variant="outline" size="sm" onClick={() => setShowFullText((v) => !v)}>
                  {t('readFullText')}
                </Button>
                {showFullText && (
                  <Card className="mt-3 p-4 max-h-[420px] overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{book.full_text}</p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-foreground mb-4">{t('reviews')}</h2>

          {user ? (
            <Card className="p-4 mb-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium mb-1.5">{t('yourRating')}</p>
                  <StarRating value={myRating} onChange={submitRating} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium mb-1.5">{t('writeReview')}</p>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  placeholder={t('writeReview')}
                />
                <Button onClick={submitReview} disabled={submitting || !reviewText.trim()} className="mt-2" size="sm">
                  {t('postReview')}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 mb-5 text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary underline">{t('login')}</Link> — {t('loginToReview')}
            </Card>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t('noReviews')}</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-sm text-foreground">
                      {r.profile?.full_name || r.profile?.username || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
                    </p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
