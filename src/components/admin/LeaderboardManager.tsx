import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  dataService,
  LeaderboardSettings,
  LeaderboardEntry,
  LeaderboardSnapshot,
  ReadingRecord,
  ReadingStatus,
  BorrowRecord,
  Book,
} from '@/lib/dataService';
import {
  Trophy,
  Award,
  Settings2,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Search,
  BookOpen,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function LeaderboardManager() {
  const { t, isRTL } = useLanguage();

  // Active sub-tab: 'points' | 'valuation' | 'preview' | 'snapshots'
  const [activeTab, setActiveTab] = useState<'points' | 'valuation' | 'preview' | 'snapshots'>('points');

  const [settings, setSettings] = useState<LeaderboardSettings>({
    is_hidden_from_public: false,
    points_per_10_pages: 4,
    last_updated: new Date().toISOString(),
  });
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [readingRecords, setReadingRecords] = useState<ReadingRecord[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [snapshots, setSnapshots] = useState<LeaderboardSnapshot[]>([]);

  // Search filter in borrow records
  const [recordSearch, setRecordSearch] = useState('');

  // Award Points Modal State
  const [evaluatingRecord, setEvaluatingRecord] = useState<BorrowRecord | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>('full_read');
  const [customPagesInput, setCustomPagesInput] = useState<number>(0);
  const [evalNotes, setEvalNotes] = useState<string>('');

  // Valuation form state
  const [pointsPer10Input, setPointsPer10Input] = useState<number>(4);
  const [recalculating, setRecalculating] = useState(false);

  // Snapshot form state
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const s = dataService.getLeaderboardSettings();
    setSettings(s);
    setPointsPer10Input(s.points_per_10_pages);

    setBorrowRecords(dataService.getBorrowRecords());
    setReadingRecords(dataService.getReadingRecords());
    setBooks(dataService.getBooks());
    setLeaderboard(dataService.getLeaderboard());
    setSnapshots(dataService.getLeaderboardSnapshots());
  };

  // Open evaluate dialog for a borrow record
  const handleOpenEvaluate = (record: BorrowRecord) => {
    setEvaluatingRecord(record);
    const existing = readingRecords.find((r) => r.borrow_record_id === record.id);
    const book = books.find((b) => b.id === record.book_id);
    const defaultPages = book?.pages || 50;

    if (existing) {
      setSelectedStatus(existing.reading_status);
      setCustomPagesInput(existing.pages_read || defaultPages);
      setEvalNotes(existing.notes || '');
    } else {
      setSelectedStatus('full_read');
      setCustomPagesInput(defaultPages);
      setEvalNotes('');
    }
  };

  // Calculate points preview inside dialog
  const calculatedPointsPreview = () => {
    if (!evaluatingRecord) return 0;
    const book = books.find((b) => b.id === evaluatingRecord.book_id);
    const totalBookPages = book?.pages || 50;

    if (selectedStatus === 'not_read') return 0;
    if (selectedStatus === 'full_read') {
      return Math.max(1, Math.round((totalBookPages / 10) * settings.points_per_10_pages));
    }
    const p = Math.max(0, customPagesInput);
    return Math.max(1, Math.round((p / 10) * settings.points_per_10_pages));
  };

  const handleSaveEvaluation = async () => {
    if (!evaluatingRecord) return;
    const book = books.find((b) => b.id === evaluatingRecord.book_id);
    const totalBookPages = book?.pages || 50;

    let pagesToCredit = 0;
    if (selectedStatus === 'full_read') {
      pagesToCredit = totalBookPages;
    } else if (selectedStatus === 'custom_pages') {
      pagesToCredit = Math.max(0, customPagesInput);
    }

    const calculatedPoints = calculatedPointsPreview();

    try {
      await dataService.saveReadingRecord({
        borrow_record_id: evaluatingRecord.id,
        student_id: evaluatingRecord.student_id,
        student_name: evaluatingRecord.student_name,
        student_spr_id: evaluatingRecord.student_spr_id,
        book_id: evaluatingRecord.book_id,
        book_title: evaluatingRecord.book_title,
        book_code: book?.book_code,
        reading_status: selectedStatus,
        book_total_pages: totalBookPages,
        pages_read: pagesToCredit,
        points_awarded: calculatedPoints,
        valuation_rate_per_10_pages: settings.points_per_10_pages,
        return_date: evaluatingRecord.return_date || new Date().toISOString(),
        notes: evalNotes.trim() || undefined,
      });

      toast.success(
        isRTL
          ? `تم رصد ${calculatedPoints} نقطة للطالب ${evaluatingRecord.student_name} بنجاح`
          : `Recorded ${calculatedPoints} points for ${evaluatingRecord.student_name}`
      );
      setEvaluatingRecord(null);
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save reading points');
    }
  };

  // Save valuation rate and recalculate all existing records
  const handleSaveValuation = async () => {
    if (pointsPer10Input <= 0) {
      toast.error(isRTL ? 'يرجى إدخال قيمة صحيحة' : 'Please enter a valid positive number');
      return;
    }

    setRecalculating(true);
    try {
      await dataService.saveLeaderboardSettings({
        ...settings,
        points_per_10_pages: pointsPer10Input,
      });
      await dataService.recalculateAllReadingPoints();
      toast.success(
        isRTL
          ? `تم تحديث التقييم إلى ${pointsPer10Input} نقاط لكل 10 صفحات وإعادة احتساب كافة السجلات!`
          : `Valuation set to ${pointsPer10Input} pts/10 pages and all records recalculated!`
      );
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update valuation');
    } finally {
      setRecalculating(false);
    }
  };

  // Toggle visibility from public
  const handleToggleVisibility = async (hidden: boolean) => {
    try {
      await dataService.saveLeaderboardSettings({
        ...settings,
        is_hidden_from_public: hidden,
      });
      setSettings((prev) => ({ ...prev, is_hidden_from_public: hidden }));
      toast.success(
        hidden
          ? isRTL
            ? 'تم إخفاء لوحة المتصدرين عن الزوار'
            : 'Leaderboard is now hidden from public users'
          : isRTL
          ? 'تم إظهار لوحة المتصدرين لجميع الزوار'
          : 'Leaderboard is now publicly visible'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update visibility');
    }
  };

  // Create Snapshot
  const handleCreateSnapshot = async () => {
    if (!snapshotTitle.trim()) {
      toast.error(isRTL ? 'يرجى إدخال اسم اللقطة' : 'Please enter a snapshot name');
      return;
    }

    setSavingSnapshot(true);
    try {
      await dataService.createLeaderboardSnapshot(snapshotTitle.trim());
      toast.success(
        isRTL
          ? `تم حفظ لقطة "${snapshotTitle}" بنجاح!`
          : `Saved snapshot "${snapshotTitle}" successfully!`
      );
      setSnapshotTitle('');
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create snapshot');
    } finally {
      setSavingSnapshot(false);
    }
  };

  // Delete snapshot
  const handleDeleteSnapshot = async (id: string, title: string) => {
    if (!confirm(isRTL ? `هل تريد حذف اللقطة "${title}"؟` : `Delete snapshot "${title}"?`)) {
      return;
    }
    try {
      await dataService.deleteLeaderboardSnapshot(id);
      toast.success(isRTL ? 'تم حذف اللقطة' : 'Snapshot deleted');
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete snapshot');
    }
  };

  // Filter borrow records
  const filteredRecords = borrowRecords.filter((rec) => {
    if (!recordSearch.trim()) return true;
    const q = recordSearch.toLowerCase();
    return (
      rec.student_name.toLowerCase().includes(q) ||
      rec.book_title.toLowerCase().includes(q) ||
      (rec.student_spr_id && rec.student_spr_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top 4 Option Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-secondary/80 p-1.5 rounded-2xl border border-border">
        <button
          onClick={() => setActiveTab('points')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'points'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award className="w-4 h-4 text-primary" />
          <span>{isRTL ? '1. رصد نقاط الكتب' : '1. Award Points'}</span>
        </button>

        <button
          onClick={() => setActiveTab('valuation')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'valuation'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings2 className="w-4 h-4 text-purple-600" />
          <span>{isRTL ? '2. معيار التقييم' : '2. Valuation Rate'}</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'preview'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>{isRTL ? '3. معاينة حية للوحة' : '3. Live Preview'}</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'snapshots'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="w-4 h-4 text-indigo-600" />
          <span>{isRTL ? '4. الإخفاء واللقطات' : '4. Visibility & Snapshots'}</span>
        </button>
      </div>

      {/* ================= Option 1: Award Points for Books ================= */}
      {activeTab === 'points' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground font-amiri flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span>{isRTL ? 'رصد نقاط القراءة لسجلات الاستعارة' : 'Award Reading Points for Borrow Records'}</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL
                  ? 'حدد لكل استعارة ما إذا كان الطالب قرأ الكتاب كاملاً، أو عدداً محدداً من الصفحات، أو لم يقرأه، لحساب نقاطه تلقائياً في لوحة المتصدرين.'
                  : 'Evaluate borrow records as Full Read, Custom Pages, or Not Read to automatically compute points on the leaderboard.'}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${
                  isRTL ? 'right-3' : 'left-3'
                }`}
              />
              <Input
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                placeholder={isRTL ? 'ابحث بالطالب أو الكتاب...' : 'Search student or book...'}
                className={isRTL ? 'pr-9 text-right' : 'pl-9 text-left'}
              />
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>{isRTL ? 'لا توجد سجلات استعارة حالية' : 'No borrow records found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">{isRTL ? 'الطالب' : 'Student'}</th>
                    <th className="py-3 px-3 text-center">{isRTL ? 'رقم SPR' : 'SPR ID'}</th>
                    <th className="py-3 px-3">{isRTL ? 'الكتاب المستعار' : 'Book'}</th>
                    <th className="py-3 px-3 text-center">{isRTL ? 'الحالة الحالية' : 'Reading Status'}</th>
                    <th className="py-3 px-3 text-center">{isRTL ? 'النقاط المحتسبة' : 'Points'}</th>
                    <th className="py-3 px-3 text-center">{isRTL ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map((rec) => {
                    const evalRec = readingRecords.find((r) => r.borrow_record_id === rec.id);
                    const book = books.find((b) => b.id === rec.book_id);

                    return (
                      <tr key={rec.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-foreground text-sm">{rec.student_name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(rec.borrow_date).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rec.student_spr_id ? (
                            <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300">
                              {rec.student_spr_id}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-foreground">{rec.book_title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {book?.pages || 50} {isRTL ? 'صفحة' : 'pages'}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {evalRec ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                evalRec.reading_status === 'full_read'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  : evalRec.reading_status === 'custom_pages'
                                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {evalRec.reading_status === 'full_read' && (isRTL ? 'قراءة كاملة' : 'Full Read')}
                              {evalRec.reading_status === 'custom_pages' &&
                                `${evalRec.pages_read} ${isRTL ? 'ص مخصصة' : 'pages'}`}
                              {evalRec.reading_status === 'not_read' && (isRTL ? 'لم يُقرأ' : 'Not Read')}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                              {isRTL ? 'بانتظار التقييم' : 'Pending Evaluation'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-black text-sm">
                          {evalRec ? (
                            <span className="text-primary">+{evalRec.points_awarded}</span>
                          ) : (
                            <span className="text-muted-foreground/60">0</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <Button
                            size="sm"
                            variant={evalRec ? 'outline' : 'default'}
                            onClick={() => handleOpenEvaluate(rec)}
                            className="text-xs h-8 px-3 rounded-xl font-bold"
                          >
                            {evalRec ? (isRTL ? 'تعديل التقييم' : 'Edit') : isRTL ? 'رصد النقاط' : 'Award'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= Option 2: Reading Valuation ================= */}
      {activeTab === 'valuation' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground font-amiri flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-purple-600" />
              <span>{isRTL ? 'إدارة معيار تقييم القراءة والنقاط' : 'Reading Valuation & Points Multiplier'}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? 'حدد عدد النقاط الممنوحة لكل 10 صفحات مقروءة. عند حفظ وتحديث هذه القيمة، يتم تلقائياً إعادة احتساب نقاط كافة سجلات الاستعارة المقيمة وتحديث لوحة المتصدرين.'
                : 'Define how many points are granted per 10 pages read. Changing this updates all existing reading records and refreshes the leaderboard scores.'}
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 max-w-xl space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">
                {isRTL ? 'عدد النقاط لكل 10 صفحات:' : 'Points per 10 Pages:'}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={pointsPer10Input}
                  onChange={(e) => setPointsPer10Input(Number(e.target.value))}
                  className="font-mono text-lg font-bold w-32 rounded-xl"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {isRTL ? 'نقاط / 10 صفحات' : 'points / 10 pages'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border text-xs space-y-2">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isRTL ? 'أمثلة توضيحية لمعيار التقييم الحالي:' : 'Current Valuation Example:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  {isRTL
                    ? `كتاب من 50 صفحة (قراءة كاملة) = (50 ÷ 10) × ${pointsPer10Input} = `
                    : `50-page book (Full Read) = (50 / 10) * ${pointsPer10Input} = `}
                  <strong className="text-primary">{Math.round((50 / 10) * pointsPer10Input)} {isRTL ? 'نقطة' : 'pts'}</strong>
                </li>
                <li>
                  {isRTL
                    ? `كتاب من 200 صفحة (قراءة كاملة) = (200 ÷ 10) × ${pointsPer10Input} = `
                    : `200-page book (Full Read) = (200 / 10) * ${pointsPer10Input} = `}
                  <strong className="text-primary">{Math.round((200 / 10) * pointsPer10Input)} {isRTL ? 'نقطة' : 'pts'}</strong>
                </li>
                <li>
                  {isRTL
                    ? `قراءة مخصصة لـ 30 صفحة فقط = (30 ÷ 10) × ${pointsPer10Input} = `
                    : `Custom 30 pages read = (30 / 10) * ${pointsPer10Input} = `}
                  <strong className="text-primary">{Math.round((30 / 10) * pointsPer10Input)} {isRTL ? 'نقطة' : 'pts'}</strong>
                </li>
                <li>
                  {isRTL ? 'عدم قراءة الكتاب = 0 نقطة' : 'Not Read = 0 points'}
                </li>
              </ul>
            </div>

            <Button
              onClick={handleSaveValuation}
              disabled={recalculating}
              className="w-full sm:w-auto font-bold rounded-xl gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
              <span>
                {recalculating
                  ? isRTL
                    ? 'جارٍ تحديث وإعادة احتساب النقاط...'
                    : 'Recalculating all records...'
                  : isRTL
                  ? 'حفظ وإعادة احتساب جميع السجلات'
                  : 'Save & Recalculate All Records'}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* ================= Option 3: Live Preview ================= */}
      {activeTab === 'preview' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground font-amiri flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>{isRTL ? 'معاينة حية للوحة المتصدرين' : 'Live Leaderboard Preview'}</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL
                  ? 'عرض مباشر للشكل الذي تظهر به لوحة المتصدرين للمستخدمين حالياً مع أحدث النقاط المحتسبة.'
                  : 'Real-time preview of how the leaderboard currently appears to students and visitors.'}
              </p>
            </div>

            <Button size="sm" variant="outline" onClick={refreshData} className="gap-2 rounded-xl text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isRTL ? 'تحديث المعاينة' : 'Refresh'}</span>
            </Button>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>{isRTL ? 'لا توجد بيانات لوحة بعد. قم بتقييم استعارة في الخيار الأول.' : 'No leaderboard data yet. Evaluate records in Option 1.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaderboard.slice(0, 3).map((champion) => (
                  <div
                    key={champion.student_id}
                    className="p-4 rounded-2xl border bg-muted/40 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 font-black text-lg flex items-center justify-center">
                      #{champion.rank}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm line-clamp-1">
                        {champion.student_name}
                      </div>
                      {champion.student_spr_id && (
                        <div className="text-[11px] font-mono text-primary font-bold">
                          SPR: {champion.student_spr_id}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        <strong className="text-foreground">{champion.total_points}</strong> {isRTL ? 'نقطة' : 'pts'} •{' '}
                        {champion.books_read_count} {isRTL ? 'كتب' : 'books'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-border rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">{isRTL ? 'الرتبة' : 'Rank'}</th>
                      <th className="py-2.5 px-3">{isRTL ? 'الطالب' : 'Student'}</th>
                      <th className="py-2.5 px-3 text-center">{isRTL ? 'رقم SPR' : 'SPR ID'}</th>
                      <th className="py-2.5 px-3 text-center">{isRTL ? 'الكتب المقروءة' : 'Books'}</th>
                      <th className="py-2.5 px-3 text-center">{isRTL ? 'الصفحات' : 'Pages'}</th>
                      <th className="py-2.5 px-3 text-center">{isRTL ? 'إجمالي النقاط' : 'Points'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaderboard.map((entry) => (
                      <tr key={entry.student_id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 text-center font-bold">#{entry.rank}</td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{entry.student_name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">
                          {entry.student_spr_id || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">{entry.books_read_count}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{entry.total_pages_read}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-primary">
                          {entry.total_points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= Option 4: Visibility & Snapshots ================= */}
      {activeTab === 'snapshots' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-8">
          {/* Public Visibility Toggle */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                {settings.is_hidden_from_public ? (
                  <EyeOff className="w-5 h-5 text-amber-500" />
                ) : (
                  <Eye className="w-5 h-5 text-emerald-500" />
                )}
                <span>{isRTL ? 'إظهار / إخفاء لوحة المتصدرين للمستخدمين' : 'Public Visibility Toggle'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.is_hidden_from_public
                  ? isRTL
                    ? 'اللوحة مخفية حالياً عن الزوار وتظهر فقط للمشرفين.'
                    : 'Currently HIDDEN from public users (visible to administrators only).'
                  : isRTL
                  ? 'اللوحة ظاهرة ومتاحة لجميع الطلاب والزوار على صفحة اللوحة.'
                  : 'Currently VISIBLE to all students and public visitors.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={!settings.is_hidden_from_public}
                onCheckedChange={(checked) => handleToggleVisibility(!checked)}
              />
              <span className="text-xs font-bold text-foreground">
                {settings.is_hidden_from_public
                  ? isRTL
                    ? 'مخفية'
                    : 'Hidden'
                  : isRTL
                  ? 'ظاهرة للعموم'
                  : 'Public'}
              </span>
            </div>
          </div>

          {/* Create Snapshot Section */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sm text-foreground font-amiri flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>{isRTL ? 'حفظ لقطة من اللوحة الحالية (Snapshot)' : 'Capture Current Leaderboard Snapshot'}</span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL
                  ? 'احفظ نتائج المنافسة الحالية باسم محدد (مثلاً: دورة رمضان 1447، الفصل الأول)، لتظهر للمستخدمين في خيار اللوحات السابقة.'
                  : 'Save current championship standings with a custom name so students can inspect past leaderboards on the public page.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
              <Input
                value={snapshotTitle}
                onChange={(e) => setSnapshotTitle(e.target.value)}
                placeholder={isRTL ? 'اسم اللقطة (مثال: فرسان القراءة - الفصل الأول 2026)...' : 'Snapshot name...'}
                className="rounded-xl"
              />
              <Button
                onClick={handleCreateSnapshot}
                disabled={savingSnapshot}
                className="font-bold rounded-xl gap-2 shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span>{isRTL ? 'حفظ اللقطة الآن' : 'Save Snapshot'}</span>
              </Button>
            </div>
          </div>

          {/* Saved Snapshots List */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-foreground font-amiri flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{isRTL ? 'اللقطات المحفوظة سابقاً:' : 'Saved Snapshots History:'}</span>
            </h4>

            {snapshots.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                {isRTL ? 'لم يتم حفظ أي لقطة بعد' : 'No snapshots saved yet'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-foreground">{snap.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(snap.snapshot_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>
                          {snap.entries.length} {isRTL ? 'فائزاً' : 'entrants'}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSnapshot(snap.id, snap.title)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= Evaluate Reading Points Dialog ================= */}
      <Dialog open={!!evaluatingRecord} onOpenChange={(open) => !open && setEvaluatingRecord(null)}>
        <DialogContent className="max-w-lg">
          {evaluatingRecord && (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold font-amiri flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span>{isRTL ? 'تقييم قراءة الكتاب ورصد النقاط' : 'Evaluate Book Reading & Award Points'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {evaluatingRecord.student_name} — {evaluatingRecord.book_title}
                </DialogDescription>
              </DialogHeader>

              {/* Status Radio / Buttons */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-foreground">
                  {isRTL ? 'اختر حالة إنجاز الطالب في قراءة الكتاب:' : 'Select Reading Status:'}
                </Label>

                <div className="grid grid-cols-3 gap-2">
                  {/* Full Read */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('full_read')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedStatus === 'full_read'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40 font-medium'
                    }`}
                  >
                    <div className="text-xs">{isRTL ? 'قراءة كاملة' : 'Full Read'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {books.find((b) => b.id === evaluatingRecord.book_id)?.pages || 50} {isRTL ? 'صفحة' : 'pages'}
                    </div>
                  </button>

                  {/* Custom Pages */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('custom_pages')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedStatus === 'custom_pages'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/30 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40 font-medium'
                    }`}
                  >
                    <div className="text-xs">{isRTL ? 'صفحات محددة' : 'Custom Pages'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{isRTL ? 'إدخال مخصص' : 'Custom count'}</div>
                  </button>

                  {/* Not Read */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('not_read')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedStatus === 'not_read'
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
              {selectedStatus === 'custom_pages' && (
                <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <Label className="text-xs font-bold text-foreground">
                    {isRTL ? 'عدد الصفحات المقروءة بالفعل:' : 'Actual Pages Read:'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max={books.find((b) => b.id === evaluatingRecord.book_id)?.pages || 5000}
                    value={customPagesInput}
                    onChange={(e) => setCustomPagesInput(Number(e.target.value))}
                    className="font-mono text-base font-bold rounded-xl"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  {isRTL ? 'ملاحظات المشرف (اختياري):' : 'Notes (optional):'}
                </Label>
                <Input
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder={isRTL ? 'مثال: أتم القراءة بتفوق، أو لخص الكتاب...' : 'e.g. Completed with summary...'}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Resulting Points Preview */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {isRTL ? 'النقاط المستحقة للطالب:' : 'Resulting Points Awarded:'}
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
                  onClick={() => setEvaluatingRecord(null)}
                  className="rounded-xl text-xs"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEvaluation}
                  className="rounded-xl text-xs font-bold"
                >
                  {isRTL ? 'تأكيد ورصد النقاط' : 'Confirm & Award Points'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
