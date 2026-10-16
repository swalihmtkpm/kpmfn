import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  dataService,
  OverdueRecord,
  ReadingStatus,
  Book,
  LeaderboardSettings,
} from '@/lib/dataService';
import {
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  Search,
  Award,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function OverdueManager() {
  const { t, isRTL } = useLanguage();

  const [overdueRecords, setOverdueRecords] = useState<OverdueRecord[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<LeaderboardSettings>({
    is_hidden_from_public: false,
    points_per_10_pages: 4,
    last_updated: new Date().toISOString(),
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Return dialog state
  const [selectedRecord, setSelectedRecord] = useState<OverdueRecord | null>(null);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('full_read');
  const [customPages, setCustomPages] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setOverdueRecords(dataService.getOverdueRecords());
    setBooks(dataService.getBooks());
    setSettings(dataService.getLeaderboardSettings());
  };

  const handleOpenReturn = (record: OverdueRecord) => {
    setSelectedRecord(record);
    const book = books.find((b) => b.id === record.book_id);
    const defaultPages = book?.pages || 50;
    setReadingStatus('full_read');
    setCustomPages(defaultPages);
    setReturnNotes('');
  };

  const calculatedPointsPreview = () => {
    if (!selectedRecord) return 0;
    const book = books.find((b) => b.id === selectedRecord.book_id);
    const totalBookPages = book?.pages || 50;

    if (readingStatus === 'not_read') return 0;
    if (readingStatus === 'full_read') {
      return Math.max(1, Math.round((totalBookPages / 10) * settings.points_per_10_pages));
    }
    const p = Math.max(0, customPages);
    return Math.max(1, Math.round((p / 10) * settings.points_per_10_pages));
  };

  const handleConfirmReturn = async () => {
    if (!selectedRecord) return;
    setProcessing(true);

    try {
      await dataService.returnOverdueBook(
        selectedRecord.id,
        readingStatus,
        readingStatus === 'custom_pages' ? customPages : undefined,
        returnNotes.trim() || undefined
      );

      const pts = calculatedPointsPreview();
      toast.success(
        isRTL
          ? `تم تأكيد إرجاع الكتاب ورصد ${pts} نقطة بنجاح`
          : `Book returned and ${pts} points recorded successfully`
      );

      setSelectedRecord(null);
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to return book');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = overdueRecords.filter((rec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.student_name.toLowerCase().includes(q) ||
      rec.book_title.toLowerCase().includes(q) ||
      (rec.student_spr_id && rec.student_spr_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-amiri">
              {isRTL ? 'إدارة الكتب المتأخرة عن موعد الإرجاع' : 'Overdue Books Management'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? 'متابعة الطلاب والمستعيرين المتأخرين عن تاريخ الإرجاع المحدد مع إمكانية استلام الكتاب ورصد النقاط.'
                : 'Track borrowers past their due return dates and process book returns with reading points.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-card border border-border text-center">
            <div className="text-[11px] text-muted-foreground">{isRTL ? 'الكتب المتأخرة' : 'Overdue Count'}</div>
            <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
              {overdueRecords.length}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={refreshData} className="rounded-xl h-10 gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isRTL ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${
                isRTL ? 'right-3' : 'left-3'
              }`}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث بالطالب، الكتاب، أو SPR...' : 'Search student, book, or SPR...'}
              className={isRTL ? 'pr-9 text-right' : 'pl-9 text-left'}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="font-bold text-foreground">
              {isRTL ? 'رائع! لا توجد كتب متأخرة حالياً' : 'Great! No overdue books currently.'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRTL ? 'جميع الكتب المعارة ضمن فترتها المحددة' : 'All active loans are on schedule.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">{isRTL ? 'الطالب / المستعير' : 'Borrower'}</th>
                  <th className="py-3 px-3 text-center">{isRTL ? 'رقم SPR' : 'SPR ID'}</th>
                  <th className="py-3 px-3">{isRTL ? 'الكتاب' : 'Book'}</th>
                  <th className="py-3 px-3 text-center">{isRTL ? 'موعد الإرجاع المفترض' : 'Due Date'}</th>
                  <th className="py-3 px-3 text-center">{isRTL ? 'مدة التأخير' : 'Overdue By'}</th>
                  <th className="py-3 px-3 text-center">{isRTL ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-rose-500/5 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-foreground text-sm">{rec.student_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {isRTL ? 'تاريخ الاستعارة:' : 'Borrowed:'}{' '}
                        {new Date(rec.borrow_date).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {rec.student_spr_id ? (
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300">
                          {rec.student_spr_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-foreground">{rec.book_title}</div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {new Date(rec.expected_return_date).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold text-[11px] border border-rose-500/30">
                        <Clock className="w-3 h-3" />
                        <span>
                          {rec.days_overdue} {isRTL ? 'يوم تأخير' : 'days late'}
                        </span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReturn(rec)}
                        className="h-8 px-3 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'إرجاع ورصد النقاط' : 'Return & Award'}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return & Reading Points Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-lg">
          {selectedRecord && (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold font-amiri flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{isRTL ? 'استلام الكتاب المتأخر ورصد نقاط القراءة' : 'Process Book Return & Award Points'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedRecord.student_name} — {selectedRecord.book_title}
                </DialogDescription>
              </DialogHeader>

              {/* Status Radio / Buttons */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-foreground">
                  {isRTL ? 'ما هو مستوى قراءة الطالب للكتاب؟' : 'Reading Completion Level:'}
                </Label>

                <div className="grid grid-cols-3 gap-2">
                  {/* Full Read */}
                  <button
                    type="button"
                    onClick={() => setReadingStatus('full_read')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      readingStatus === 'full_read'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40 font-medium'
                    }`}
                  >
                    <div className="text-xs">{isRTL ? 'قراءة كاملة' : 'Full Read'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {books.find((b) => b.id === selectedRecord.book_id)?.pages || 50} {isRTL ? 'صفحة' : 'pages'}
                    </div>
                  </button>

                  {/* Custom Pages */}
                  <button
                    type="button"
                    onClick={() => setReadingStatus('custom_pages')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      readingStatus === 'custom_pages'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/30 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40 font-medium'
                    }`}
                  >
                    <div className="text-xs">{isRTL ? 'صفحات محددة' : 'Custom Pages'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{isRTL ? 'إدخال يدوي' : 'Manual count'}</div>
                  </button>

                  {/* Not Read */}
                  <button
                    type="button"
                    onClick={() => setReadingStatus('not_read')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      readingStatus === 'not_read'
                        ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-300 ring-2 ring-rose-500/30 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40 font-medium'
                    }`}
                  >
                    <div className="text-xs">{isRTL ? 'لم يُقرأ' : 'Not Read'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">0 {isRTL ? 'نقطة' : 'points'}</div>
                  </button>
                </div>
              </div>

              {/* Custom pages input if custom_pages */}
              {readingStatus === 'custom_pages' && (
                <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <Label className="text-xs font-bold text-foreground">
                    {isRTL ? 'عدد الصفحات المقروءة:' : 'Pages Read:'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max={books.find((b) => b.id === selectedRecord.book_id)?.pages || 5000}
                    value={customPages}
                    onChange={(e) => setCustomPages(Number(e.target.value))}
                    className="font-mono text-base font-bold rounded-xl"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  {isRTL ? 'ملاحظات الإرجاع:' : 'Return Notes (optional):'}
                </Label>
                <Input
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder={isRTL ? 'سبب التأخير أو حالة الكتاب عند الإرجاع...' : 'Reason for delay or book condition...'}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Calculated Points Preview */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {isRTL ? 'النقاط التي ستضاف للوحة المتصدرين:' : 'Points added to Leaderboard:'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {settings.points_per_10_pages} {isRTL ? 'نقاط لكل 10 صفحات' : 'pts / 10 pages'}
                  </div>
                </div>
                <div className="font-mono font-black text-2xl text-primary">
                  +{calculatedPointsPreview()}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-xl text-xs"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmReturn}
                  disabled={processing}
                  className="rounded-xl text-xs font-bold"
                >
                  {isRTL ? 'تأكيد الإرجاع وتحديث اللوحة' : 'Confirm Return & Update Leaderboard'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
