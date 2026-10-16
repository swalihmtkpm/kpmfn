import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { CheckCircle2, RotateCcw, Calendar, BookOpen } from 'lucide-react';
import { dataService, BorrowRecord } from '@/lib/dataService';

export default function BorrowRecordsManager() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<BorrowRecord[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = () => {
    const list = dataService.getBorrowRecords();
    setRows(list);
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

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">—</p>}
      {rows.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
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
      ))}
    </div>
  );
}
