import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

type Status = 'published' | 'unpublished';
type Ad = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  image_path: string | null;
  link_url: string | null;
  is_active: boolean;
  status?: Status;
  sort_order: number | null;
};

// We map status -> is_active. Stored status uses a JSON in link_url-less way: we use `link_url` for url and a virtual `status` derived from is_active + archived flag stored in title. To keep schema-compatible, treat: published = is_active true; archived = is_active false AND has cover; draft = is_active false AND no cover. Simpler: use a "status" column via link_url annotation. We'll use is_active + a prefix in link_url is fragile.
// Simpler: status === is_active ? 'published' : 'draft'. Archived = ends_at < now. We compute and update accordingly.

const MAX_ACTIVE = 10;

export default function AdsManager() {
  const { t } = useI18n();
  const [ads, setAds] = useState<Ad[]>([]);
  const [editing, setEditing] = useState<(Partial<Ad> & { status?: Status }) | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  const computeStatus = (a: Ad): Status => (a.is_active ? 'published' : 'unpublished');

  const load = async () => {
    const { data } = await supabase.from('advertisements').select('*').order('sort_order', { ascending: true });
    const list = (data ?? []) as Ad[];
    setAds(list);
    const entries = await Promise.all(
      list.filter((a) => a.image_path).map(async (a) => {
        const { data: s } = await supabase.storage.from('ad-images').createSignedUrl(a.image_path!, 3600);
        return [a.id, s?.signedUrl ?? ''] as const;
      })
    );
    setPreviews(new Map(entries.filter(([, u]) => u)));
  };
  useEffect(() => { load(); }, []);

  const activeCount = ads.filter((a) => a.is_active).length;

  const openNew = () => { setEditing({ status: 'published', is_active: true }); setImgFile(null); setImgPreview(null); };
  const openEdit = async (a: Ad) => {
    setEditing({ ...a, status: computeStatus(a) });
    setImgFile(null);
    setImgPreview(a.image_path ? previews.get(a.id) ?? null : null);
  };

  const save = async () => {
    if (!editing) return;
    const status = editing.status ?? 'published';
    if (status === 'published' && activeCount >= MAX_ACTIVE && !(editing.id && ads.find((a) => a.id === editing.id)?.is_active)) {
      toast.error(t('maxAds'));
      return;
    }
    let image_path = editing.image_path ?? null;
    if (imgFile) {
      const ext = imgFile.name.split('.').pop() || 'png';
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('ad-images').upload(path, imgFile, { contentType: imgFile.type });
      if (error) return toast.error(error.message);
      image_path = path;
    }
    const payload: any = {
      title_ar: editing.title_ar || null,
      title_en: editing.title_en || null,
      link_url: editing.link_url || null,
      image_path,
      is_active: status === 'published',
      sort_order: editing.sort_order ?? 0,
    };
    let err;
    if (editing.id) ({ error: err } = await supabase.from('advertisements').update(payload).eq('id', editing.id));
    else ({ error: err } = await supabase.from('advertisements').insert(payload));
    if (err) return toast.error(err.message);
    toast.success(t('saved'));
    setEditing(null);
    load();
  };

  const remove = async (a: Ad) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from('advertisements').delete().eq('id', a.id);
    if (error) return toast.error(error.message);
    if (a.image_path) await supabase.storage.from('ad-images').remove([a.image_path]);
    toast.success(t('deleted'));
    load();
  };

  const onPickImage = (file: File | null) => {
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t('maxAds')} — {activeCount}/{MAX_ACTIVE}</p>
        <Button onClick={openNew} className="gap-1.5"><Plus className="w-4 h-4" />{t('create')}</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ads.map((a) => {
          const s = computeStatus(a);
          return (
            <div key={a.id} className="border rounded-xl overflow-hidden bg-card">
              <div className="aspect-[16/9] bg-accent">
                {previews.get(a.id) ? <img src={previews.get(a.id)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold truncate">{a.title_ar || a.title_en || '—'}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s === 'published' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{t(s)}</span>
                </div>
                <div className="flex justify-end mt-2">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(a)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          );
        })}
        {ads.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground text-sm">—</div>}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? t('edit') : t('create')}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t('poster')}</Label>
                <div className="mt-1.5 flex items-start gap-3">
                  <div className="w-40 aspect-[16/9] rounded-lg overflow-hidden border bg-accent flex items-center justify-center">
                    {imgPreview ? <img src={imgPreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-7 h-7 text-muted-foreground" />}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5"><Upload className="w-4 h-4" />{t('uploadCover')}</Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0] ?? null)} />
                </div>
              </div>
              <div><Label className="text-xs">{t('titleAr')}</Label><Input value={editing.title_ar ?? ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} /></div>
              <div><Label className="text-xs">{t('titleEn')}</Label><Input value={editing.title_en ?? ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} /></div>
              <div><Label className="text-xs">{t('descAr')}</Label><Textarea rows={2} value={editing.link_url ?? ''} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} /></div>
              <div>
                <Label className="text-xs">{t('status')}</Label>
                <Select value={editing.status ?? 'published'} onValueChange={(v) => setEditing({ ...editing, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">{t('published')}</SelectItem>
                    <SelectItem value="unpublished">{t('unpublished')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
