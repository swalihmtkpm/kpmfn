import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Book, Users, FolderTree, Megaphone, Files } from 'lucide-react';

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ books: 0, categories: 0, authors: 0, ads: 0, requests: 0 });

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [b, c, a, ad, r] = await Promise.all([
        supabase.from('books').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('authors').select('id', { count: 'exact', head: true }),
        supabase.from('advertisements').select('id', { count: 'exact', head: true }),
        supabase.from('borrow_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setCounts({
        books: b.count ?? 0,
        categories: c.count ?? 0,
        authors: a.count ?? 0,
        ads: ad.count ?? 0,
        requests: r.count ?? 0,
      });
    })();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const cards = [
    { label: t('books'), value: counts.books, icon: Book },
    { label: t('categories'), value: counts.categories, icon: FolderTree },
    { label: t('authors'), value: counts.authors, icon: Users },
    { label: 'Advertisements', value: counts.ads, icon: Megaphone },
    { label: 'Pending Requests', value: counts.requests, icon: Files },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-foreground mb-1">{t('adminPanel')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('appName')}</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="bg-card border rounded-xl p-4 shadow-soft">
              <c.icon className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-extrabold text-foreground">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-xl border bg-accent/40 text-sm text-muted-foreground">
          Admin management screens (books, categories, authors, publishers, ads, borrow requests, settings, files) come next. The full database, storage buckets and access rules are in place.
        </div>
      </div>
    </Layout>
  );
}
