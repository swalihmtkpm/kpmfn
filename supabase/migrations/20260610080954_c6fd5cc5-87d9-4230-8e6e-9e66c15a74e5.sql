
REVOKE ALL ON FUNCTION public.recompute_book_rating(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ratings_after_change() FROM PUBLIC, anon, authenticated;
