import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Upload, Download, FileSpreadsheet, Image as ImageIcon, Clipboard } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useI18n } from '@/lib/i18n';
import { signedCoverUrl } from '@/lib/storage';
import { FullPageLoader } from '@/components/LogoSpinner';

type Lookup = { id: string; name_ar: string; name_en: string | null };
type Book = {
  id: string;
  si_number: number | null;
  book_code: string | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  volume: string | null;
  pages: number | null;
  category_id: string | null;
  author_id: string | null;
  publisher_id: string | null;
  cover_path: string | null;
  full_text: string | null;
};

const emptyBook: Partial<Book> = {
  book_code: '', title_ar: '', title_en: '', description_ar: '', description_en: '',
  volume: '', pages: null, category_id: null, author_id: null, publisher_id: null,
  cover_path: null, full_text: '',
};

export default function BooksManager() {
  const { t } = useI18n();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [cats, setCats] = useState<Lookup[]>([]);
  const [auts, setAuts] = useState<Lookup[]>([]);
  const [pubs, setPubs] = useState<Lookup[]>([]);
  const [editing, setEditing] = useState<Partial<Book> | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [b, c, a, p] = await Promise.all([
      supabase.from('books').select('*').order('si_number', { ascending: false }),
      supabase.from('categories').select('id, name_ar, name_en').order('name_ar'),
      supabase.from('authors').select('id, name_ar, name_en').order('name_ar'),
      supabase.from('publishers').select('id, name_ar, name_en').order('name_ar'),
    ]);
    setBooks((b.data ?? []) as Book[]);
    setCats((c.data ?? []) as Lookup[]);
    setAuts((a.data ?? []) as Lookup[]);
    setPubs((p.data ?? []) as Lookup[]);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing({ ...emptyBook });
    setCoverFile(null);
    setCoverPreview(null);
  };
  const openEdit = async (b: Book) => {
    setEditing({ ...b });
    setCoverFile(null);
    setCoverPreview(b.cover_path ? await signedCoverUrl(b.cover_path) : null);
  };

  const uploadCoverIfAny = async (): Promise<string | null | undefined> => {
    if (!coverFile) return undefined; // unchanged
    const ext = coverFile.name.split('.').pop() || 'png';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('book-covers').upload(path, coverFile, { upsert: false, contentType: coverFile.type });
    if (error) { toast.error(error.message); throw error; }
    return path;
  };

  const save = async () => {
    if (!editing?.title_ar?.trim()) { toast.error(t('titleAr')); return; }
    setSaving(true);
    try {
      let cover_path = editing.cover_path ?? null;
      const uploaded = await uploadCoverIfAny();
      if (uploaded !== undefined) cover_path = uploaded;

      const payload: any = {
        book_code: editing.book_code || null,
        title_ar: editing.title_ar,
        title_en: editing.title_en || null,
        description_ar: editing.description_ar || null,
        description_en: editing.description_en || null,
        volume: editing.volume || null,
        pages: editing.pages ? Number(editing.pages) : null,
        category_id: editing.category_id || null,
        author_id: editing.author_id || null,
        publisher_id: editing.publisher_id || null,
        full_text: editing.full_text || null,
        cover_path,
      };

      let err;
      if (editing.id) {
        ({ error: err } = await supabase.from('books').update(payload).eq('id', editing.id));
      } else {
        ({ error: err } = await supabase.from('books').insert(payload));
      }
      if (err) throw err;
      toast.success(t('saved'));
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b: Book) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from('books').delete().eq('id', b.id);
    if (error) return toast.error(error.message);
    if (b.cover_path) await supabase.storage.from('book-covers').remove([b.cover_path]);
    toast.success(t('deleted'));
    load();
  };

  const onPickCover = (file: File | null) => {
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const onPasteCover = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find((tp) => tp.startsWith('image/'));
        if (type) {
          const blob = await it.getType(type);
          const file = new File([blob], `pasted.${type.split('/')[1]}`, { type });
          onPickCover(file);
          toast.success(t('saved'));
          return;
        }
      }
      toast.error('No image in clipboard');
    } catch (e: any) {
      toast.error(e.message ?? 'Clipboard error');
    }
  };

  const exportXlsx = () => {
    if (!books) return;
    const rows = books.map((b) => ({
      si_number: b.si_number,
      book_code: b.book_code,
      title_ar: b.title_ar,
      title_en: b.title_en,
      author: auts.find((a) => a.id === b.author_id)?.name_ar ?? '',
      publisher: pubs.find((p) => p.id === b.publisher_id)?.name_ar ?? '',
      category: cats.find((c) => c.id === b.category_id)?.name_ar ?? '',
      volume: b.volume,
      pages: b.pages,
      description_ar: b.description_ar,
      description_en: b.description_en,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    XLSX.writeFile(wb, `catalog-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const importXlsx = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws);
    const findId = (list: Lookup[], name: string) =>
      list.find((x) => x.name_ar === name || x.name_en === name)?.id ?? null;
    const payload = rows
      .filter((r) => r.title_ar || r.title_en)
      .map((r) => ({
        book_code: r.book_code ? String(r.book_code) : null,
        title_ar: String(r.title_ar ?? r.title_en ?? ''),
        title_en: r.title_en ? String(r.title_en) : null,
        description_ar: r.description_ar ? String(r.description_ar) : null,
        description_en: r.description_en ? String(r.description_en) : null,
        volume: r.volume ? String(r.volume) : null,
        pages: r.pages ? Number(r.pages) : null,
        category_id: r.category ? findId(cats, String(r.category)) : null,
        author_id: r.author ? findId(auts, String(r.author)) : null,
        publisher_id: r.publisher ? findId(pubs, String(r.publisher)) : null,
      }));
    if (!payload.length) return toast.error('No rows');
    const { error } = await supabase.from('books').insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t('importCount').replace('{n}', String(payload.length)));
    load();
  };

  if (!books) return <FullPageLoader />;

  const visible = books.filter((b) =>
    !query ||
    [b.title_ar, b.title_en, b.book_code].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder={t('searchBooks')} value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        <div className="flex-1" />
        <Button onClick={openNew} className="gap-1.5"><Plus className="w-4 h-4" />{t('addBook')}</Button>
        <Button variant="outline" onClick={() => xlsxRef.current?.click()} className="gap-1.5">
          <Upload className="w-4 h-4" />{t('bulkUpload')}
        </Button>
        <input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { importXlsx(f); e.target.value = ''; } }} />
        <Button variant="outline" onClick={exportXlsx} className="gap-1.5">
          <Download className="w-4 h-4" />{t('exportCatalog')}
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-start p-3">SI</th>
                <th className="text-start p-3">{t('bookCode')}</th>
                <th className="text-start p-3">{t('title')}</th>
                <th className="text-start p-3">{t('author')}</th>
                <th className="text-end p-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b.id} className="border-t hover:bg-accent/40">
                  <td className="p-3">{b.si_number ?? '—'}</td>
                  <td className="p-3">{b.book_code ?? '—'}</td>
                  <td className="p-3 font-medium">{b.title_ar}</td>
                  <td className="p-3">{auts.find((a) => a.id === b.author_id)?.name_ar ?? '—'}</td>
                  <td className="p-3 text-end">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(b)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">—</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? t('editBook') : t('addBook')}</DialogTitle></DialogHeader>

          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('bookCode')}><Input value={editing.book_code ?? ''} onChange={(e) => setEditing({ ...editing, book_code: e.target.value })} /></Field>
                <Field label={t('volume')}><Input value={editing.volume ?? ''} onChange={(e) => setEditing({ ...editing, volume: e.target.value })} /></Field>
                <Field label={t('titleAr')}><Input value={editing.title_ar ?? ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} /></Field>
                <Field label={t('titleEn')}><Input value={editing.title_en ?? ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} /></Field>
                <Field label={t('category')}>
                  <Select value={editing.category_id ?? 'none'} onValueChange={(v) => setEditing({ ...editing, category_id: v === 'none' ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('author')}>
                  <Select value={editing.author_id ?? 'none'} onValueChange={(v) => setEditing({ ...editing, author_id: v === 'none' ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {auts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('publisher')}>
                  <Select value={editing.publisher_id ?? 'none'} onValueChange={(v) => setEditing({ ...editing, publisher_id: v === 'none' ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {pubs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('pages')}><Input type="number" value={editing.pages ?? ''} onChange={(e) => setEditing({ ...editing, pages: e.target.value ? Number(e.target.value) : null })} /></Field>
              </div>
              <Field label={t('descAr')}><Textarea rows={3} value={editing.description_ar ?? ''} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} /></Field>
              <Field label={t('descEn')}><Textarea rows={3} value={editing.description_en ?? ''} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} /></Field>
              <Field label={t('readFullText')}><Textarea rows={4} value={editing.full_text ?? ''} onChange={(e) => setEditing({ ...editing, full_text: e.target.value })} /></Field>

              <div>
                <Label>{t('uploadCover')}</Label>
                <div className="mt-1.5 flex items-start gap-3">
                  <div className="w-24 h-32 rounded-lg overflow-hidden border bg-accent flex items-center justify-center">
                    {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground" />}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5"><Upload className="w-4 h-4" />{t('uploadCover')}</Button>
                    <Button type="button" variant="outline" size="sm" onClick={onPasteCover} className="gap-1.5"><Clipboard className="w-4 h-4" />{t('pasteFromClipboard')}</Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickCover(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>{t('cancel')}</Button>
            <Button onClick={save} disabled={saving}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
