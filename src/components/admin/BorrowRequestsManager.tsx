import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Check, X, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { dataService, BorrowRequest } from '@/lib/dataService';

export default function BorrowRequestsManager() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<BorrowRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(() => {
    const list = dataService.getBorrowRequests();
    if (filter === 'all') {
      setRows(list);
    } else {
      setRows(list.filter((r) => r.status === filter));
    }
    setSelectedIds([]);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = (r: BorrowRequest, action: 'approved' | 'rejected') => {
    dataService.updateBorrowRequestStatus(r.id, action);
    toast.success(action === 'approved' ? (lang === 'ar' ? 'تمت الموافقة على الطلب بنجاح' : 'Request approved') : (lang === 'ar' ? 'تم رفض الطلب' : 'Request rejected'));
    load();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length && rows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`${t('confirmDelete')} (${selectedIds.length} ${t('borrowRequests')})`)) return;
    try {
      await dataService.bulkDeleteBorrowRequests(selectedIds);
      toast.success(
        lang === 'ar'
          ? `تم حذف ${selectedIds.length} طلبات بنجاح`
          : `Deleted ${selectedIds.length} requests successfully`
      );
      setSelectedIds([]);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete requests');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap items-center">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="rounded-xl text-xs"
            >
              {t(f as any)}
            </Button>
          ))}

          {rows.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleSelectAll}
              className="text-xs rounded-xl text-muted-foreground hover:text-foreground"
            >
              {selectedIds.length === rows.length ? (lang === 'ar' ? 'إلغاء التحديد' : 'Deselect All') : t('selectAll')}
            </Button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            className="gap-1.5 rounded-xl text-xs font-bold animate-in fade-in"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('deleteSelected')} ({selectedIds.length})</span>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">—</p>}
        {rows.map((r) => {
          const isSelected = selectedIds.includes(r.id);
          return (
            <Card
              key={r.id}
              className={`p-4 rounded-2xl border transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOne(r.id)}
                    className="w-4 h-4 mt-1 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <div className="space-y-1 text-sm">
                    <p className="font-bold text-base text-foreground">{r.book_title}</p>
                    <p>
                      <b>{t('yourName')}:</b> {r.requester_name}
                      {r.requester_spr_id && (
                        <span className="text-xs font-mono font-bold text-primary ms-1">
                          ({r.requester_spr_id})
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ms-1">({r.requester_type})</span>
                    </p>
                    {r.requester_class && <p><b>{t('class')}:</b> {r.requester_class}</p>}
                    {r.requester_phone && <p><b>{t('phone')}:</b> {r.requester_phone}</p>}
                    {r.requester_place && <p><b>{t('place')}:</b> {r.requester_place}</p>}
                    {r.requester_address && <p><b>{t('address')}:</b> {r.requester_address}</p>}
                    <p><b>{t('days')}:</b> {r.days_requested} · <b>{t('expectedReturn')}:</b> {r.expected_return_date}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {t(r.status as any)}
                  </Badge>
                  {r.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => decide(r, 'approved')} className="gap-1 rounded-xl text-xs">
                        <Check className="w-3.5 h-3.5" />
                        {t('approve')}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => decide(r, 'rejected')} className="gap-1 rounded-xl text-xs">
                        <X className="w-3.5 h-3.5" />
                        {t('reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
