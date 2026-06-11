import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Search, X } from 'lucide-react';

type Props = { bookId: string; title: string; text: string; open: boolean; onClose: () => void };

const PAGE_SIZE = 2500; // characters per page

export default function BookReader({ bookId, title, text, open, onClose }: Props) {
  const { t } = useI18n();
  const storageKey = `imthiyaz_reader_${bookId}`;
  const pages = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < text.length; i += PAGE_SIZE) out.push(text.substring(i, i + PAGE_SIZE));
    return out.length ? out : [''];
  }, [text]);

  const [page, setPage] = useState(() => {
    const saved = parseInt(localStorage.getItem(storageKey) || '0', 10);
    return isNaN(saved) ? 0 : Math.min(saved, pages.length - 1);
  });
  const [query, setQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) localStorage.setItem(storageKey, String(page)); }, [page, open, storageKey]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [page]);

  const highlighted = useMemo(() => {
    if (!query.trim()) return pages[page];
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return pages[page].split(re).map((part, i) =>
      i % 2 === 1 ? `__MARK__${part}__/MARK__` : part
    ).join('');
  }, [pages, page, query]);

  // search across whole text to jump
  const jumpToMatch = () => {
    if (!query.trim()) return;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return;
    setPage(Math.floor(idx / PAGE_SIZE));
  };

  const progress = Math.round(((page + 1) / pages.length) * 100);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl h-[88vh] p-0 flex flex-col gap-0">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{title}</p>
            <p className="text-[11px] text-muted-foreground">{t('progress')}: {progress}% · {t('page')} {page + 1} / {pages.length}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="px-4 py-2 border-b flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && jumpToMatch()}
              placeholder={t('searchInBook')}
              className="ps-8 h-9"
            />
          </div>
          <Button size="sm" variant="outline" onClick={jumpToMatch}>{t('send')}</Button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap leading-loose text-base">
            {highlighted.split(/(__MARK__|__\/MARK__)/).reduce<JSX.Element[]>((acc, chunk, i, arr) => {
              if (chunk === '__MARK__') {
                acc.push(<mark key={i} className="bg-primary/30 rounded px-0.5">{arr[i + 1]}</mark>);
                arr[i + 1] = '__/MARK__';
              } else if (chunk !== '__/MARK__') {
                acc.push(<span key={i}>{chunk}</span>);
              }
              return acc;
            }, [])}
          </p>
        </div>
        <div className="px-4 py-3 border-t flex justify-between items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>{t('previous')}</Button>
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))} disabled={page >= pages.length - 1}>{t('next')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
