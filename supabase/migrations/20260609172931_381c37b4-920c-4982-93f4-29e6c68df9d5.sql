
-- Tighten security-definer functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Storage policies
CREATE POLICY "auth read book-covers" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'book-covers');
CREATE POLICY "admin write book-covers" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'book-covers' AND public.is_admin())
  WITH CHECK (bucket_id = 'book-covers' AND public.is_admin());

CREATE POLICY "auth read ad-images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ad-images');
CREATE POLICY "admin write ad-images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ad-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'ad-images' AND public.is_admin());

CREATE POLICY "auth read author-photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'author-photos');
CREATE POLICY "admin write author-photos" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'author-photos' AND public.is_admin())
  WITH CHECK (bucket_id = 'author-photos' AND public.is_admin());

CREATE POLICY "auth read book-files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'book-files');
CREATE POLICY "admin write book-files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'book-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'book-files' AND public.is_admin());

CREATE POLICY "admin all store-files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'store-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'store-files' AND public.is_admin());
