import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  Search,
  GraduationCap,
  KeyRound,
  FileSpreadsheet,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useI18n } from '@/lib/i18n';
import { dataService, Student } from '@/lib/dataService';

export default function StudentsManager() {
  const { t, lang } = useI18n();
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');

  // Add / Edit Modal state
  const [editing, setEditing] = useState<Partial<Student> | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Student Stats / Activity Modal state
  // "if admin click on any student name in the admin panels student adding session,how much books he borrowed /requested/returned should show."
  const [activeStudentStats, setActiveStudentStats] = useState<{
    student: Student;
    stats: ReturnType<typeof dataService.getStudentStats>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    setStudents(dataService.getStudents());
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.spr_id.toLowerCase().includes(q) ||
        s.klass.toLowerCase().includes(q)
    );
  }, [students, query]);

  const openNew = () => {
    setEditing({
      name: '',
      klass: '',
      spr_id: 'SPR',
      secret_code: '',
      father_name: '',
      house_name: '',
      dob: '',
    });
  };

  const openEdit = (s: Student) => {
    setEditing({ ...s });
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name?.trim()) return toast.error(t('studentName'));
    if (!editing.klass?.trim()) return toast.error(t('class'));
    if (!editing.spr_id?.trim()) return toast.error(t('sprId'));
    if (!editing.secret_code?.trim()) return toast.error(t('secretCode'));

    setSaving(true);
    try {
      dataService.saveStudent({
        id: editing.id,
        name: editing.name,
        klass: editing.klass,
        spr_id: editing.spr_id,
        secret_code: editing.secret_code,
        father_name: editing.father_name,
        house_name: editing.house_name,
        dob: editing.dob,
      });
      toast.success(t('saved'));
      setEditing(null);
      reload();
    } catch (e: any) {
      toast.error(e.message || 'Error saving student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (s: Student) => {
    if (!confirm(t('confirmDelete'))) return;
    dataService.deleteStudent(s.id);
    setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
    toast.success(t('deleted'));
    reload();
  };

  // Bulk selection helpers
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!confirm(`${t('confirmDelete')} (${selectedStudentIds.length} ${t('students')})`)) return;
    try {
      await dataService.bulkDeleteStudents(selectedStudentIds);
      toast.success(
        lang === 'ar'
          ? `تم حذف ${selectedStudentIds.length} طالباً بنجاح`
          : `Deleted ${selectedStudentIds.length} students successfully`
      );
      setSelectedStudentIds([]);
      reload();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete selected students');
    }
  };

  // Clicking on any student name opens their borrow / request / return stats
  const handleStudentNameClick = (s: Student) => {
    const stats = dataService.getStudentStats(s.id);
    setActiveStudentStats({ student: s, stats });
  };

  // Bulk Excel Upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          toast.error(lang === 'ar' ? 'الملف فارغ أو التنسيق غير صحيح' : 'Excel file is empty');
          return;
        }

        const rows: Partial<Student>[] = data.map((row: any) => ({
          name: row['Student Name'] || row['اسم الطالب'] || row['Name'] || '',
          klass: row['Class'] || row['الصف'] || '',
          spr_id: row['SPR ID'] || row['رمز SPR'] || row['SPR'] || '',
          secret_code: String(row['Secret Code'] || row['الرمز السري'] || row['Password'] || ''),
          father_name: row['Father Name'] || row['اسم الأب'] || '',
          house_name: row['House Name'] || row['اسم المنزل'] || '',
          dob: row['Date of Birth'] || row['تاريخ الميلاد'] || '',
        }));

        const added = dataService.bulkAddStudents(rows);
        toast.success(`${t('importCount').replace('{n}', String(added))}`);
        reload();
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse Excel file');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث عن طالب بالاسم، الصف أو رمز SPR...' : 'Search student...'}
            className="ps-9 h-10 rounded-xl bg-background border-border/70 text-xs"
          />
        </div>

        {/* Buttons: Bulk Delete, Add, Excel Template, Bulk Upload */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedStudentIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-1.5 h-10 rounded-xl text-xs font-bold animate-in fade-in"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('deleteSelected')} ({selectedStudentIds.length})</span>
            </Button>
          )}

          {/* Download Excel Template */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => dataService.generateStudentTemplate()}
            className="gap-1.5 h-10 rounded-xl text-xs font-semibold"
            title={t('downloadStudentTemplate')}
          >
            <Download className="w-4 h-4 text-primary" />
            <span className="hidden md:inline">{t('downloadTemplate')}</span>
          </Button>

          {/* Bulk Upload Excel */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 h-10 rounded-xl text-xs font-semibold"
            title={t('bulkAddStudents')}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t('bulkUpload')}</span>
          </Button>

          {/* Add Student */}
          <Button onClick={openNew} className="gap-1.5 h-10 rounded-xl text-xs font-bold">
            <Plus className="w-4 h-4" />
            <span>{t('addStudent')}</span>
          </Button>
        </div>
      </div>

      {/* Students Table */}
      <div className="border border-border/70 rounded-2xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-secondary/60 border-b border-border/60 text-muted-foreground font-bold">
              <tr>
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                    title={t('selectAll')}
                  />
                </th>
                <th className="px-4 py-3 text-start">{t('studentName')}</th>
                <th className="px-4 py-3 text-start">{t('class')}</th>
                <th className="px-4 py-3 text-start">SPR ID</th>
                <th className="px-4 py-3 text-start">{t('secretCode')}</th>
                <th className="px-4 py-3 text-start">{t('fatherName')}</th>
                <th className="px-4 py-3 text-start">{t('houseName')}</th>
                <th className="px-4 py-3 text-start">{t('dob')}</th>
                <th className="px-4 py-3 text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                  <tr
                    key={s.id}
                    className={`hover:bg-accent/40 transition-colors ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(s.id)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                    </td>
                    {/* Student Name: Clickable to view borrow/request/return stats */}
                    <td className="px-4 py-3 font-bold text-foreground">
                      <button
                        type="button"
                        onClick={() => handleStudentNameClick(s)}
                        className="text-start hover:text-primary hover:underline flex items-center gap-2 group cursor-pointer focus:outline-none"
                        title={lang === 'ar' ? 'اضغط لعرض استعارات وطلبات هذا الطالب' : 'Click to view borrowing history'}
                      >
                        <GraduationCap className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="font-extrabold text-primary group-hover:underline">{s.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.klass}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold font-mono">
                        {s.spr_id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-muted-foreground">
                      •••• ({s.secret_code})
                    </td>
                    <td className="px-4 py-3 text-muted-foreground uppercase font-mono">
                      {s.father_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground uppercase font-mono">
                      {s.house_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.dob || '—'}
                    </td>
                    <td className="px-4 py-3 text-end space-x-1 rtl:space-x-reverse">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(s)}
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(s)}
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    {lang === 'ar' ? 'لا يوجد طلاب مسجلون' : 'No students found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT STUDENT MODAL                                 */}
      {/* ======================================================== */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span>{editing?.id ? t('editStudent') : t('addStudent')}</span>
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-3.5 py-1">
              <div>
                <Label className="text-xs font-bold">{t('studentName')} *</Label>
                <Input
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="محمد أحمد عبد الله"
                  className="h-9 rounded-xl text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-xs font-bold">{t('class')} *</Label>
                  <Input
                    value={editing.klass || ''}
                    onChange={(e) => setEditing({ ...editing, klass: e.target.value })}
                    placeholder="الصف العاشر"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t('sprId')} *</Label>
                  <Input
                    value={editing.spr_id || ''}
                    onChange={(e) => setEditing({ ...editing, spr_id: e.target.value.toUpperCase() })}
                    placeholder="SPR0156"
                    className="h-9 rounded-xl text-xs mt-1 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">{t('secretCode')} *</Label>
                <Input
                  value={editing.secret_code || ''}
                  onChange={(e) => setEditing({ ...editing, secret_code: e.target.value })}
                  placeholder="4589"
                  className="h-9 rounded-xl text-xs mt-1 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-[11px] font-bold text-muted-foreground mb-2">
                  {lang === 'ar' ? 'البيانات الاختيارية (تستخدم لاستعادة الرمز السري):' : 'Optional Recovery Details:'}
                </p>

                <div className="space-y-2.5">
                  <div>
                    <Label className="text-[11px]">{t('fatherName')}</Label>
                    <Input
                      value={editing.father_name || ''}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          father_name: e.target.value.replace(/\s+/g, '').toUpperCase(),
                        })
                      }
                      placeholder="AHMED"
                      className="h-9 rounded-xl text-xs mt-1 uppercase"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px]">{t('houseName')}</Label>
                    <Input
                      value={editing.house_name || ''}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          house_name: e.target.value.replace(/\s+/g, '').toUpperCase(),
                        })
                      }
                      placeholder="DARUSSALAM"
                      className="h-9 rounded-xl text-xs mt-1 uppercase"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px]">{t('dob')}</Label>
                    <Input
                      type="date"
                      value={editing.dob || ''}
                      onChange={(e) => setEditing({ ...editing, dob: e.target.value })}
                      className="h-9 rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setEditing(null)} className="rounded-xl text-xs">
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl text-xs font-bold px-5">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* STUDENT STATS & ACTIVITY MODAL (Triggered when admin     */}
      {/* clicks any student name)                                 */}
      {/* Prompt: "if admin click on any student name in the admin */}
      {/* panels student adding session,how much books he borrowed */}
      {/* /requested/returned should show."                        */}
      {/* ======================================================== */}
      <Dialog open={!!activeStudentStats} onOpenChange={(o) => !o && setActiveStudentStats(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>{t('studentStats')}</span>
            </DialogTitle>
          </DialogHeader>

          {activeStudentStats && (
            <div className="space-y-4">
              {/* Student Header Card */}
              <div className="p-3.5 rounded-2xl bg-secondary/50 border border-primary/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">{activeStudentStats.student.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeStudentStats.student.klass} • <span className="font-mono font-bold text-primary">{activeStudentStats.student.spr_id}</span>
                  </p>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-muted-foreground block">{t('secretCode')}</span>
                  <span className="text-xs font-mono font-bold text-foreground">{activeStudentStats.student.secret_code}</span>
                </div>
              </div>

              {/* 3 Summary Counters: Borrowed, Requested, Returned */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-xl font-extrabold text-primary block">
                    {activeStudentStats.stats.totalBorrowed}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {t('borrowedCount')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xl font-extrabold text-amber-600 block">
                    {activeStudentStats.stats.totalRequested}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {t('requestedCount')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                  <span className="text-xl font-extrabold text-success block">
                    {activeStudentStats.stats.totalReturned}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {t('returnedCount')}
                  </span>
                </div>
              </div>

              {/* Detailed Activity Lists */}
              <div className="space-y-3 pt-2 border-t border-border/50 max-h-60 overflow-y-auto">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>{lang === 'ar' ? 'سجل الكتب والطلبات:' : 'Activity Log:'}</span>
                </p>

                {activeStudentStats.stats.requestsList.length > 0 ? (
                  <div className="space-y-2">
                    {activeStudentStats.stats.requestsList.map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl border border-border/70 bg-card text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-foreground truncate max-w-[240px]">{req.book_title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(req.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')} • {req.days_requested} {lang === 'ar' ? 'أيام' : 'days'}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'returned'
                              ? 'bg-success/15 text-success'
                              : req.status === 'approved'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-amber-500/15 text-amber-600'
                          }`}
                        >
                          {req.status === 'returned'
                            ? t('returnedCount')
                            : req.status === 'approved'
                            ? t('borrowedCount')
                            : t('requestedCount')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    {t('noActivityYet')}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveStudentStats(null)}
              className="rounded-xl text-xs w-full"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
