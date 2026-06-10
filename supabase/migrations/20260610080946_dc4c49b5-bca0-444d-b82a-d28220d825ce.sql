
-- Add catalog fields to books
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS si_number BIGSERIAL,
  ADD COLUMN IF NOT EXISTS book_code TEXT,
  ADD COLUMN IF NOT EXISTS volume TEXT,
  ADD COLUMN IF NOT EXISTS full_text TEXT,
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ratings_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS books_si_number_key ON public.books(si_number);
CREATE UNIQUE INDEX IF NOT EXISTS books_book_code_key ON public.books(book_code) WHERE book_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS books_avg_rating_idx ON public.books(average_rating DESC);
CREATE INDEX IF NOT EXISTS books_title_ar_idx ON public.books(title_ar);

-- Recompute average rating for a book
CREATE OR REPLACE FUNCTION public.recompute_book_rating(_book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books b SET
    average_rating = COALESCE((SELECT ROUND(AVG(stars)::numeric, 2) FROM public.ratings WHERE book_id = _book_id), 0),
    ratings_count = COALESCE((SELECT COUNT(*) FROM public.ratings WHERE book_id = _book_id), 0)
  WHERE b.id = _book_id;
END; $$;

CREATE OR REPLACE FUNCTION public.ratings_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_book_rating(OLD.book_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_book_rating(NEW.book_id);
    IF TG_OP = 'UPDATE' AND OLD.book_id <> NEW.book_id THEN
      PERFORM public.recompute_book_rating(OLD.book_id);
    END IF;
    RETURN NEW;
  END IF;
END; $$;

DROP TRIGGER IF EXISTS trg_ratings_after_change ON public.ratings;
CREATE TRIGGER trg_ratings_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.ratings_after_change();
