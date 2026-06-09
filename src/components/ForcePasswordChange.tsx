import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { ShieldAlert } from 'lucide-react';

export default function ForcePasswordChange() {
  const { changePassword } = useAuth();
  const { t } = useI18n();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { toast({ title: t('minChars'), variant: 'destructive' }); return; }
    if (pw !== pw2) { toast({ title: t('passwordMismatch'), variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await changePassword(pw);
    setLoading(false);
    if (error) toast({ title: error, variant: 'destructive' });
    else toast({ title: t('passwordChanged') });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <form onSubmit={submit} className="w-full max-w-md bg-card rounded-2xl shadow-elevated p-6 space-y-4 border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">{t('forcePwTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('forcePwDesc')}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t('newPassword')}</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
        </div>
        <div className="space-y-2">
          <Label>{t('confirmPassword')}</Label>
          <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">{t('save')}</Button>
      </form>
    </div>
  );
}
