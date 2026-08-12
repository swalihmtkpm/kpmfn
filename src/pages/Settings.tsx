import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Globe, Moon, Sun, FileText, HelpCircle, MessageCircle, Phone, Mail, Info as InfoIcon, MapPin, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

const CONTACT_PHONE = '9037339492';
const CONTACT_EMAIL = 'mswalihkpm@gmail.com';

type Helper = { name?: string; phone?: string };
type Info = { name?: string; address?: string; about_ar?: string; about_en?: string; helpers?: Helper[] };

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const [info, setInfo] = useState<Info>({});
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (typeof window !== 'undefined' && localStorage.getItem('imthiyaz_theme') === 'dark') ? 'dark' : 'light'
  );
  const [dialog, setDialog] = useState<null | 'tnc' | 'faq' | 'contact' | 'about'>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('library_settings').select('value').eq('key', 'library_info').maybeSingle();
      if (data?.value) setInfo(data.value as Info);
    })();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('imthiyaz_theme', theme);
  }, [theme]);

  const about = (lang === 'ar' ? info.about_ar : info.about_en) || '';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <header>
          <h1 className="text-2xl font-extrabold text-foreground">{t('settingsHeader')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('appName')}</p>
        </header>

        <section className="border rounded-xl bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{t('theme')}</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="gap-1.5">
              <Sun className="w-4 h-4" /> {t('light')}
            </Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="gap-1.5">
              <Moon className="w-4 h-4" /> {t('dark')}
            </Button>
          </div>
        </section>

        <section className="border rounded-xl bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{t('chooseLanguage')}</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={lang === 'ar' ? 'default' : 'outline'} onClick={() => setLang('ar')} className="gap-1.5">
              <Globe className="w-4 h-4" /> {t('arabic')}
            </Button>
            <Button variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLang('en')} className="gap-1.5">
              <Globe className="w-4 h-4" /> {t('english')}
            </Button>
          </div>
        </section>

        <section className="border rounded-xl bg-card p-2">
          <div className="grid gap-1">
            {(info.name || about) && (
              <Button variant="ghost" className="justify-start gap-2 h-12" onClick={() => setDialog('about')}>
                <InfoIcon className="w-4 h-4 text-primary" /> {t('about')}
              </Button>
            )}
            <Separator />
            <Button variant="ghost" className="justify-start gap-2 h-12" onClick={() => setDialog('tnc')}>
              <FileText className="w-4 h-4 text-primary" /> {t('tnc')}
            </Button>
            <Separator />
            <Button variant="ghost" className="justify-start gap-2 h-12" onClick={() => setDialog('faq')}>
              <HelpCircle className="w-4 h-4 text-primary" /> {t('faq')}
            </Button>
            <Separator />
            <Button variant="ghost" className="justify-start gap-2 h-12" onClick={() => setDialog('contact')}>
              <MessageCircle className="w-4 h-4 text-primary" /> {t('contactUs')}
            </Button>
          </div>
        </section>

        <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialog === 'tnc' && t('tnc')}
                {dialog === 'faq' && t('faq')}
                {dialog === 'contact' && t('contactUs')}
                {dialog === 'about' && t('about')}
              </DialogTitle>
            </DialogHeader>
            {dialog === 'tnc' && <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{t('tncBody')}</p>}
            {dialog === 'faq' && <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{t('faqBody')}</p>}
            {dialog === 'about' && (
              <div className="space-y-2">
                {info.name && <p className="text-base font-semibold text-foreground">{info.name}</p>}
                {about && <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{about}</p>}
              </div>
            )}
            {dialog === 'contact' && (
              <div className="space-y-2 text-sm">
                <a href={`tel:${CONTACT_PHONE}`} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent">
                  <Phone className="w-4 h-4 text-primary" /> <span className="font-medium">{CONTACT_PHONE}</span>
                </a>
                <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent break-all">
                  <Mail className="w-4 h-4 text-primary" /> <span className="font-medium">{CONTACT_EMAIL}</span>
                </a>
                {info.address && (
                  <div className="flex items-start gap-2 p-3 rounded-lg border">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" /> <span>{info.address}</span>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
