import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { Download, Upload, KeyRound, Globe2, BookOpen, Database, Users, Plus, Trash2, Cloud, RefreshCw, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PERMANENT_STORAGE_MIGRATION_SQL } from '@/lib/migrationSql';
import { dataService } from '@/lib/dataService';

const INFO_KEY = 'library_info';
const BACKUP_TABLES = ['categories', 'authors', 'publishers', 'books', 'advertisements', 'library_settings'] as const;

export type Helper = { name: string; phone: string };

type Info = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  about_ar?: string;
  about_en?: string;
  helpers?: Helper[];
};

export default function SettingsPanel() {
  const { t, lang, setLang } = useI18n();
  const { changePassword } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [info, setInfo] = useState<Info>({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cloudHealth, setCloudHealth] = useState<{
    ready: boolean;
    booksAccessible: boolean;
    studentsAccessible: boolean;
    settingsWritable: boolean;
    reason?: string;
  } | null>(null);

  const checkHealth = async () => {
    const h = await dataService.checkCloudHealth();
    setCloudHealth(h);
  };

  const [stats, setStats] = useState(() => ({
    books: dataService.getBooks().length,
    students: dataService.getStudents().length,
    requests: dataService.getBorrowRequests().length,
    records: dataService.getBorrowRecords().length,
    readings: dataService.getReadingRecords().length,
  }));

  const refreshStats = () => {
    setStats({
      books: dataService.getBooks().length,
      students: dataService.getStudents().length,
      requests: dataService.getBorrowRequests().length,
      records: dataService.getBorrowRecords().length,
      readings: dataService.getReadingRecords().length,
    });
  };

  useEffect(() => {
    checkHealth();
    window.addEventListener('imthiyaz_data_updated', refreshStats);
    return () => window.removeEventListener('imthiyaz_data_updated', refreshStats);
  }, []);

  const handleSyncCloud = async () => {
    setSyncing(true);
    try {
      await dataService.syncFromSupabase();
      await checkHealth();
      refreshStats();
      toast.success(lang === 'ar' ? 'تمت المزامنة السحابية بنجاح' : 'Cloud sync completed successfully.');
    } catch (e: any) {
      toast.error(e?.message || 'Sync error');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAllData = () => {
    const confirmMsg = lang === 'ar'
      ? 'تحذير: هل أنت متأكد تماماً من رغبتك في مسح كافة البيانات الحالية (الكتب، الطلاب، سجلات وطلبات الاستعارة، نقاط المتصدرين)؟ سيتم تصفير المكتبة للبدء بسجل نظيف تماماً.'
      : 'WARNING: Are you sure you want to permanently clear all current data (books, students, borrow records, borrow requests, leaderboard points)? This will reset to a clean empty library.';
    if (!window.confirm(confirmMsg)) return;

    dataService.clearAllData();
    refreshStats();
    toast.success(lang === 'ar' ? 'تم مسح كافة البيانات وتصفير المكتبة بنجاح' : 'All current data has been cleared.');
  };

  const handleCopyMigrationSql = () => {
    try {
      navigator.clipboard.writeText(PERMANENT_STORAGE_MIGRATION_SQL);
      toast.success(lang === 'ar' ? 'تم نسخ كود SQL الخاص بالمزامنة السحابية الدائمة إلى الحافظة' : 'Permanent Cloud Migration SQL copied to clipboard.');
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('library_settings').select('value').eq('key', INFO_KEY).maybeSingle();
      if (data?.value) setInfo(data.value as Info);
    })();
  }, []);

  const savePassword = async () => {
    if (pw.length < 5) return toast.error(t('minChars'));
    if (pw !== pw2) return toast.error(t('passwordMismatch'));
    setLoading(true);
    const { error } = await changePassword(pw);
    setLoading(false);
    if (error) return toast.error(error);
    setPw(''); setPw2('');
    toast.success(lang === 'ar' ? 'تم تحديث وحفظ كلمة مرور المشرف بنجاح في قاعدة البيانات الدائمة' : 'Admin password successfully updated and permanently saved in database.');
  };

  const saveInfo = async () => {
    const { error } = await supabase.from('library_settings').upsert({ key: INFO_KEY, value: info as any }, { onConflict: 'key' });
    if (error) return toast.error(error.message);
    toast.success(t('saved'));
  };

  const doBackup = async () => {
    const dump: Record<string, any> = { _meta: { created_at: new Date().toISOString(), version: 1 } };
    for (const tbl of BACKUP_TABLES) {
      const { data, error } = await supabase.from(tbl).select('*');
      if (error) return toast.error(`${tbl}: ${error.message}`);
      dump[tbl] = data ?? [];
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `imthiyaz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(t('saved'));
  };

  const doRestore = async (file: File) => {
    if (!confirm(t('confirmDelete'))) return;
    const text = await file.text();
    const data = JSON.parse(text);
    for (const tbl of BACKUP_TABLES) {
      const rows = data[tbl];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const { error } = await supabase.from(tbl).upsert(rows as any);
      if (error) toast.error(`${tbl}: ${error.message}`);
    }
    toast.success(t('saved'));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Section icon={KeyRound} title={t('changePassword')}>
        <Label className="text-xs">{t('newPassword')}</Label>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Label className="text-xs mt-2">{t('confirmPassword')}</Label>
        <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <Button onClick={savePassword} disabled={loading} className="mt-3">{t('save')}</Button>
      </Section>

      <Section icon={Globe2} title={t('language')}>
        <div className="flex gap-2">
          <Button variant={lang === 'ar' ? 'default' : 'outline'} onClick={() => setLang('ar')}>العربية</Button>
          <Button variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLang('en')}>English</Button>
        </div>
      </Section>

      <Section icon={BookOpen} title={t('libraryInfo')}>
        <Label className="text-xs">{t('name')}</Label>
        <Input value={info.name ?? ''} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
        <Label className="text-xs mt-2">{t('address')}</Label>
        <Textarea value={info.address ?? ''} onChange={(e) => setInfo({ ...info, address: e.target.value })} rows={2} />
        <Button onClick={saveInfo} className="mt-3">{t('save')}</Button>
      </Section>

      <Section icon={Users} title={t('helpers')}>
        <div className="space-y-2">
          {(info.helpers ?? []).map((h, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder={t('helperName')}
                value={h.name}
                onChange={(e) => {
                  const helpers = [...(info.helpers ?? [])];
                  helpers[i] = { ...helpers[i], name: e.target.value };
                  setInfo({ ...info, helpers });
                }}
              />
              <Input
                placeholder={t('helperPhone')}
                value={h.phone}
                onChange={(e) => {
                  const helpers = [...(info.helpers ?? [])];
                  helpers[i] = { ...helpers[i], phone: e.target.value };
                  setInfo({ ...info, helpers });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInfo({ ...info, helpers: (info.helpers ?? []).filter((_, j) => j !== i) })}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" className="gap-1.5" onClick={() => setInfo({ ...info, helpers: [...(info.helpers ?? []), { name: '', phone: '' }] })}>
            <Plus className="w-4 h-4" />{t('addHelper')}
          </Button>
          <Button onClick={saveInfo}>{t('save')}</Button>
        </div>
      </Section>


      {/* Permanent Cloud Storage Architecture Section */}
      <Section icon={Cloud} title={lang === 'ar' ? 'قاعدة البيانات السحابية الدائمة (Supabase Cloud)' : 'Permanent Cloud Database (Supabase Cloud)'} className="md:col-span-2">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{lang === 'ar' ? 'حالة التخزين السحابي الدائم:' : 'Permanent Cloud Storage Status:'}</span>
                {cloudHealth === null ? (
                  <span className="text-xs text-muted-foreground animate-pulse">{lang === 'ar' ? 'جارٍ الفحص...' : 'Checking status...'}</span>
                ) : cloudHealth.ready ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'متصل وحفظ سحابي دائم نشط' : 'Connected — Permanent Cloud Active'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'يتطلب تشغيل كود الإعداد بالسحابة' : 'Cloud Setup Migration Required'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {cloudHealth?.ready
                  ? (lang === 'ar'
                    ? 'كافة الكتب والطلاب وطلبات الاستعارة ونقاط القراءة يتم حفظها دائماً في قاعدة البيانات السحابية المركزية لجميع الأجهزة والمتصفحات.'
                    : 'All books, students, borrow records, and leaderboard points are permanently stored in the centralized cloud database across all devices.')
                  : (lang === 'ar'
                    ? 'لتفعيل الحفظ السحابي الدائم بدلاً من التخزين المؤقت، يلزم تنفيذ أمر SQL لإنشاء الجداول وإلغاء قيود الأمان (RLS) في Supabase.'
                    : 'To enable permanent cloud storage across all devices instead of local cache, the database tables and Row-Level Security policies need to be initialized in Supabase.')}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncCloud}
                disabled={syncing}
                className="gap-1.5 flex-1 sm:flex-initial h-9"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? (lang === 'ar' ? 'جارٍ المزامنة...' : 'Syncing...') : (lang === 'ar' ? 'مزامنة السحابة الآن' : 'Sync Cloud Now')}</span>
              </Button>
            </div>
          </div>

          {!cloudHealth?.ready && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{lang === 'ar' ? 'خطوة سريعة لتفعيل التخزين الدائم (1 دقيقة):' : 'One Quick Step to Unlock Permanent Cloud Storage (1 min):'}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'يقوم المشروع بالربط السحابي مع Supabase، لكن قواعد الحماية (RLS) وجداول الطلاب ونقاط القراءة تتطلب تنفيذ كود التهيئة مرة واحدة. انسخ الكود بنقرة واحدة والصقه في SQL Editor داخل Supabase (أو اطلب من Lovable تشغيلها):'
                  : 'The app connects to your cloud database, but Row-Level Security policies and tables need one-time setup. Copy the SQL script below and paste it in Supabase SQL Editor (or ask Lovable to run it):'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleCopyMigrationSql}
                  className="gap-1.5 h-8 text-xs font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'نسخ كود SQL للتهيئة الدائمة' : 'Copy Permanent Cloud SQL Script'}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkHealth}
                  className="gap-1.5 h-8 text-xs font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إعادة فحص الاتصال' : 'Re-check Connection'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Current Counts Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-lg border bg-card">
              <div className="text-base font-bold text-primary">{stats.books}</div>
              <div className="text-[11px] text-muted-foreground">{lang === 'ar' ? 'الكتب' : 'Books'}</div>
            </div>
            <div className="p-2.5 rounded-lg border bg-card">
              <div className="text-base font-bold text-primary">{stats.students}</div>
              <div className="text-[11px] text-muted-foreground">{lang === 'ar' ? 'الطلاب' : 'Students'}</div>
            </div>
            <div className="p-2.5 rounded-lg border bg-card">
              <div className="text-base font-bold text-primary">{stats.requests}</div>
              <div className="text-[11px] text-muted-foreground">{lang === 'ar' ? 'الطلبات' : 'Requests'}</div>
            </div>
            <div className="p-2.5 rounded-lg border bg-card">
              <div className="text-base font-bold text-primary">{stats.records}</div>
              <div className="text-[11px] text-muted-foreground">{lang === 'ar' ? 'السجلات' : 'Records'}</div>
            </div>
            <div className="p-2.5 rounded-lg border bg-card">
              <div className="text-base font-bold text-primary">{stats.readings}</div>
              <div className="text-[11px] text-muted-foreground">{lang === 'ar' ? 'نقاط القراءة' : 'Readings'}</div>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Database} title={t('backupRestore')} className="md:col-span-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={doBackup} variant="outline" className="gap-1.5"><Download className="w-4 h-4" />{t('backup')}</Button>
            <label className="inline-flex">
              <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) doRestore(f); e.target.value = ''; }} />
              <span className="inline-flex items-center gap-1.5 px-4 h-10 rounded-md border bg-background hover:bg-accent text-sm font-medium cursor-pointer">
                <Upload className="w-4 h-4" />{t('restore')}
              </span>
            </label>
            <Button
              variant="destructive"
              onClick={handleClearAllData}
              className="gap-1.5 ms-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تصفير كافة البيانات والبدء بسجل نظيف' : 'Clear & Reset All Data'}</span>
            </Button>
          </div>
        </div>
      </Section>

      {/* Categories Management Section */}
      <CategoriesSection />
    </div>
  );
}

function CategoriesSection() {
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState(() => dataService.getCategories?.() || []);
  const [categoryCounts, setCategoryCounts] = useState(() => dataService.getCategoryBookCounts?.() || {});

  // Add / Edit Dialog state
  const [editingCat, setEditingCat] = useState<{ id?: string; name_ar: string; name_en: string; color: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setCategories(dataService.getCategories?.() || []);
    setCategoryCounts(dataService.getCategoryBookCounts?.() || {});
  };

  const handleOpenAdd = () => {
    setEditingCat({
      name_ar: '',
      name_en: '',
      color: '#6366f1',
    });
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCat({
      id: cat.id,
      name_ar: cat.name_ar,
      name_en: cat.name_en || '',
      color: cat.color || '#6366f1',
    });
  };

  const handleSave = async () => {
    if (!editingCat) return;
    if (!editingCat.name_ar.trim()) {
      toast.error(lang === 'ar' ? 'يرجى إدخال اسم التصنيف بالعربية' : 'Please enter Arabic category name');
      return;
    }

    setSaving(true);
    try {
      if (editingCat.id) {
        await dataService.updateCategory(editingCat.id, {
          name_ar: editingCat.name_ar.trim(),
          name_en: editingCat.name_en.trim() || undefined,
          color: editingCat.color,
        });
        toast.success(lang === 'ar' ? 'تم تحديث التصنيف بنجاح' : 'Category updated successfully');
      } else {
        await dataService.addCategory({
          name_ar: editingCat.name_ar.trim(),
          name_en: editingCat.name_en.trim() || undefined,
          color: editingCat.color,
        });
        toast.success(lang === 'ar' ? 'تمت إضافة التصنيف بنجاح' : 'Category added successfully');
      }
      setEditingCat(null);
      reload();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(lang === 'ar' ? `هل أنت متأكد من حذف التصنيف "${name}"؟` : `Delete category "${name}"?`)) {
      return;
    }
    try {
      await dataService.deleteCategory(id);
      toast.success(lang === 'ar' ? 'تم حذف التصنيف' : 'Category deleted');
      reload();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete category');
    }
  };

  return (
    <Section icon={BookOpen} title={lang === 'ar' ? 'إدارة تصنيفات الكتب' : 'Manage Book Categories'} className="md:col-span-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {lang === 'ar'
              ? 'إضافة وتعديل وحذف تصنيفات الكتب وتحديد ألوانها. تظهر هذه التصنيفات في قائمة التصفح ورأس الصفحة مع عدد الكتب.'
              : 'Add, update, and delete book categories. These appear in the top header menu and catalog.'}
          </p>
          <Button size="sm" onClick={handleOpenAdd} className="gap-1.5 rounded-xl font-bold text-xs shrink-0">
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إضافة تصنيف جديد' : 'Add Category'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="p-3.5 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color || '#6366f1' }}
                  />
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm text-foreground truncate">{cat.name_ar}</div>
                    {cat.name_en && (
                      <div className="text-[11px] text-muted-foreground truncate">{cat.name_en}</div>
                    )}
                    <div className="text-[10px] text-primary font-bold mt-0.5">
                      {count} {lang === 'ar' ? 'كتب مسجلة' : 'books'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpenEdit(cat)}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(cat.id, cat.name_ar)}
                    className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Category Dialog */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {editingCat.id
                ? lang === 'ar'
                  ? 'تعديل التصنيف'
                  : 'Edit Category'
                : lang === 'ar'
                ? 'إضافة تصنيف جديد'
                : 'Add New Category'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-bold">{lang === 'ar' ? 'اسم التصنيف (عربي) *' : 'Name (Arabic) *'}</Label>
                <Input
                  value={editingCat.name_ar}
                  onChange={(e) => setEditingCat({ ...editingCat, name_ar: e.target.value })}
                  placeholder="مثال: الحديث الشريف وعلومه"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">{lang === 'ar' ? 'اسم التصنيف (إنجليزي)' : 'Name (English)'}</Label>
                <Input
                  value={editingCat.name_en}
                  onChange={(e) => setEditingCat({ ...editingCat, name_en: e.target.value })}
                  placeholder="e.g. Hadith Sciences"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">{lang === 'ar' ? 'لون التصنيف' : 'Category Color'}</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={editingCat.color}
                    onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-border cursor-pointer"
                  />
                  <Input
                    value={editingCat.color}
                    onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })}
                    className="font-mono text-xs rounded-xl w-32"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCat(null)}
                className="rounded-xl text-xs"
              >
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl text-xs font-bold"
              >
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

function Section({ icon: Icon, title, children, className = '' }: { icon: any; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border rounded-xl bg-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}
