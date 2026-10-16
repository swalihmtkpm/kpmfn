import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { CheckCircle2, RotateCcw, Calendar, BookOpen, Trash2 } from 'lucide-react';
import { dataService, BorrowRecord } from '@/lib/dataService';

export default function BorrowRecordsManager() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<BorrowRecord[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = () => {
    const list = dataService.getBorrowRecords();
    setRows(list);
    setSelectedIds([]);
  };

  useEffect(() => {
    load();
  }, []);

  const updateDue = (id: string) => {
    const v = editing[id];
    if (!v) return;
    dataService.updateRecordDueDate(id, new Date(v).toISOString());
    toast.success(t('saved'));
    setEditing((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
    load();
  };

  const markReturned = (r: BorrowRecord) => {
    dataService.markRecordReturned(r.id);
    toast.success(lang === 'ar' ? 'تم تسجيل إرجاع الكتاب بنجاح' : 'Book marked as returned');
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
    if (!confirm(`${t('confirmDelete')} (${selectedIds.length} ${t('borrowRecords')})`)) return;
    try {
      await dataService.bulkDeleteBorrowRecords(selectedIds);
      toast.success(
        lang === 'ar'
          ? `تم حذف ${selectedIds.length} سجلات بنجاح`
          : `Deleted ${selectedIds.length} records successfully`
      );
      setSelectedIds([]);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete records');
    }
  };

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleSelectAll}
            className="text-xs rounded-xl text-muted-foreground hover:text-foreground"
          >
            {selectedIds.length === rows.length ? (lang === 'ar' ? 'إلغاء التحديد' : 'Deselect All') : t('selectAll')}
          </Button>

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
      )}

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
                    <p className="font-bold text-base text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span>{r.book_title}</span>
                    </p>
                    <p><b>{t('yourName')}:</b> {r.borrower_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      <b>{lang === 'ar' ? 'تاريخ الاستعارة:' : 'Borrowed:'}</b> {new Date(r.borrowed_at).toLocaleDateString()}
                    </p>
                    <p>
                      <b>{t('returnDate')}:</b> {r.due_at ? new Date(r.due_at).toLocaleDateString() : '—'}
                    </p>
                    {r.returned_at && (
                      <p className="text-emerald-600 font-semibold text-xs flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تم الإرجاع في:' : 'Returned on:'} {new Date(r.returned_at).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {r.status === 'returned' || r.returned_at ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 bg-emerald-500/10 gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تم الإرجاع' : 'Returned'}</span>
                    </Badge>
                  ) : (
                    <>
                      <div className="flex items-end gap-2">
                        <div>
                          <Label className="text-[10px]">{t('returnDate')}</Label>
                          <Input
                            type="date"
                            className="h-8 w-40 text-xs"
                            value={editing[r.id] ?? (r.due_at ? r.due_at.substring(0, 10) : '')}
                            onChange={(e) => setEditing((s) => ({ ...s, [r.id]: e.target.value }))}
                          />
                        </div>
                        <Button size="sm" variant="outline" onClick={() => updateDue(r.id)}>{t('save')}</Button>
                      </div>
                      <Button size="sm" onClick={() => markReturned(r)} className="gap-1 bg-primary text-primary-foreground">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('markReturned')}</span>
                      </Button>
                    </>
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
