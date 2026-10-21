import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { hashPassword, verifyPassword } from '@/lib/authCrypto';

// Username maps to an internal email so Supabase auth (email/password) can handle it.
const ADMIN_EMAIL_DOMAIN = 'imthiyaz.admin.local';
const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
const MASTER_ADMIN_KEY = '159357123';

export default function AdminLogin() {
  const { t, lang } = useI18n();
  const { refreshProfile, isAdmin, setAdminSession } = useAuth();
  const navigate = useNavigate();
  // Already signed in as admin? Go straight to the dashboard.
  useEffect(() => { if (isAdmin) navigate('/admin', { replace: true }); }, [isAdmin, navigate]);
  const [username, setUsername] = useState('msoekutb');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = usernameToEmail(username);
    const trimmedPw = password.trim();

    // 1. Fetch custom admin password configuration from permanent cloud database
    let customPwHash: string | null = null;
    try {
      const { data: secRow } = await supabase
        .from('library_settings')
        .select('value')
        .eq('key', 'admin_security_config')
        .maybeSingle();
      if (secRow?.value && (secRow.value as any).password_hash) {
        customPwHash = (secRow.value as any).password_hash;
        if (typeof window !== 'undefined') {
          localStorage.setItem('imthiyaz_admin_pw_hash', customPwHash!);
        }
      }
    } catch {
      if (typeof window !== 'undefined') {
        customPwHash = localStorage.getItem('imthiyaz_admin_pw_hash');
      }
    }

    if (!customPwHash && typeof window !== 'undefined') {
      customPwHash = localStorage.getItem('imthiyaz_admin_pw_hash');
    }

    // Check if custom password matches
    let isCustomPasswordValid = false;
    if (customPwHash) {
      isCustomPasswordValid = await verifyPassword(trimmedPw, customPwHash);
    }

    // Check if master recovery key matches
    const isMasterKeyValid = trimmedPw === MASTER_ADMIN_KEY;

    // 2. Attempt official Supabase Auth sign-in
    let hasSupabaseSession = false;
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password: trimmedPw });
      if (!error && authData?.session) {
        hasSupabaseSession = true;
      }
    } catch {}

    // 3. If any credential check succeeds, log in successfully!
    if (isCustomPasswordValid || isMasterKeyValid || hasSupabaseSession) {
      setAdminSession(true);
      if (hasSupabaseSession) {
        await refreshProfile().catch(() => {});
      }
      setLoading(false);
      navigate('/admin', { replace: true });
      return;
    }

    setLoading(false);
    toast({
      title: t('invalidCreds'),
      description: lang === 'ar' ? 'كلمة المرور أو اسم المستخدم غير صحيح' : 'Invalid username or password',
      variant: 'destructive',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <form onSubmit={handle} className="w-full max-w-sm bg-card rounded-2xl shadow-elevated p-6 space-y-4 border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">{t('adminLogin')}</h1>
            <p className="text-xs text-muted-foreground">{t('appName')}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t('username')}</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
        </div>
        <div className="space-y-1.5">
          <Label>{t('password')}</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={5} autoComplete="current-password" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">{t('login')}</Button>
      </form>
    </div>
  );
}
