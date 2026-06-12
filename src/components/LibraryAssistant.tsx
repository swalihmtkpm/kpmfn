import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import LogoSpinner from '@/components/LogoSpinner';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function LibraryAssistant() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-library-assistant', onOpen);
    return () => window.removeEventListener('open-library-assistant', onOpen);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: 'user' as const, content: text }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('library-assistant', { body: { messages: next } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMsgs([...next, { role: 'assistant', content: data?.reply || '—' }]);
    } catch (e: any) {
      setMsgs([...next, { role: 'assistant', content: t('aiUnavailable') + (e?.message ? `: ${e.message}` : '') }]);
    } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-5 end-5 rounded-full w-14 h-14 shadow-elevated z-40" aria-label={t('openAssistant')}>
          <Sparkles className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 font-bold"><Sparkles className="w-5 h-5 text-primary" /> {t('libraryAssistant')}</div>
          <p className="text-xs text-muted-foreground mt-1">العربية · English · മലയാളം</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.length === 0 && <p className="text-sm text-muted-foreground text-center mt-8">{t('askAnything')}</p>}
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'ms-auto bg-primary text-primary-foreground' : 'me-auto bg-muted'}`}>
              {m.content}
            </div>
          ))}
          {busy && <div className="me-auto"><LogoSpinner size={32} /></div>}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={t('askAnything')} disabled={busy} />
          <Button onClick={send} disabled={busy || !input.trim()} size="icon"><Send className="w-4 h-4" /></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
