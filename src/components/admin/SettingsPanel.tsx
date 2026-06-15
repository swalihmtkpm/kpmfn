import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { Download, Upload, KeyRound, Globe2, BookOpen, Database } from 'lucide-react';

const INFO_KEY = 'library_info';
const BACKUP_TABLES = ['categories', 'authors', 'publishers', 'books', 'advertisements', 'library_settings'] as const;

type Info = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  about_ar?: string;
  about_en?: string;
};

export default function SettingsPanel() {
  const { t, lang, setLang } = useI18n();
  const { changePassword } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [info, setInfo] = useState<Info>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('library_settings').select('value').eq('key', INFO_KEY).maybeSingle();
      if (data?.value) setInfo(data.value as Info);
    })();
  }, []);

  const savePassword = async () => {
    if (pw.length < 6) return toast.error(t('minChars'));
    if (pw !== pw2) return toast.error(t('passwordMismatch'));
    setLoading(true);
    const { error } = await changePassword(pw);
    setLoading(false);
    if (error) return toast.error(error);
    setPw(''); setPw2('');
    toast.success(t('passwordChanged'));
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


      <Section icon={Database} title={t('backupRestore')} className="md:col-span-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={doBackup} variant="outline" className="gap-1.5"><Download className="w-4 h-4" />{t('backup')}</Button>
          <label className="inline-flex">
            <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) doRestore(f); e.target.value = ''; }} />
            <span className="inline-flex items-center gap-1.5 px-4 h-10 rounded-md border bg-background hover:bg-accent text-sm font-medium cursor-pointer">
              <Upload className="w-4 h-4" />{t('restore')}
            </span>
          </label>
        </div>
      </Section>
    </div>
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
