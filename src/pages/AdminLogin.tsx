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

// Username maps to an internal email so Supabase auth (email/password) can handle it.
const ADMIN_EMAIL_DOMAIN = 'imthiyaz.admin.local';
const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;

export default function AdminLogin() {
  const { t } = useI18n();
  const { refreshProfile, isAdmin } = useAuth();
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

    // Try sign-in first
    let { error } = await supabase.auth.signInWithPassword({ email, password });

    // If user does not exist yet, bootstrap by signing up (trigger assigns admin role for msoekutb)
    if (error && /invalid login credentials/i.test(error.message)) {
      const { error: suErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username.trim().toLowerCase(), full_name: 'Administrator' } },
      });
      if (suErr) {
        toast({ title: suErr.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      // Sign in after sign-up (auto-confirm is enabled)
      const retry = await supabase.auth.signInWithPassword({ email, password });
      error = retry.error;
    }

    setLoading(false);

    if (error) {
      toast({ title: t('invalidCreds'), description: error.message, variant: 'destructive' });
      return;
    }
    await refreshProfile();
    navigate('/admin', { replace: true });
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
