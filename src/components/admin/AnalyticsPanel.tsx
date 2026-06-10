import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book, Users, Building2, MessageSquare, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useI18n } from '@/lib/i18n';
import { FullPageLoader } from '@/components/LogoSpinner';

type Counts = { books: number; authors: number; publishers: number; reviews: number; ratings: number };
type Point = { day: string; borrows: number };

export default function AnalyticsPanel() {
  const { t } = useI18n();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [series, setSeries] = useState<Point[]>([]);

  useEffect(() => {
    (async () => {
      const [b, a, p, rv, rt, br] = await Promise.all([
        supabase.from('books').select('id', { count: 'exact', head: true }),
        supabase.from('authors').select('id', { count: 'exact', head: true }),
        supabase.from('publishers').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('ratings').select('id', { count: 'exact', head: true }),
        supabase.from('borrow_records').select('borrowed_at').gte('borrowed_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);
      setCounts({
        books: b.count ?? 0, authors: a.count ?? 0, publishers: p.count ?? 0,
        reviews: rv.count ?? 0, ratings: rt.count ?? 0,
      });
      const buckets = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(5, 10);
        buckets.set(d, 0);
      }
      for (const r of (br.data ?? []) as any[]) {
        const d = String(r.borrowed_at).slice(5, 10);
        if (buckets.has(d)) buckets.set(d, (buckets.get(d) || 0) + 1);
      }
      setSeries(Array.from(buckets, ([day, borrows]) => ({ day, borrows })));
    })();
  }, []);

  if (!counts) return <FullPageLoader />;

  const cards = [
    { label: t('totalBooks'), value: counts.books, icon: Book },
    { label: t('totalAuthors'), value: counts.authors, icon: Users },
    { label: t('totalPublishers'), value: counts.publishers, icon: Building2 },
    { label: t('totalReviews'), value: counts.reviews, icon: MessageSquare },
    { label: t('totalRatings'), value: counts.ratings, icon: Star },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border rounded-xl p-4 shadow-soft">
            <c.icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-extrabold text-foreground">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border rounded-xl p-4">
        <h3 className="font-semibold text-foreground mb-3">{t('borrowActivity')}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="borrows" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
