import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import LogoSpinner from '@/components/LogoSpinner';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function BookAssistant({ bookId }: { bookId: string }) {
  const { t } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: 'user' as const, content: text }];
    setMsgs(next); setInput(''); setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('book-assistant', { body: { book_id: bookId, messages: next } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMsgs([...next, { role: 'assistant', content: data?.reply || '—' }]);
    } catch (e: any) {
      setMsgs([...next, { role: 'assistant', content: t('aiUnavailable') + (e?.message ? `: ${e.message}` : '') }]);
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 font-bold mb-3"><BookOpen className="w-5 h-5 text-primary" /> {t('bookAssistant')}</div>
      <div className="max-h-72 overflow-y-auto space-y-2 mb-3">
        {msgs.length === 0 && <p className="text-xs text-muted-foreground">{t('askAnything')}</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'ms-auto bg-primary text-primary-foreground' : 'me-auto bg-muted'}`}>
            {m.content}
          </div>
        ))}
        {busy && <div className="me-auto"><LogoSpinner size={28} /></div>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={t('askAnything')} disabled={busy} />
        <Button onClick={send} disabled={busy || !input.trim()} size="icon"><Send className="w-4 h-4" /></Button>
      </div>
    </Card>
  );
}
