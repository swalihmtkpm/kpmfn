import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

type Row = { id: string; name_ar: string; name_en: string | null;[k: string]: any };
type Table = 'categories' | 'authors' | 'publishers';

export default function TaxonomyManager({ table }: { table: Table }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from(table).select('*').order('name_ar');
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, [table]);

  const save = async () => {
    if (!editing?.name_ar?.trim()) return toast.error(t('nameAr'));
    const payload: any = { name_ar: editing.name_ar, name_en: editing.name_en || null };
    let err;
    if (editing.id) ({ error: err } = await supabase.from(table).update(payload).eq('id', editing.id));
    else ({ error: err } = await supabase.from(table).insert(payload));
    if (err) return toast.error(err.message);
    toast.success(t('saved'));
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(t('deleted'));
    load();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name_ar: 'مثال', name_en: 'Example' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, table);
    XLSX.writeFile(wb, `${table}_template.xlsx`);
  };

  const bulkImport = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(ws);
    const rows = data.map((r) => ({
      name_ar: String(r.name_ar ?? r['الاسم'] ?? '').trim(),
      name_en: String(r.name_en ?? r['name'] ?? '').trim() || null,
    })).filter((r) => r.name_ar);
    if (!rows.length) return toast.error('No rows');
    const { error } = await supabase.from(table).insert(rows);
    if (error) return toast.error(error.message);
    toast.success(t('importCount').replace('{n}', String(rows.length)));
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5"><Download className="w-4 h-4" />{t('downloadTemplate')}</Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5"><Upload className="w-4 h-4" />{t('bulkUpload')}</Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && bulkImport(e.target.files[0])} />
        <Button onClick={() => setEditing({ name_ar: '', name_en: '' })} className="gap-1.5"><Plus className="w-4 h-4" />{t('create')}</Button>
      </div>
      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr><th className="text-start p-3">{t('nameAr')}</th><th className="text-start p-3">{t('nameEn')}</th><th className="text-end p-3">{t('actions')}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-accent/40">
                <td className="p-3 font-medium">{r.name_ar}</td>
                <td className="p-3 text-muted-foreground">{r.name_en ?? '—'}</td>
                <td className="p-3 text-end">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">—</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? t('edit') : t('create')}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label className="text-xs">{t('nameAr')}</Label><Input value={editing.name_ar ?? ''} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></div>
              <div><Label className="text-xs">{t('nameEn')}</Label><Input value={editing.name_en ?? ''} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
