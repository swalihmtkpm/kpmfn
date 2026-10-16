import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { dataService, Banner, convertDriveUrl } from '@/lib/dataService';

export default function BannersManager() {
  const { t, lang } = useI18n();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setBanners(dataService.getBanners());
  };

  useEffect(() => {
    reload();
  }, []);

  const openNew = () => {
    setEditing({
      type: 'image',
      media_url: '',
      title_ar: '',
      title_en: '',
      subtitle_ar: '',
      subtitle_en: '',
      is_active: true,
      sort_order: banners.length + 1,
    });
  };

  const openEdit = (b: Banner) => {
    setEditing({ ...b });
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.media_url?.trim()) {
      toast.error(lang === 'ar' ? 'يرجى إدخال رابط Google Drive' : 'Please enter Google Drive URL');
      return;
    }

    setSaving(true);
    try {
      dataService.saveBanner({
        id: editing.id,
        type: editing.type || 'image',
        media_url: editing.media_url.trim(),
        title_ar: editing.title_ar?.trim() || '',
        title_en: editing.title_en?.trim() || '',
        subtitle_ar: editing.subtitle_ar?.trim() || '',
        subtitle_en: editing.subtitle_en?.trim() || '',
        is_active: editing.is_active ?? true,
        sort_order: Number(editing.sort_order) || 1,
      });

      toast.success(t('saved'));
      setEditing(null);
      reload();
    } catch (e: any) {
      toast.error(e.message || 'Error saving banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (b: Banner) => {
    if (!confirm(t('confirmDelete'))) return;
    dataService.deleteBanner(b.id);
    toast.success(t('deleted'));
    reload();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-foreground">{t('banners')}</h2>
          <p className="text-xs text-muted-foreground">
            {lang === 'ar'
              ? 'مدة العرض: 3 ثوانٍ لكل صورة، ولمقاطع الفيديو تستمر الشريحة طوال مدة تشغيل الفيديو.'
              : 'Slideshow duration: 3 seconds for images, video duration for videos.'}
          </p>
        </div>
        <Button onClick={openNew} className="gap-1.5 h-10 rounded-xl text-xs font-bold">
          <Plus className="w-4 h-4" />
          <span>{t('addBanner')}</span>
        </Button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b) => {
          const mediaSrc = convertDriveUrl(b.media_url, b.type);
          const title = lang === 'ar' ? b.title_ar : b.title_en || b.title_ar;
          const subtitle = lang === 'ar' ? b.subtitle_ar : b.subtitle_en || b.subtitle_ar;

          return (
            <div
              key={b.id}
              className="border border-border/70 rounded-2xl overflow-hidden bg-card shadow-sm flex flex-col justify-between"
            >
              {/* Media Preview Aspect Frame */}
              <div className="relative aspect-[21/9] bg-black overflow-hidden flex items-center justify-center">
                {b.type === 'video' ? (
                  mediaSrc.includes('drive.google.com/file') ? (
                    <iframe src={mediaSrc} className="w-full h-full object-cover pointer-events-none" title="Video" />
                  ) : (
                    <video src={mediaSrc} muted className="w-full h-full object-cover pointer-events-none" />
                  )
                ) : (
                  <img src={mediaSrc} alt="" className="w-full h-full object-cover" />
                )}

                {/* Type Badge */}
                <div className="absolute top-2 start-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-sm text-[10px] font-bold flex items-center gap-1">
                    {b.type === 'video' ? <Video className="w-3 h-3 text-red-400" /> : <ImageIcon className="w-3 h-3 text-primary" />}
                    <span>{b.type === 'video' ? t('video') : t('image')}</span>
                  </span>
                </div>

                {/* Duration Badge */}
                <div className="absolute top-2 end-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-sm text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{b.type === 'video' ? (lang === 'ar' ? 'مدة الفيديو' : 'Video Duration') : '3s'}</span>
                  </span>
                </div>
              </div>

              {/* Banner Details & Text */}
              <div className="p-3.5 space-y-2">
                <div>
                  <h4 className="font-extrabold text-sm text-foreground line-clamp-1">
                    {title || (lang === 'ar' ? '(بدون عنوان)' : '(No title)')}
                  </h4>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{subtitle}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                    {b.media_url}
                  </span>
                  <div className="flex items-center gap-1">
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
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {banners.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            {lang === 'ar' ? 'لا توجد بانرات مسجلة' : 'No banners yet'}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT BANNER MODAL                                  */}
      {/* ======================================================== */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span>{editing?.id ? t('editBanner') : t('addBanner')}</span>
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-1 text-xs">
              {/* Media Type Selection: Image or Video */}
              <div>
                <Label className="text-xs font-bold">{t('mediaType')}</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, type: 'image' })}
                    className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                      editing.type === 'image'
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card border-border/70 hover:bg-accent'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{t('image')} (3s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, type: 'video' })}
                    className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                      editing.type === 'video'
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card border-border/70 hover:bg-accent'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>{t('video')} ({lang === 'ar' ? 'مدة الفيديو' : 'Video Duration'})</span>
                  </button>
                </div>
              </div>

              {/* Google Drive URL Input ONLY (Prompt requirement) */}
              <div className="p-3 rounded-2xl border border-border/70 bg-secondary/30 space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-primary" />
                  <span>{t('driveUrl')} *</span>
                </Label>
                <Input
                  value={editing.media_url || ''}
                  onChange={(e) => setEditing({ ...editing, media_url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/1example.../view"
                  className="h-9 rounded-xl text-xs bg-background"
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {lang === 'ar'
                    ? 'ضع رابط Google Drive لأي صورة أو فيديو، وسيقوم النظام تلقائياً بتحويله للعرض المباشر.'
                    : 'Paste a Google Drive link. The system will convert it automatically.'}
                </p>

                {/* Instant Media Preview */}
                {editing.media_url && (
                  <div className="mt-2 relative aspect-[21/9] rounded-xl overflow-hidden bg-black border border-border/70 flex items-center justify-center">
                    {editing.type === 'video' ? (
                      <div className="text-white text-xs flex items-center gap-2">
                        <Video className="w-5 h-5 text-primary" />
                        <span>{lang === 'ar' ? 'فيديو جاهز للعرض' : 'Video ready for slideshow'}</span>
                      </div>
                    ) : (
                      <img
                        src={convertDriveUrl(editing.media_url, 'image')}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Optional Title (Arabic & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">{t('titleAr')} ({lang === 'ar' ? 'اختياري' : 'Optional'})</Label>
                  <Input
                    value={editing.title_ar || ''}
                    onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })}
                    placeholder="مكتبة الامتياز"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t('titleEn')} ({lang === 'ar' ? 'اختياري' : 'Optional'})</Label>
                  <Input
                    value={editing.title_en || ''}
                    onChange={(e) => setEditing({ ...editing, title_en: e.target.value })}
                    placeholder="Imthiyaz Library"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              {/* Optional Subtitles (Arabic & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">{t('subtitleAr')}</Label>
                  <Input
                    value={editing.subtitle_ar || ''}
                    onChange={(e) => setEditing({ ...editing, subtitle_ar: e.target.value })}
                    placeholder="منارة المعرفة والقراءة"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t('subtitleEn')}</Label>
                  <Input
                    value={editing.subtitle_en || ''}
                    onChange={(e) => setEditing({ ...editing, subtitle_en: e.target.value })}
                    placeholder="Beacon of Knowledge"
                    className="h-9 rounded-xl text-xs mt-1"
                  />
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
    </div>
  );
}
