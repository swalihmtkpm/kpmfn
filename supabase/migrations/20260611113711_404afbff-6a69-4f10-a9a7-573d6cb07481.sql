
-- Books status
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available'
  CHECK (status IN ('available','requested','borrowed','reserved','lost','damaged'));

-- Borrow Requests rework
ALTER TABLE public.borrow_requests
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS requester_type text CHECK (requester_type IN ('current_student','alumni','other')),
  ADD COLUMN IF NOT EXISTS requester_name text,
  ADD COLUMN IF NOT EXISTS requester_class text,
  ADD COLUMN IF NOT EXISTS requester_phone text,
  ADD COLUMN IF NOT EXISTS requester_place text,
  ADD COLUMN IF NOT EXISTS requester_address text,
  ADD COLUMN IF NOT EXISTS days_requested integer,
  ADD COLUMN IF NOT EXISTS expected_return_date date;

-- Borrow Records: allow anonymous
ALTER TABLE public.borrow_records
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS borrower_name text;

-- Reviews: allow anonymous
ALTER TABLE public.reviews
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS reviewer_name text;

-- Ratings: allow anonymous (drop unique user-book constraint)
ALTER TABLE public.ratings
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS rater_name text;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_book_id_user_id_key;

-- ============ GRANTS (anon = public site, authenticated = admins) ============
GRANT SELECT ON public.books, public.authors, public.publishers, public.categories,
  public.advertisements, public.library_settings, public.reviews, public.ratings TO anon, authenticated;
GRANT INSERT ON public.borrow_requests, public.reviews, public.ratings TO anon, authenticated;
GRANT ALL ON public.books, public.authors, public.publishers, public.categories,
  public.advertisements, public.library_settings, public.borrow_requests,
  public.borrow_records, public.reviews, public.ratings TO service_role;

-- ============ POLICIES ============
-- Drop the user-scoped policies that no longer apply
DROP POLICY IF EXISTS "users create own request" ON public.borrow_requests;
DROP POLICY IF EXISTS "users cancel own request" ON public.borrow_requests;
DROP POLICY IF EXISTS "view own or admin requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "users insert own review" ON public.reviews;
DROP POLICY IF EXISTS "users update own review" ON public.reviews;
DROP POLICY IF EXISTS "users delete own review or admin" ON public.reviews;
DROP POLICY IF EXISTS "view own or admin records" ON public.borrow_records;

-- borrow_requests
CREATE POLICY "anyone can submit borrow request" ON public.borrow_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins view requests" ON public.borrow_requests
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admins update requests" ON public.borrow_requests
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- reviews
CREATE POLICY "anyone read reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone submit review" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins delete reviews" ON public.reviews FOR DELETE TO authenticated USING (is_admin());

-- ratings
DROP POLICY IF EXISTS "ratings readable" ON public.ratings;
DROP POLICY IF EXISTS "users upsert own rating" ON public.ratings;
CREATE POLICY "anyone read ratings" ON public.ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone submit rating" ON public.ratings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- borrow_records
CREATE POLICY "admins read records" ON public.borrow_records FOR SELECT TO authenticated USING (is_admin());
