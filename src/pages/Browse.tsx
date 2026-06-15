import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, BookOpen } from 'lucide-react';
import { FullPageLoader } from '@/components/LogoSpinner';

type Cat = { id: string; name_ar: string; name_en: string | null };

export default function Browse() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: b }] = await Promise.all([
        supabase.from('categories').select('id, name_ar, name_en').order('sort_order'),
        supabase.from('books').select('category_id'),
      ]);
      setCats((c ?? []) as Cat[]);
      const m = new Map<string, number>();
      (b ?? []).forEach((row: any) => { if (row.category_id) m.set(row.category_id, (m.get(row.category_id) ?? 0) + 1); });
      setCounts(m);
      setTotal((b ?? []).length);
    })();
  }, []);

  const items = useMemo(() => (cats ?? []).map((c) => ({
    id: c.id,
    name: (lang === 'ar' ? c.name_ar : (c.name_en || c.name_ar)),
    count: counts.get(c.id) ?? 0,
  })), [cats, counts, lang]);

  if (!cats) return <Layout><FullPageLoader /></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            {t('browseCategories')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('totalBooks')}: <span className="font-bold text-foreground">{total}</span></p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-4 rounded-xl border bg-card hover:bg-accent text-start transition shadow-soft"
          >
            <BookOpen className="w-5 h-5 mb-2 text-primary" />
            <div className="font-semibold text-sm truncate">{t('all')}</div>
            <div className="text-xs text-muted-foreground mt-1">{total} {t('books')}</div>
          </button>
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/?category=${c.id}`)}
              className="p-4 rounded-xl border bg-card hover:bg-accent text-start transition shadow-soft"
            >
              <FolderOpen className="w-5 h-5 mb-2 text-primary" />
              <div className="font-semibold text-sm truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.count} {t('books')}</div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
