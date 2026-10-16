import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Search,
  BookOpen,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Users,
  RotateCcw,
  Clock,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useI18n } from '@/lib/i18n';
import { dataService, Book, convertDriveUrl, BookStatus } from '@/lib/dataService';

export default function BooksManager() {
  const { t, lang } = useI18n();
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');

  // Add / Edit Modal state
  const [editing, setEditing] = useState<Partial<Book> | null>(null);
  const [saving, setSaving] = useState(false);

  // Book Stats Modal state
  // "if admin click on any book name in the admin panels book adding session,how much users borrowed /requested/returned about that book should show."
  const [activeBookStats, setActiveBookStats] = useState<{
    book: Book;
    stats: ReturnType<typeof dataService.getBookStats>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    setBooks(dataService.getBooks());
  };

  useEffect(() => {
    reload();
  }, []);

  const categories = useMemo(() => {
    return dataService.getCategories();
  }, []);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title_ar.toLowerCase().includes(q) ||
        (b.title_en && b.title_en.toLowerCase().includes(q)) ||
        b.author_ar.toLowerCase().includes(q) ||
        (b.author_en && b.author_en.toLowerCase().includes(q)) ||
        (b.book_code && b.book_code.toLowerCase().includes(q))
    );
  }, [books, query]);

  const openNew = () => {
    setEditing({
      title_ar: '',
      title_en: '',
      author_ar: '',
      author_en: '',
      publisher_ar: '',
      publisher_en: '',
      book_code: '',
      pages: 0,
      volume: '1',
      category_id: categories[0]?.id || 'cat-1',
      category_name_ar: categories[0]?.name_ar || 'عام',
      category_name_en: categories[0]?.name_en || 'General',
      cover_url: '',
      status: 'available',
    });
  };

  const openEdit = (b: Book) => {
    setEditing({ ...b });
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.title_ar?.trim()) return toast.error(t('titleAr'));
    if (!editing.author_ar?.trim()) return toast.error(t('authorAr'));

    setSaving(true);
    try {
      const selectedCat = categories.find((c) => c.id === editing.category_id);

      dataService.saveBook({
        id: editing.id,
        title_ar: editing.title_ar.trim(),
        title_en: editing.title_en?.trim() || '',
        author_ar: editing.author_ar.trim(),
        author_en: editing.author_en?.trim() || '',
        publisher_ar: editing.publisher_ar?.trim() || '',
        publisher_en: editing.publisher_en?.trim() || '',
        book_code: editing.book_code?.trim() || '',
        pages: Number(editing.pages) || 0,
        volume: editing.volume?.trim() || '1',
        category_id: editing.category_id || 'cat-1',
        category_name_ar: selectedCat?.name_ar || 'عام',
        category_name_en: selectedCat?.name_en || 'General',
        cover_url: editing.cover_url?.trim() || '',
        status: (editing.status as BookStatus) || 'available',
      });

      toast.success(t('saved'));
      setEditing(null);
      reload();
    } catch (e: any) {
      toast.error(e.message || 'Error saving book');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (b: Book) => {
    if (!confirm(t('confirmDelete'))) return;
    dataService.deleteBook(b.id);
    toast.success(t('deleted'));
    reload();
  };

  // Clicking on any book name opens borrow / request / return statistics for that book
  const handleBookNameClick = (b: Book) => {
    const stats = dataService.getBookStats(b.id);
    setActiveBookStats({ book: b, stats });
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

        const rows: Partial<Book>[] = data.map((row: any) => ({
          title_ar: row['Book Name (Arabic)'] || row['عنوان الكتاب (عربي)'] || row['Title (Arabic)'] || '',
          title_en: row['Book Name (English)'] || row['عنوان الكتاب (إنجليزي)'] || row['Title (English)'] || '',
          author_ar: row['Author (Arabic)'] || row['المؤلف (عربي)'] || '',
          author_en: row['Author (English)'] || row['المؤلف (إنجليزي)'] || '',
          publisher_ar: row['Publisher (Arabic)'] || row['دار النشر (عربي)'] || '',
          publisher_en: row['Publisher (English)'] || row['دار النشر (إنجليزي)'] || '',
          book_code: row['Book Code'] || row['رمز الكتاب'] || '',
          pages: Number(row['Pages'] || row['عدد الصفحات'] || 0),
          volume: String(row['Volume'] || row['المجلد'] || '1'),
          status: (row['Status (available/missed)'] || row['الحالة'] || 'available').toString().toLowerCase().includes('miss') ? 'missed' : 'available',
          cover_url: row['Cover Drive URL'] || row['رابط صورة الغلاف'] || row['Cover URL'] || '',
          category_name_ar: row['Category (Arabic)'] || row['التصنيف'] || 'عام',
        }));

        const added = dataService.bulkAddBooks(rows);
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
            placeholder={lang === 'ar' ? 'بحث عن كتاب بالعنوان، المؤلف، أو الرمز...' : 'Search books...'}
            className="ps-9 h-10 rounded-xl bg-background border-border/70 text-xs"
          />
        </div>

        {/* Buttons: Download Template, Bulk Upload, Add Book */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => dataService.generateBookTemplate()}
            className="gap-1.5 h-10 rounded-xl text-xs font-semibold"
            title={t('downloadBookTemplate')}
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
            title={t('bulkAddBooks')}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t('bulkUpload')}</span>
          </Button>

          {/* Add Book */}
          <Button onClick={openNew} className="gap-1.5 h-10 rounded-xl text-xs font-bold">
            <Plus className="w-4 h-4" />
            <span>{t('addBook')}</span>
          </Button>
        </div>
      </div>

      {/* Books Table */}
      <div className="border border-border/70 rounded-2xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-secondary/60 border-b border-border/60 text-muted-foreground font-bold">
              <tr>
                <th className="px-3 py-3 text-start w-12">{t('poster')}</th>
                <th className="px-4 py-3 text-start">{t('title')}</th>
                <th className="px-4 py-3 text-start">{t('author')}</th>
                <th className="px-4 py-3 text-start">{t('publisher')}</th>
                <th className="px-4 py-3 text-start">{t('bookCode')}</th>
                <th className="px-4 py-3 text-start">{t('volume')}</th>
                <th className="px-4 py-3 text-start">{t('pages')}</th>
                <th className="px-4 py-3 text-start">{t('status')}</th>
                <th className="px-4 py-3 text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((b) => {
                  const isMissed = b.status === 'missed';
                  const coverSrc = convertDriveUrl(b.cover_url);

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-accent/40 transition-colors ${
                        isMissed ? 'bg-destructive/5' : ''
                      }`}
                    >
                      {/* Cover Thumbnail */}
                      <td className="px-3 py-2">
                        <div className="w-9 h-12 rounded-md bg-secondary overflow-hidden border border-border/60 shrink-0 flex items-center justify-center">
                          {coverSrc ? (
                            <img src={coverSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </td>

                      {/* Book Title (Clickable: opens users borrowed/requested/returned stats!) */}
                      <td className="px-4 py-3 font-bold">
                        <button
                          type="button"
                          onClick={() => handleBookNameClick(b)}
                          className="text-start hover:text-primary hover:underline group cursor-pointer focus:outline-none"
                          title={lang === 'ar' ? 'اضغط لعرض من استعار أو طلب أو أرجع هذا الكتاب' : 'Click to view borrowing statistics'}
                        >
                          <p className="font-extrabold text-primary group-hover:underline line-clamp-1">{b.title_ar}</p>
                          {b.title_en && (
                            <p className="text-[11px] text-muted-foreground font-normal line-clamp-1">{b.title_en}</p>
                          )}
                        </button>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3 text-muted-foreground">
                        <p className="font-medium text-foreground">{b.author_ar}</p>
                        {b.author_en && <p className="text-[10px] text-muted-foreground">{b.author_en}</p>}
                      </td>

                      {/* Publisher */}
                      <td className="px-4 py-3 text-muted-foreground">
                        <p>{b.publisher_ar || '—'}</p>
                        {b.publisher_en && <p className="text-[10px] opacity-75">{b.publisher_en}</p>}
                      </td>

                      {/* Book Code */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-secondary font-mono font-bold text-foreground">
                          {b.book_code || '—'}
                        </span>
                      </td>

                      {/* Volume & Pages */}
                      <td className="px-4 py-3 text-muted-foreground">{b.volume || '1'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.pages || '—'}</td>

                      {/* Status: Missed or Available */}
                      <td className="px-4 py-3">
                        {isMissed ? (
                          <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold text-[10px] inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{t('missed')}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-success/15 text-success font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('available')}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-end space-x-1 rtl:space-x-reverse">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(b)}
                          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(b)}
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
                    {lang === 'ar' ? 'لا توجد كتب مطابقة' : 'No books found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT BOOK MODAL                                    */}
      {/* Prompts: Arabic and English separately for Book Name,    */}
      {/* Author Name, Publishing House. Book Code, Book Page,     */}
      {/* Book Volume, Missed or Available status, and cover image */}
      {/* ONLY by using Drive URL link.                           */}
      {/* ======================================================== */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>{editing?.id ? t('editBook') : t('addBook')}</span>
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-1 text-xs">
              {/* Book Names: Arabic & English separately */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">{t('titleAr')} *</Label>
                  <Input
                    value={editing.title_ar || ''}
                    onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })}
                    placeholder="صحيح البخاري"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t('titleEn')}</Label>
                  <Input
                    value={editing.title_en || ''}
                    onChange={(e) => setEditing({ ...editing, title_en: e.target.value })}
                    placeholder="Sahih Al-Bukhari"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              {/* Author Names: Arabic & English separately */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">{t('authorAr')} *</Label>
                  <Input
                    value={editing.author_ar || ''}
                    onChange={(e) => setEditing({ ...editing, author_ar: e.target.value })}
                    placeholder="الإمام محمد بن إسماعيل البخاري"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t('authorEn')}</Label>
                  <Input
                    value={editing.author_en || ''}
                    onChange={(e) => setEditing({ ...editing, author_en: e.target.value })}
                    placeholder="Imam Muhammad ibn Ismail al-Bukhari"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              {/* Publishing House: Arabic & English separately */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">{t('publisherAr')}</Label>
                  <Input
                    value={editing.publisher_ar || ''}
                    onChange={(e) => setEditing({ ...editing, publisher_ar: e.target.value })}
                    placeholder="دار طوق النجاة"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t('publisherEn')}</Label>
                  <Input
                    value={editing.publisher_en || ''}
                    onChange={(e) => setEditing({ ...editing, publisher_en: e.target.value })}
                    placeholder="Dar Tawq Al-Najat"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              {/* Book Code, Pages, Volume */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <Label className="text-xs font-bold">{t('bookCode')}</Label>
                  <Input
                    value={editing.book_code || ''}
                    onChange={(e) => setEditing({ ...editing, book_code: e.target.value })}
                    placeholder="KB-001"
                    className="h-9 rounded-xl text-xs mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t('pages')}</Label>
                  <Input
                    type="number"
                    value={editing.pages || ''}
                    onChange={(e) => setEditing({ ...editing, pages: Number(e.target.value) })}
                    placeholder="1824"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t('volume')}</Label>
                  <Input
                    value={editing.volume || ''}
                    onChange={(e) => setEditing({ ...editing, volume: e.target.value })}
                    placeholder="1-4"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              {/* Category & Status (Missed or Available) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">{t('category')}</Label>
                  <Select
                    value={editing.category_id || categories[0]?.id}
                    onValueChange={(val) => setEditing({ ...editing, category_id: val })}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs mt-1">
                      <SelectValue placeholder={t('category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {lang === 'ar' ? c.name_ar : c.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status: Missed or Available (Prompt requirement) */}
                <div>
                  <Label className="text-xs font-bold">{t('bookStatus')}</Label>
                  <Select
                    value={editing.status || 'available'}
                    onValueChange={(val: any) => setEditing({ ...editing, status: val })}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs mt-1">
                      <SelectValue placeholder={t('bookStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">
                        <span className="text-success font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('available')}</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="missed">
                        <span className="text-destructive font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{t('missed')} ({lang === 'ar' ? 'تظليل أحمر' : 'Red shading'})</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cover Image URL ONLY by Drive URL Link (Prompt requirement) */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30 space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-primary" />
                  <span>{lang === 'ar' ? 'رابط صورة الغلاف عبر Google Drive فقط' : 'Cover image (Google Drive link only)'}</span>
                </Label>
                <Input
                  value={editing.cover_url || ''}
                  onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/1example.../view"
                  className="h-9 rounded-xl text-xs bg-background"
                />
                <p className="text-[10px] text-muted-foreground">
                  {lang === 'ar'
                    ? 'يتم قبول روابط مشاركة Google Drive وسيقوم التطبيق بتحويلها تلقائياً للعرض المباشر.'
                    : 'Paste a Google Drive share link and it will be converted automatically.'}
                </p>

                {/* Instant Cover Preview */}
                {editing.cover_url && (
                  <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-card border border-border/60">
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-accent shrink-0 border">
                      <img
                        src={convertDriveUrl(editing.cover_url)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-success font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تم التعرف على الرابط بنجاح' : 'Link converted'}</span>
                    </span>
                  </div>
                )}
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
      {/* BOOK STATS & BORROW HISTORY MODAL (Triggered when admin  */}
      {/* clicks any book name)                                    */}
      {/* Prompt: "if admin click on any book name in the admin    */}
      {/* panels book adding session,how much users borrowed       */}
      {/* /requested/returned about that book should show."        */}
      {/* ======================================================== */}
      <Dialog open={!!activeBookStats} onOpenChange={(o) => !o && setActiveBookStats(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>{t('borrowStats')}</span>
            </DialogTitle>
          </DialogHeader>

          {activeBookStats && (
            <div className="space-y-4">
              {/* Book Header Card */}
              <div className="p-3.5 rounded-2xl bg-secondary/50 border border-primary/20 flex items-start gap-3">
                <div className="w-12 h-16 rounded-lg bg-card overflow-hidden border shrink-0">
                  {activeBookStats.book.cover_url ? (
                    <img
                      src={convertDriveUrl(activeBookStats.book.cover_url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">{activeBookStats.book.title_ar}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeBookStats.book.author_ar} • <span className="font-mono font-bold text-primary">{activeBookStats.book.book_code}</span>
                  </p>
                  <div className="mt-1">
                    {activeBookStats.book.status === 'missed' ? (
                      <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold text-[10px]">
                        {t('missed')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-success/15 text-success font-bold text-[10px]">
                        {t('available')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 Summary Counters: Users Borrowed, Requested, Returned */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-xl font-extrabold text-primary block">
                    {activeBookStats.stats.totalBorrowed}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {t('borrowedCount')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xl font-extrabold text-amber-600 block">
                    {activeBookStats.stats.totalRequested}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {t('requestedCount')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                  <span className="text-xl font-extrabold text-success block">
                    {activeBookStats.stats.totalReturned}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {t('returnedCount')}
                  </span>
                </div>
              </div>

              {/* Detailed Users List */}
              <div className="space-y-3 pt-2 border-t border-border/50 max-h-60 overflow-y-auto">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>{lang === 'ar' ? 'سجل المستخدمين الذين استعاروا أو طلبوا الكتاب:' : 'Borrowers & Requester Log:'}</span>
                </p>

                {activeBookStats.stats.requestsList.length > 0 ? (
                  <div className="space-y-2">
                    {activeBookStats.stats.requestsList.map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl border border-border/70 bg-card text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-foreground">{req.requester_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {req.requester_class ? `${req.requester_class} • ` : ''}
                            {new Date(req.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
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
              onClick={() => setActiveBookStats(null)}
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
