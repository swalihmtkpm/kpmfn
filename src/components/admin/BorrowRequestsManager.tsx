import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Check, X } from 'lucide-react';

type Req = {
  id: string; book_id: string; status: string; requester_type: string | null;
  requester_name: string | null; requester_class: string | null; requester_phone: string | null;
  requester_place: string | null; requester_address: string | null;
  days_requested: number | null; expected_return_date: string | null;
  notes: string | null; created_at: string;
  books?: { title_ar: string; book_code: string | null } | null;
};

export default function BorrowRequestsManager() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Req[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const load = async () => {
    let q = supabase.from('borrow_requests').select('*, books(title_ar, book_code)').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRows((data ?? []) as any);
  };
  useEffect(() => { load(); }, [filter]);

  const decide = async (r: Req, action: 'approved' | 'rejected') => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('borrow_requests').update({
      status: action, decided_by: u.user?.id ?? null, decided_at: new Date().toISOString(),
    }).eq('id', r.id);
    if (error) return toast.error(error.message);

    if (action === 'approved') {
      await supabase.from('borrow_records').insert({
        request_id: r.id, book_id: r.book_id, record_type: 'physical',
        borrower_name: r.requester_name, due_at: r.expected_return_date ? new Date(r.expected_return_date).toISOString() : null,
      });
      await supabase.from('books').update({ status: 'borrowed' }).eq('id', r.book_id);
    }
    toast.success(t('saved'));
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>{t(f as any)}</Button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">—</p>}
        {rows.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1 text-sm">
                <p className="font-bold">{r.books?.title_ar} <span className="text-xs text-muted-foreground">{r.books?.book_code}</span></p>
                <p><b>{t('yourName')}:</b> {r.requester_name} <span className="text-xs text-muted-foreground">({r.requester_type})</span></p>
                {r.requester_class && <p><b>{t('class')}:</b> {r.requester_class}</p>}
                {r.requester_phone && <p><b>{t('phone')}:</b> {r.requester_phone}</p>}
                {r.requester_place && <p><b>{t('place')}:</b> {r.requester_place}</p>}
                {r.requester_address && <p><b>{t('address')}:</b> {r.requester_address}</p>}
                <p><b>{t('days')}:</b> {r.days_requested} · <b>{t('expectedReturn')}:</b> {r.expected_return_date}</p>
                {r.notes && <p className="text-muted-foreground">{r.notes}</p>}
                <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>{t(r.status as any)}</Badge>
                {r.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => decide(r, 'approved')} className="gap-1"><Check className="w-3.5 h-3.5" />{t('approve')}</Button>
                    <Button size="sm" variant="destructive" onClick={() => decide(r, 'rejected')} className="gap-1"><X className="w-3.5 h-3.5" />{t('reject')}</Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
