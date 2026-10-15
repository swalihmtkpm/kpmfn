import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, BookOpen, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { FullPageLoader } from '@/components/LogoSpinner';

type Cat = { id: string; name_ar: string; name_en: string | null };

export default function Browse() {
  const { t, lang, dir } = useI18n();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
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

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('appNameShort')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5 tracking-tight">
            <FolderOpen className="w-7 h-7 text-primary" />
            <span>{t('browseCategories')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t('totalBooks')}: <span className="font-bold text-foreground">{total}</span>
          </p>
        </header>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: shouldReduceMotion ? 0 : 0.03,
              },
            },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
        >
          {/* All Books Card */}
          <motion.button
            variants={{
              hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
              show: { opacity: 1, y: 0 },
            }}
            onClick={() => navigate('/')}
            className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:bg-primary/[0.04] hover:border-primary/40 text-start transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                {t('all')}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{total} {t('books')}</span>
              <ArrowIcon className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.button>

          {/* Individual Category Cards */}
          {items.map((c) => (
            <motion.button
              key={c.id}
              variants={{
                hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
                show: { opacity: 1, y: 0 },
              }}
              onClick={() => navigate(`/?category=${c.id}#catalog`)}
              className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:bg-primary/[0.04] hover:border-primary/40 text-start transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                  {c.name}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{c.count} {t('books')}</span>
                <ArrowIcon className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
}
