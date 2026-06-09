import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // When user lands from email recovery, Supabase sets a session via the hash fragment.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { toast({ title: t('minChars'), variant: 'destructive' }); return; }
    if (pw !== pw2) { toast({ title: t('passwordMismatch'), variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) toast({ title: error.message, variant: 'destructive' });
    else { toast({ title: t('passwordChanged') }); navigate('/'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-2xl shadow-elevated p-6 space-y-4 border">
        <h1 className="font-bold text-lg text-foreground">{t('newPassword')}</h1>
        <div className="space-y-1.5">
          <Label>{t('newPassword')}</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} disabled={!ready} required minLength={6} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('confirmPassword')}</Label>
          <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} disabled={!ready} required minLength={6} />
        </div>
        <Button type="submit" disabled={loading || !ready} className="w-full">{t('save')}</Button>
      </form>
    </div>
  );
}
