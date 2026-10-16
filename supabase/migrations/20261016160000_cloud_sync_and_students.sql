-- Migration: 20261016160000_cloud_sync_and_students.sql
-- Description: Creates students table, privacy-safe directory view, secure RPC functions,
-- and ensures books table has full column compatibility for cloud synchronization.

-- 1. Extend books table with inline author/publisher/cover columns for full cloud sync
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS author_name_ar text,
  ADD COLUMN IF NOT EXISTS author_name_en text,
  ADD COLUMN IF NOT EXISTS publisher_name_ar text,
  ADD COLUMN IF NOT EXISTS publisher_name_en text,
  ADD COLUMN IF NOT EXISTS cover_url text;

-- 2. Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  klass text NOT NULL,
  spr_id text NOT NULL UNIQUE,
  secret_code text NOT NULL,
  father_name text,
  house_name text,
  dob text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to update updated_at on students
CREATE OR REPLACE TRIGGER students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Row Level Security for students: Admins manage all, Public cannot snoop passwords
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage all students" ON public.students;
CREATE POLICY "admins manage all students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT ALL ON public.students TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;

-- 4. Privacy-safe Students Directory View (Hides secret_code, father_name, house_name, dob)
CREATE OR REPLACE VIEW public.students_directory
WITH (security_invoker = false)
AS
  SELECT id, name, klass, spr_id, created_at
  FROM public.students;

GRANT SELECT ON public.students_directory TO anon, authenticated;

-- 5. Secure Verification & Recovery RPC Functions (Zero Exposure of Sensitive Data)
CREATE OR REPLACE FUNCTION public.verify_student_secret_code(
  _spr_id text,
  _code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.students
    WHERE UPPER(TRIM(spr_id)) = UPPER(TRIM(_spr_id))
      AND TRIM(secret_code) = TRIM(_code)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_student_recovery(
  _spr_id text,
  _father text,
  _house text,
  _dob text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _expected_father text;
  _expected_house text;
  _expected_dob text;
  _in_father text;
  _in_house text;
BEGIN
  SELECT
    UPPER(REGEXP_REPLACE(COALESCE(father_name, ''), '\s+', '', 'g')),
    UPPER(REGEXP_REPLACE(COALESCE(house_name, ''), '\s+', '', 'g')),
    TRIM(COALESCE(dob, ''))
  INTO _expected_father, _expected_house, _expected_dob
  FROM public.students
  WHERE UPPER(TRIM(spr_id)) = UPPER(TRIM(_spr_id));

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  _in_father := UPPER(REGEXP_REPLACE(COALESCE(_father, ''), '\s+', '', 'g'));
  _in_house := UPPER(REGEXP_REPLACE(COALESCE(_house, ''), '\s+', '', 'g'));

  RETURN (
    (_expected_father = '' OR _in_father = _expected_father) AND
    (_expected_house = '' OR _in_house = _expected_house) AND
    (_expected_dob = '' OR TRIM(_dob) = _expected_dob) AND
    (_in_father <> '' OR _in_house <> '' OR TRIM(_dob) <> '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_student_secret_code(
  _spr_id text,
  _father text,
  _house text,
  _dob text,
  _new_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_student_recovery(_spr_id, _father, _house, _dob) THEN
    RETURN false;
  END IF;

  UPDATE public.students
  SET secret_code = TRIM(_new_code),
      updated_at = now()
  WHERE UPPER(TRIM(spr_id)) = UPPER(TRIM(_spr_id));

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_student_secret_code(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_student_recovery(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_student_secret_code(text, text, text, text, text) TO anon, authenticated;

-- 6. Seed Core Categories (Safe Deduplication by slug)
INSERT INTO public.categories (id, name_ar, name_en, slug, icon, sort_order)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'الحديث الشريف وعلومه', 'Hadith & Its Sciences', 'hadith', 'BookOpen', 1),
  ('c0000002-0000-0000-0000-000000000002', 'الفقه الشافعي وأصوله', 'Shafi’i Fiqh & Usul', 'fiqh', 'Scale', 2),
  ('c0000003-0000-0000-0000-000000000003', 'التفسير وعلوم القرآن', 'Tafsir & Quranic Sciences', 'tafsir', 'Sparkles', 3),
  ('c0000004-0000-0000-0000-000000000004', 'السيرة النبوية والتاريخ', 'Prophetic Biography & History', 'seerah-history', 'Compass', 4),
  ('c0000005-0000-0000-0000-000000000005', 'العقيدة والتصوف', 'Aqeedah & Tasawwuf', 'aqeedah', 'Heart', 5),
  ('c0000006-0000-0000-0000-000000000006', 'اللغة العربية وآدابها', 'Arabic Language & Literature', 'arabic-language', 'Feather', 6)
ON CONFLICT (slug) DO NOTHING;

-- 7. Seed Initial Students (Safe Deduplication by spr_id)
INSERT INTO public.students (id, name, klass, spr_id, secret_code, father_name, house_name, dob)
VALUES
  ('s0000001-0000-0000-0000-000000000001', 'عبد الله بن أحمد الفلاني', 'الصف العاشر (ثانوي)', 'SPR0156', '4589', 'AHMED', 'DARUSSALAM', '2006-04-15'),
  ('s0000002-0000-0000-0000-000000000002', 'محمد زين الدين المليباري', 'الصف الحادي عشر (ثانوي)', 'SPR0157', '1234', 'ZAINUDDIN', 'ALHILAL', '2005-08-20'),
  ('s0000003-0000-0000-0000-000000000003', 'سالم بن عمر بافضل', 'الصف التاسع (متوسط)', 'SPR0158', '7788', 'OMAR', 'NOOR', '2007-11-10'),
  ('s0000004-0000-0000-0000-000000000004', 'علي بن أبي بكر السقاف', 'الصف الثاني عشر (ثانوي)', 'SPR0159', '9900', 'ABUBAKAR', 'ALBARAKAH', '2004-01-05')
ON CONFLICT (spr_id) DO NOTHING;

-- 8. Seed Initial Books (Safe Deduplication by book_code)
INSERT INTO public.books (
  id, si_number, book_code, title_ar, title_en, author_name_ar, author_name_en,
  publisher_name_ar, publisher_name_en, volume, pages, category_id,
  cover_url, status, average_rating, ratings_count, description_ar, description_en
)
VALUES
  (
    'b0000001-0000-0000-0000-000000000001', 1, 'KB-001',
    'صحيح البخاري - الجامع الصحيح المختصر', 'Sahih Al-Bukhari',
    'الإمام محمد بن إسماعيل البخاري', 'Imam Muhammad ibn Ismail al-Bukhari',
    'دار طوق النجاة - بيروت', 'Dar Tawq Al-Najat',
    '1-4', 1824, 'c0000001-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    'available', 5.0, 28,
    'أصح كتاب بعد كتاب الله عز وجل، يحوي آلاف الأحاديث النبوية الصحيحة المسندة.',
    'The most authentic collection of Hadith after the Holy Quran.'
  ),
  (
    'b0000002-0000-0000-0000-000000000002', 2, 'KB-002',
    'صحيح مسلم - المسند الصحيح', 'Sahih Muslim',
    'الإمام مسلم بن الحجاج النيسابوري', 'Imam Muslim ibn al-Hajjaj',
    'دار إحياء التراث العربي', 'Dar Ihya al-Turath',
    '1-5', 2150, 'c0000001-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    'available', 4.9, 22,
    'أحد أركان السنة النبوية الشريفة ومن أدق كتب الحديث ترتيباً وصحة.',
    'Renowned authentic hadith compilation known for rigorous classification.'
  ),
  (
    'b0000003-0000-0000-0000-000000000003', 3, 'KB-003',
    'فتح الباري بشرح صحيح البخاري', 'Fath al-Bari Commentary on Sahih al-Bukhari',
    'الحافظ ابن حجر العسقلاني', 'Ibn Hajar al-Asqalani',
    'دار المعرفة - بيروت', 'Dar al-Ma’rifah',
    '1-13', 6540, 'c0000001-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    'available', 4.9, 19,
    'أعظم شروح صحيح البخاري وأجمعها، موسوعة إسلامية شاملة.',
    'Monumental 13-volume commentary on Sahih al-Bukhari.'
  ),
  (
    'b0000004-0000-0000-0000-000000000004', 4, 'KB-004',
    'منهاج الطالبين وعمدة المفتين', 'Minhaj al-Talibin wa Umdat al-Muftin',
    'الإمام يحيى بن شرف النووي', 'Imam Yahya ibn Sharaf al-Nawawi',
    'دار المنهاج - جدة', 'Dar al-Minhaj',
    '1', 620, 'c0000002-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
    'available', 4.8, 17,
    'المعتمد الأساسي في الفتوى وتدريس الفقه الشافعي في سائر أقطار العالم الإسلامي.',
    'The definitive classical manual of Shafi’i jurisprudence.'
  ),
  (
    'b0000005-0000-0000-0000-000000000005', 5, 'KB-005',
    'إحياء علوم الدين', 'Ihya Ulum al-Din',
    'حجة الإسلام الإمام أبو حامد الغزالي', 'Imam Abu Hamid al-Ghazali',
    'دار ابن حزم - بيروت', 'Dar Ibn Hazm',
    '1-4', 2480, 'c0000005-0000-0000-0000-000000000005',
    'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=80',
    'available', 4.8, 15,
    'تحفة علم السلوك وتزكية النفس، يجمع بين الفقه وبواطن الإيمان والأخلاق.',
    'The Revival of the Religious Sciences by Imam Ghazali.'
  ),
  (
    'b0000006-0000-0000-0000-000000000006', 6, 'KB-006',
    'تفسير القرآن العظيم (تفسير ابن كثير)', 'Tafsir Ibn Kathir',
    'الحافظ عماد الدين إسماعيل بن كثير', 'Ismail ibn Kathir',
    'دار طيبة للنشر والتوزيع', 'Dar Taybah',
    '1-8', 4100, 'c0000003-0000-0000-0000-000000000003',
    'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
    'available', 4.7, 14,
    'أشهر تفاسير القرآن بالمأثور وأوثقها بياناً لآيات الذكر الحكيم.',
    'Classic exegesis of the Quran by Ibn Kathir.'
  ),
  (
    'b0000007-0000-0000-0000-000000000007', 7, 'KB-007',
    'الرحيق المختوم في سيرة النبي المأمون', 'The Sealed Nectar',
    'الشيخ صفي الرحمن المباركفوري', 'Safiur Rahman al-Mubarakpuri',
    'دار الهلال - بيروت', 'Dar al-Hilal',
    '1', 520, 'c0000004-0000-0000-0000-000000000004',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
    'available', 4.7, 12,
    'الكتاب الحائز على الجائزة الأولى في مسابقة السيرة النبوية العالمية.',
    'Award-winning biography of Prophet Muhammad (peace be upon him).'
  ),
  (
    'b0000008-0000-0000-0000-000000000008', 8, 'KB-008',
    'رياض الصالحين من كلام سيد المرسلين', 'Riyad as-Salihin',
    'الإمام يحيى بن شرف النووي', 'Imam Yahya ibn Sharaf al-Nawawi',
    'دار المنهاج - بيروت', 'Dar al-Minhaj',
    '1', 680, 'c0000001-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80',
    'available', 4.6, 10,
    'كتاب جامع للأحاديث الصحيحة في الرقائق والآداب والأذكار وسائر أبواب الخير.',
    'The Gardens of the Righteous by Imam an-Nawawi.'
  ),
  (
    'b0000009-0000-0000-0000-000000000009', 9, 'KB-009',
    'فتح المعين بشرح قرة العين بمهمات الدين', 'Fath al-Muin bi Sharh Qurrat al-Ayn',
    'العلامة زين الدين أحمد بن عبد العزيز المليباري', 'Zainuddin Ahmad al-Malibari',
    'دار الفكر - بيروت', 'Dar al-Fikr',
    '1', 450, 'c0000002-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
    'available', 4.6, 9,
    'المرجع الفقهي الشافعي الأبرز الذي درسه طلاب العلم عبر القرون.',
    'Famous classic manual in Shafi’i jurisprudence by Sheikh Zainuddin.'
  ),
  (
    'b000000a-0000-0000-0000-000000000010', 10, 'KB-010',
    'مخطوطة النحو الوافي - نسخة نادرة', 'Al-Nahw Al-Wafi Rare Manuscript',
    'عباس حسن النحوي', 'Abbas Hasan',
    'دار المعارف - القاهرة', 'Dar al-Maarif',
    '1', 580, 'c0000006-0000-0000-0000-000000000006',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
    'missed', 4.5, 8,
    'كتاب في قواعد النحو العربي. تم الإبلاغ عن فقدان هذه النسخة من القاعة الرئيسية.',
    'Arabic grammar text. Reported missed from main hall.'
  )
ON CONFLICT (book_code) DO NOTHING;
