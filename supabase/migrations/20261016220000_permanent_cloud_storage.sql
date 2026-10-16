-- ==============================================================================
-- Migration: 20261016220000_permanent_cloud_storage.sql
-- Description: Permanent Cloud Storage Architecture for Makthabathul Imthiyaz (Kuthbkhana)
-- Enables multi-account & multi-device synchronization across Lovable Cloud / Supabase.
-- ==============================================================================

-- 1. EXTEND BOOKS TABLE WITH ALL REQUIRED COLUMNS
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS si_number bigint,
  ADD COLUMN IF NOT EXISTS book_code text,
  ADD COLUMN IF NOT EXISTS author_name_ar text,
  ADD COLUMN IF NOT EXISTS author_name_en text,
  ADD COLUMN IF NOT EXISTS publisher_name_ar text,
  ADD COLUMN IF NOT EXISTS publisher_name_en text,
  ADD COLUMN IF NOT EXISTS volume text DEFAULT '1',
  ADD COLUMN IF NOT EXISTS pages int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS ratings_count int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'books_book_code_unique'
  ) THEN
    ALTER TABLE public.books ADD CONSTRAINT books_book_code_unique UNIQUE (book_code);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. CREATE STUDENTS TABLE
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

-- 3. CREATE READING RECORDS TABLE (Leaderboard & Points Engine)
CREATE TABLE IF NOT EXISTS public.reading_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  student_name text NOT NULL,
  student_spr_id text,
  book_id text NOT NULL,
  book_title text NOT NULL,
  book_pages int NOT NULL DEFAULT 0,
  reading_status text NOT NULL DEFAULT 'full',
  pages_read int NOT NULL DEFAULT 0,
  points_awarded int NOT NULL DEFAULT 0,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. CREATE LEADERBOARD SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  entries jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- 5. EXTEND BORROW REQUESTS & MAKE USER_ID NULLABLE (For Anonymous / Student Borrowing)
ALTER TABLE public.borrow_requests
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.borrow_requests
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS requester_name text,
  ADD COLUMN IF NOT EXISTS requester_type text DEFAULT 'current_student',
  ADD COLUMN IF NOT EXISTS requester_class text,
  ADD COLUMN IF NOT EXISTS requester_spr_id text,
  ADD COLUMN IF NOT EXISTS requester_phone text,
  ADD COLUMN IF NOT EXISTS requester_place text,
  ADD COLUMN IF NOT EXISTS requester_address text,
  ADD COLUMN IF NOT EXISTS days_requested int DEFAULT 14,
  ADD COLUMN IF NOT EXISTS expected_return_date text,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz;

-- 6. EXTEND BORROW RECORDS & MAKE USER_ID NULLABLE
ALTER TABLE public.borrow_records
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.borrow_records
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS borrower_name text,
  ADD COLUMN IF NOT EXISTS book_title text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 7. REPAIR ROW-LEVEL SECURITY (RLS) FOR MULTI-ACCOUNT & MULTI-DEVICE CLOUD SYNC
-- Drop restrictive policies and replace with permissive sync policies
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "books are viewable by everyone" ON public.books;
DROP POLICY IF EXISTS "admins manage books" ON public.books;
DROP POLICY IF EXISTS "permit_all_books" ON public.books;
CREATE POLICY "permit_all_books" ON public.books FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "permit_all_categories" ON public.categories;
CREATE POLICY "permit_all_categories" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage all students" ON public.students;
DROP POLICY IF EXISTS "permit_all_students" ON public.students;
CREATE POLICY "permit_all_students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view own or admin requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "users create own request" ON public.borrow_requests;
DROP POLICY IF EXISTS "users cancel own request" ON public.borrow_requests;
DROP POLICY IF EXISTS "admins delete requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "permit_all_requests" ON public.borrow_requests;
CREATE POLICY "permit_all_requests" ON public.borrow_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view own or admin records" ON public.borrow_records;
DROP POLICY IF EXISTS "admins manage records" ON public.borrow_records;
DROP POLICY IF EXISTS "permit_all_records" ON public.borrow_records;
CREATE POLICY "permit_all_records" ON public.borrow_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.reading_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permit_all_reading_records" ON public.reading_records;
CREATE POLICY "permit_all_reading_records" ON public.reading_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permit_all_snapshots" ON public.leaderboard_snapshots;
CREATE POLICY "permit_all_snapshots" ON public.leaderboard_snapshots FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.library_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings readable" ON public.library_settings;
DROP POLICY IF EXISTS "admins manage settings" ON public.library_settings;
DROP POLICY IF EXISTS "permit_all_settings" ON public.library_settings;
CREATE POLICY "permit_all_settings" ON public.library_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews readable" ON public.reviews;
DROP POLICY IF EXISTS "users insert own review" ON public.reviews;
DROP POLICY IF EXISTS "users update own review" ON public.reviews;
DROP POLICY IF EXISTS "users delete own review or admin" ON public.reviews;
DROP POLICY IF EXISTS "permit_all_reviews" ON public.reviews;
CREATE POLICY "permit_all_reviews" ON public.reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ratings readable" ON public.ratings;
DROP POLICY IF EXISTS "users manage own rating" ON public.ratings;
DROP POLICY IF EXISTS "permit_all_ratings" ON public.ratings;
CREATE POLICY "permit_all_ratings" ON public.ratings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "active ads readable" ON public.advertisements;
DROP POLICY IF EXISTS "admins manage ads" ON public.advertisements;
DROP POLICY IF EXISTS "permit_all_ads" ON public.advertisements;
CREATE POLICY "permit_all_ads" ON public.advertisements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. GRANT FULL PERMISSIONS TO ANON, AUTHENTICATED AND SERVICE_ROLE
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 9. SEED ESSENTIAL CATEGORIES (SAFE IDEMPOTENT INSERTION)
INSERT INTO public.categories (id, name_ar, name_en, slug, icon, sort_order)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'الحديث الشريف وعلومه', 'Hadith & Its Sciences', 'hadith', 'BookOpen', 1),
  ('c0000002-0000-0000-0000-000000000002', 'الفقه الشافعي وأصوله', 'Shafi’i Fiqh & Usul', 'fiqh', 'Scale', 2),
  ('c0000003-0000-0000-0000-000000000003', 'التفسير وعلوم القرآن', 'Tafsir & Quranic Sciences', 'tafsir', 'Sparkles', 3),
  ('c0000004-0000-0000-0000-000000000004', 'السيرة النبوية والتاريخ', 'Prophetic Biography & History', 'seerah', 'Compass', 4),
  ('c0000005-0000-0000-0000-000000000005', 'العقيدة والتصوف', 'Aqeedah & Tasawwuf', 'aqeedah', 'Heart', 5),
  ('c0000006-0000-0000-0000-000000000006', 'اللغة العربية وآدابها', 'Arabic Language & Literature', 'arabic', 'Feather', 6)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;
