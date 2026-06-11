import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

type Props = { bookId: string; open: boolean; onClose: () => void };
type RT = 'current_student' | 'alumni' | 'other';

export default function BorrowRequestModal({ bookId, open, onClose }: Props) {
  const { t } = useI18n();
  const [type, setType] = useState<RT | ''>('');
  const [name, setName] = useState('');
  const [klass, setKlass] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [address, setAddress] = useState('');
  const [days, setDays] = useState('7');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => { setType(''); setName(''); setKlass(''); setPhone(''); setPlace(''); setAddress(''); setDays('7'); setNotes(''); };

  const submit = async () => {
    if (!type) return toast.error(t('whoAreYou'));
    if (!name.trim()) return toast.error(t('yourName'));
    const d = parseInt(days, 10);
    if (!d || d < 1) return toast.error(t('days'));
    if (type === 'current_student' && !klass.trim()) return toast.error(t('class'));
    if (type === 'alumni' && (!phone.trim() || !place.trim())) return toast.error(t('phone'));
    if (type === 'other' && (!phone.trim() || !address.trim())) return toast.error(t('address'));

    setBusy(true);
    const expected = new Date(Date.now() + d * 86400_000).toISOString().split('T')[0];
    const { error } = await supabase.from('borrow_requests').insert({
      book_id: bookId,
      request_type: 'physical',
      requester_type: type,
      requester_name: name.trim(),
      requester_class: type === 'current_student' ? klass.trim() : null,
      requester_phone: type !== 'current_student' ? phone.trim() : null,
      requester_place: type === 'alumni' ? place.trim() : null,
      requester_address: type === 'other' ? address.trim() : null,
      days_requested: d,
      expected_return_date: expected,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t('requestSent'));
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t('requestBook')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">{t('whoAreYou')}</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as RT)} className="mt-2 space-y-1.5">
              {(['current_student', 'alumni', 'other'] as RT[]).map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
                  <RadioGroupItem value={v} /> {t(v as any)}
                </label>
              ))}
            </RadioGroup>
          </div>

          {type && (
            <>
              <Field label={t('yourName')} value={name} onChange={setName} />
              {type === 'current_student' && <Field label={t('class')} value={klass} onChange={setKlass} />}
              {type === 'alumni' && (<>
                <Field label={t('phone')} value={phone} onChange={setPhone} />
                <Field label={t('place')} value={place} onChange={setPlace} />
              </>)}
              {type === 'other' && (<>
                <Field label={t('phone')} value={phone} onChange={setPhone} />
                <Field label={t('address')} value={address} onChange={setAddress} />
              </>)}
              <div>
                <Label className="text-xs">{t('days')}</Label>
                <Input type="number" min={1} max={90} value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t('notes')}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={busy || !type}>{t('submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
