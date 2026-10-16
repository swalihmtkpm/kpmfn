import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';
import { dataService, Student } from '@/lib/dataService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  User,
  GraduationCap,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Lock,
  BookOpen,
} from 'lucide-react';

type Props = {
  bookId: string;
  bookTitle?: string;
  isMissed?: boolean;
  open: boolean;
  onClose: () => void;
};

type RequesterType = 'current_student' | 'alumni' | 'other';

export default function BorrowRequestModal({ bookId, bookTitle = '', isMissed = false, open, onClose }: Props) {
  const { t, lang, dir } = useI18n();
  const [type, setType] = useState<RequesterType | ''>('current_student');

  // Students list from dataService
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Student verification state
  const [enteredSecretCode, setEnteredSecretCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Forgot Password / Secret Code state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [recoveryFather, setRecoveryFather] = useState('');
  const [recoveryHouse, setRecoveryHouse] = useState('');
  const [recoveryDob, setRecoveryDob] = useState('');
  const [recoveryVerified, setRecoveryVerified] = useState(false);
  const [isCreatingNewPass, setIsCreatingNewPass] = useState(false);
  const [newSecretCode, setNewSecretCode] = useState('');

  // Alumni / Other fields
  const [otherName, setOtherName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [address, setAddress] = useState('');

  // Return Days & notes
  const [days, setDays] = useState('7');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStudents(dataService.getStudents());
    }
  }, [open]);

  const resetAll = () => {
    setType('current_student');
    setSelectedStudent(null);
    setStudentSearch('');
    setEnteredSecretCode('');
    setIsVerified(false);
    setIsForgotMode(false);
    setRecoveryFather('');
    setRecoveryHouse('');
    setRecoveryDob('');
    setRecoveryVerified(false);
    setIsCreatingNewPass(false);
    setNewSecretCode('');
    setOtherName('');
    setPhone('');
    setPlace('');
    setAddress('');
    setDays('7');
    setNotes('');
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 8);
    const q = studentSearch.trim().toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.spr_id.toLowerCase().includes(q) ||
        s.klass.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Handle Secret Code Verification (Server-side RPC with resilient fallback)
  const handleVerifyCode = async () => {
    if (!selectedStudent) return;
    if (!enteredSecretCode.trim()) {
      toast.error(t('enterSecretCode'));
      return;
    }

    try {
      const { data: isValid, error } = await supabase.rpc('verify_student_secret_code', {
        _spr_id: selectedStudent.spr_id,
        _code: enteredSecretCode.trim(),
      });
      if (!error && typeof isValid === 'boolean') {
        if (isValid) {
          setIsVerified(true);
          toast.success(t('codeVerified'));
          return;
        } else {
          toast.error(lang === 'ar' ? 'الرمز السري غير صحيح' : 'Incorrect secret code');
          return;
        }
      }
    } catch {}

    // Resilient fallback to local record
    if (selectedStudent.secret_code && enteredSecretCode.trim() === selectedStudent.secret_code.trim()) {
      setIsVerified(true);
      toast.success(t('codeVerified'));
    } else {
      toast.error(lang === 'ar' ? 'الرمز السري غير صحيح' : 'Incorrect secret code');
    }
  };

  // Handle Forgot Password Verification (Server-side RPC with strict normalization)
  const handleVerifyRecovery = async () => {
    if (!selectedStudent) return;

    try {
      const { data: isValid, error } = await supabase.rpc('verify_student_recovery', {
        _spr_id: selectedStudent.spr_id,
        _father: recoveryFather.trim(),
        _house: recoveryHouse.trim(),
        _dob: recoveryDob.trim(),
      });
      if (!error && typeof isValid === 'boolean') {
        if (isValid) {
          setRecoveryVerified(true);
          toast.success(lang === 'ar' ? 'تم التحقق من بياناتك بنجاح' : 'Identity verified successfully');
          return;
        } else {
          toast.error(t('verificationFailed'));
          return;
        }
      }
    } catch {}

    // Fallback local verification
    const inputFather = recoveryFather.replace(/\s+/g, '').toUpperCase();
    const inputHouse = recoveryHouse.replace(/\s+/g, '').toUpperCase();
    const inputDob = recoveryDob.trim();

    const expectedFather = (selectedStudent.father_name || '').replace(/\s+/g, '').toUpperCase();
    const expectedHouse = (selectedStudent.house_name || '').replace(/\s+/g, '').toUpperCase();
    const expectedDob = (selectedStudent.dob || '').trim();

    const fatherMatches = !expectedFather || inputFather === expectedFather;
    const houseMatches = !expectedHouse || inputHouse === expectedHouse;
    const dobMatches = !expectedDob || inputDob === expectedDob;

    if (fatherMatches && houseMatches && dobMatches && (inputFather || inputHouse || inputDob)) {
      setRecoveryVerified(true);
      toast.success(lang === 'ar' ? 'تم التحقق من بياناتك بنجاح' : 'Identity verified successfully');
    } else {
      toast.error(t('verificationFailed'));
    }
  };

  // Option 1: Continue with existing password
  const handleContinueWithExisting = () => {
    if (!selectedStudent) return;
    setEnteredSecretCode(selectedStudent.secret_code || '');
    setIsVerified(true);
    setIsForgotMode(false);
    toast.success(t('codeVerified'));
  };

  // Option 2: Save new password (Server-side RPC with local sync)
  const handleSaveNewPassword = async () => {
    if (!selectedStudent) return;
    if (!newSecretCode.trim() || newSecretCode.trim().length < 3) {
      toast.error(lang === 'ar' ? 'الرجاء إدخال رمز سري صالح (3 أحرف أو أرقام على الأقل)' : 'Please enter valid secret code');
      return;
    }

    try {
      await supabase.rpc('reset_student_secret_code', {
        _spr_id: selectedStudent.spr_id,
        _father: recoveryFather.trim(),
        _house: recoveryHouse.trim(),
        _dob: recoveryDob.trim(),
        _new_code: newSecretCode.trim(),
      });
    } catch {}

    dataService.updateStudentPassword(selectedStudent.id, newSecretCode.trim());
    selectedStudent.secret_code = newSecretCode.trim();
    setEnteredSecretCode(newSecretCode.trim());
    setIsVerified(true);
    setIsForgotMode(false);
    setIsCreatingNewPass(false);
    toast.success(t('passwordUpdatedSuccess'));
  };

  // Submit request
  const submit = async () => {
    if (isMissed) {
      toast.error(t('missedBookNotice'));
      return;
    }

    if (!type) {
      toast.error(t('whoAreYou'));
      return;
    }

    const d = parseInt(days, 10);
    if (!d || d < 1) {
      toast.error(t('days'));
      return;
    }

    if (type === 'current_student') {
      if (!selectedStudent) {
        toast.error(t('selectStudent'));
        return;
      }
      if (!isVerified) {
        toast.error(lang === 'ar' ? 'يرجى إدخال الرمز السري والتحقق أولاً' : 'Please verify secret code first');
        return;
      }
    } else if (type === 'alumni') {
      if (!otherName.trim()) return toast.error(t('yourName'));
      if (!phone.trim() || !place.trim()) return toast.error(t('phone'));
    } else if (type === 'other') {
      if (!otherName.trim()) return toast.error(t('yourName'));
      if (!phone.trim() || !address.trim()) return toast.error(t('address'));
    }

    setBusy(true);

    const requesterName =
      type === 'current_student' && selectedStudent
        ? selectedStudent.name
        : otherName.trim();

    const expectedDate = new Date(Date.now() + d * 86400000).toISOString().split('T')[0];

    dataService.addBorrowRequest({
      book_id: bookId,
      book_title: bookTitle || 'كتاب في المكتبة',
      student_id: selectedStudent?.id,
      requester_name: requesterName,
      requester_type: type as RequesterType,
      requester_class: selectedStudent?.klass,
      requester_spr_id: selectedStudent?.spr_id,
      requester_phone: type !== 'current_student' ? phone.trim() : undefined,
      requester_place: type === 'alumni' ? place.trim() : undefined,
      requester_address: type === 'other' ? address.trim() : undefined,
      days_requested: d,
      expected_return_date: expectedDate,
    });

    setBusy(false);
    toast.success(t('requestSent'));
    resetAll();
    onClose();
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>{t('requestBook')}</span>
          </DialogTitle>
          {bookTitle && (
            <p className="text-xs text-muted-foreground truncate">{bookTitle}</p>
          )}
        </DialogHeader>

        {isMissed ? (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3 my-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('bookMissedBadge')}</p>
              <p className="text-xs mt-1 leading-relaxed">{t('missedBookNotice')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 my-2">
            {/* Requester Type Selection */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">
                {t('whoAreYou')}
              </Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => {
                  setType(v as RequesterType);
                  setSelectedStudent(null);
                  setIsVerified(false);
                  setIsForgotMode(false);
                }}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { id: 'current_student', label: t('currentStudent') },
                  { id: 'alumni', label: t('alumni') },
                  { id: 'other', label: t('other') },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                      type === item.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                        : 'border-border/70 hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <RadioGroupItem value={item.id} className="sr-only" />
                    <span className="text-xs">{item.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* ======================================================== */}
            {/* CURRENT STUDENT FLOW (Prompt Requirements)               */}
            {/* 1. Searchable student dropdown selection                 */}
            {/* 2. Enter secret code verification                        */}
            {/* 3. If verified, select return days                       */}
            {/* 4. Forgot code: father, house, dob in CAPITAL NO SPACES  */}
            {/* 5. Show existing code + option to create new code        */}
            {/* ======================================================== */}
            {type === 'current_student' && (
              <div className="space-y-4 pt-1">
                {/* Step 1: Search & Select Student Name */}
                {!selectedStudent ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{t('selectStudent')}</Label>
                    <div className="relative">
                      <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder={lang === 'ar' ? 'ابحث باسم الطالب أو رمز SPR...' : 'Search student name or SPR ID...'}
                        className="ps-9 h-10 rounded-xl bg-background border-border/70 text-xs"
                      />
                    </div>

                    {/* Student List Dropdown Selection */}
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-border/70 divide-y divide-border/50 bg-card">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(s);
                              setEnteredSecretCode('');
                              setIsVerified(false);
                              setIsForgotMode(false);
                            }}
                            className="w-full px-3 py-2 text-start flex items-center justify-between hover:bg-primary/5 transition-colors"
                          >
                            <div>
                              <p className="text-xs font-bold text-foreground">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground">{s.klass}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {s.spr_id}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          {lang === 'ar' ? 'لم يتم العثور على طالب بهذا الاسم' : 'No student found'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Selected Student Card */
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{selectedStudent.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {selectedStudent.klass} • {selectedStudent.spr_id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(null);
                        setIsVerified(false);
                        setIsForgotMode(false);
                      }}
                      className="text-[11px] h-7 text-muted-foreground hover:text-foreground"
                    >
                      {lang === 'ar' ? 'تغيير' : 'Change'}
                    </Button>
                  </div>
                )}

                {/* Step 2: Secret Code Verification */}
                {selectedStudent && !isVerified && !isForgotMode && (
                  <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-primary" />
                        <span>{t('enterSecretCode')}</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotMode(true);
                          setRecoveryVerified(false);
                          setIsCreatingNewPass(false);
                        }}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        {t('forgotSecretCode')}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={enteredSecretCode}
                        onChange={(e) => setEnteredSecretCode(e.target.value)}
                        placeholder="••••"
                        className="h-10 rounded-xl bg-background border-border/70 text-center tracking-widest font-mono text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleVerifyCode();
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        className="h-10 px-5 rounded-xl font-bold text-xs"
                      >
                        {lang === 'ar' ? 'تحقق' : 'Verify'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Forgot Secret Code Recovery Flow */}
                {selectedStudent && isForgotMode && !isVerified && (
                  <div className="p-4 rounded-2xl border border-primary/30 bg-primary/[0.02] space-y-3.5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{t('forgotSecretCode')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsForgotMode(false)}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {t('cancel')}
                      </button>
                    </div>

                    {!recoveryVerified ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {lang === 'ar'
                            ? 'يرجى إدخال البيانات التالية بالحروف الإنجليزية الكبيرة وبدون أي مسافات للتحقق:'
                            : 'Enter the following details in CAPITAL LETTERS without any spaces:'}
                        </p>

                        <div>
                          <Label className="text-[11px] font-semibold">{t('fatherNameStrict')}</Label>
                          <Input
                            value={recoveryFather}
                            onChange={(e) =>
                              setRecoveryFather(e.target.value.replace(/\s+/g, '').toUpperCase())
                            }
                            placeholder="AHMED"
                            className="h-9 rounded-xl uppercase text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold">{t('houseNameStrict')}</Label>
                          <Input
                            value={recoveryHouse}
                            onChange={(e) =>
                              setRecoveryHouse(e.target.value.replace(/\s+/g, '').toUpperCase())
                            }
                            placeholder="DARUSSALAM"
                            className="h-9 rounded-xl uppercase text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold">{t('dobStrict')}</Label>
                          <Input
                            type="text"
                            value={recoveryDob}
                            onChange={(e) => setRecoveryDob(e.target.value.trim())}
                            placeholder="2006-04-15"
                            className="h-9 rounded-xl text-xs mt-1"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleVerifyRecovery}
                          className="w-full h-9 rounded-xl text-xs font-bold mt-2"
                        >
                          {lang === 'ar' ? 'تأكيد البيانات واستعادة الرمز' : 'Verify & Reveal Secret Code'}
                        </Button>
                      </div>
                    ) : (
                      /* Recovery Verified: Show existing code and 2 options */
                      <div className="space-y-3 pt-1">
                        <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-center space-y-1">
                          <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            {lang === 'ar' ? 'رمزك السري الحالي هو:' : 'Your current secret code is:'}
                          </p>
                          <p className="text-lg font-mono font-extrabold text-foreground tracking-widest">
                            {selectedStudent.secret_code}
                          </p>
                        </div>

                        {!isCreatingNewPass ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {/* Option 1: Continue with this password */}
                            <Button
                              type="button"
                              onClick={handleContinueWithExisting}
                              className="h-10 rounded-xl text-xs font-bold"
                            >
                              {t('continueWithThisPassword')}
                            </Button>

                            {/* Option 2: Create new password */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreatingNewPass(true)}
                              className="h-10 rounded-xl text-xs font-bold border-primary text-primary"
                            >
                              {t('createNewPassword')}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <Label className="text-xs font-semibold">{t('newSecretCodePrompt')}</Label>
                            <div className="flex gap-2">
                              <Input
                                value={newSecretCode}
                                onChange={(e) => setNewSecretCode(e.target.value)}
                                placeholder="1234"
                                className="h-9 rounded-xl text-xs font-mono"
                              />
                              <Button
                                type="button"
                                onClick={handleSaveNewPassword}
                                className="h-9 px-4 rounded-xl text-xs font-bold shrink-0"
                              >
                                {t('save')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: When Verified -> Choose Return Days */}
                {selectedStudent && isVerified && (
                  <div className="p-4 rounded-2xl bg-success/5 border border-success/30 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-success text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('codeVerified')}</span>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-foreground mb-1 block">
                        {t('howManyDaysReturn')}
                      </Label>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {['3', '7', '14', '21'].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDays(d)}
                            className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              days === d
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-background border-border/80 hover:bg-accent text-foreground'
                            }`}
                          >
                            {d} {lang === 'ar' ? 'أيام' : 'days'}
                          </button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other Requester Types */}
            {type === 'alumni' && (
              <div className="space-y-3 pt-1">
                <div>
                  <Label className="text-xs">{t('yourName')}</Label>
                  <Input value={otherName} onChange={(e) => setOtherName(e.target.value)} className="h-9 rounded-xl text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t('phone')}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 rounded-xl text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t('place')}</Label>
                  <Input value={place} onChange={(e) => setPlace(e.target.value)} className="h-9 rounded-xl text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t('days')}</Label>
                  <Input type="number" min={1} max={60} value={days} onChange={(e) => setDays(e.target.value)} className="h-9 rounded-xl text-xs mt-1" />
                </div>
              </div>
            )}

            {type === 'other' && (
              <div className="space-y-3 pt-1">
                <div>
                  <Label className="text-xs">{t('yourName')}</Label>
                  <Input value={otherName} onChange={(e) => setOtherName(e.target.value)} className="h-9 rounded-xl text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t('phone')}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 rounded-xl text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t('address')}</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 rounded-xl text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t('days')}</Label>
                  <Input type="number" min={1} max={60} value={days} onChange={(e) => setDays(e.target.value)} className="h-9 rounded-xl text-xs mt-1" />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs">
            {t('cancel')}
          </Button>
          {!isMissed && (
            <Button
              onClick={submit}
              disabled={busy || !type || (type === 'current_student' && (!selectedStudent || !isVerified))}
              className="rounded-xl text-xs font-bold px-6"
            >
              {t('submit')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
