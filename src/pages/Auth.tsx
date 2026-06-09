import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) toast({ title: t('invalidCreds'), description: error, variant: 'destructive' });
      else navigate('/');
    } else if (mode === 'signup') {
      const { error } = await signUp(email, password, username || email.split('@')[0], fullName);
      if (error) toast({ title: error, variant: 'destructive' });
      else { toast({ title: t('welcome') }); navigate('/'); }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast({ title: error.message, variant: 'destructive' });
      else { toast({ title: t('resetSent') }); setMode('login'); }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex gradient-hero text-primary-foreground p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center backdrop-blur">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="font-extrabold text-xl">{t('appName')}</div>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">{t('tagline')}</h2>
          <p className="mt-3 opacity-80 max-w-md">{t('appName')}</p>
        </div>
        <div className="text-xs opacity-60">© {new Date().getFullYear()}</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-foreground">
              {mode === 'login' ? t('login') : mode === 'signup' ? t('signup') : t('forgot')}
            </h1>
          </div>

          {mode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <Label>{t('fullName')}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('username')}</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>{t('email')}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <Label>{t('password')}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">{t('submit')}</Button>

          <div className="text-center text-sm space-y-2">
            {mode === 'login' && (
              <>
                <button type="button" onClick={() => setMode('forgot')} className="text-primary hover:underline">{t('forgot')}</button>
                <div className="text-muted-foreground">
                  {t('needAccount')}{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-primary font-semibold hover:underline">{t('signup')}</button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <div className="text-muted-foreground">
                {t('haveAccount')}{' '}
                <button type="button" onClick={() => setMode('login')} className="text-primary font-semibold hover:underline">{t('login')}</button>
              </div>
            )}
            {mode === 'forgot' && (
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">{t('login')}</button>
            )}
            <div>
              <Link to="/" className="text-xs text-muted-foreground hover:underline">{t('backToHome')}</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
