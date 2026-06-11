import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

type Rec = {
  id: string; book_id: string; borrowed_at: string; due_at: string | null; returned_at: string | null;
  borrower_name: string | null;
  books?: { title_ar: string; book_code: string | null } | null;
};

export default function BorrowRecordsManager() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Rec[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from('borrow_records').select('*, books(title_ar, book_code)').order('borrowed_at', { ascending: false });
    setRows((data ?? []) as any);
  };
  useEffect(() => { load(); }, []);

  const updateDue = async (id: string) => {
    const v = editing[id];
    if (!v) return;
    const { error } = await supabase.from('borrow_records').update({ due_at: new Date(v).toISOString() }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(t('saved'));
    setEditing((e) => { const n = { ...e }; delete n[id]; return n; });
    load();
  };

  const markReturned = async (r: Rec) => {
    const { error } = await supabase.from('borrow_records').update({ returned_at: new Date().toISOString() }).eq('id', r.id);
    if (error) return toast.error(error.message);
    await supabase.from('books').update({ status: 'available' }).eq('id', r.book_id);
    toast.success(t('saved'));
    load();
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">—</p>}
      {rows.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1 text-sm">
              <p className="font-bold">{r.books?.title_ar} <span className="text-xs text-muted-foreground">{r.books?.book_code}</span></p>
              <p><b>{t('yourName')}:</b> {r.borrower_name || '—'}</p>
              <p><b>{t('returnDate')}:</b> {r.due_at ? new Date(r.due_at).toLocaleDateString() : '—'}</p>
              {r.returned_at && <p className="text-emerald-600"><b>↩</b> {new Date(r.returned_at).toLocaleDateString()}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              {r.returned_at ? <Badge>↩ {t('save')}</Badge> : (
                <>
                  <div className="flex items-end gap-2">
                    <div>
                      <Label className="text-[10px]">{t('returnDate')}</Label>
                      <Input type="date" className="h-8 w-40"
                        value={editing[r.id] ?? (r.due_at ? r.due_at.substring(0, 10) : '')}
                        onChange={(e) => setEditing((s) => ({ ...s, [r.id]: e.target.value }))} />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => updateDue(r.id)}>{t('save')}</Button>
                  </div>
                  <Button size="sm" onClick={() => markReturned(r)}>{t('markReturned')}</Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
