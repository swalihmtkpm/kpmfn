DROP POLICY IF EXISTS "auth read book-covers" ON storage.objects;
DROP POLICY IF EXISTS "auth read ad-images" ON storage.objects;
DROP POLICY IF EXISTS "auth read author-photos" ON storage.objects;
DROP POLICY IF EXISTS "auth read book-files" ON storage.objects;

CREATE POLICY "public read book-covers" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'book-covers');
CREATE POLICY "public read ad-images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'ad-images');
CREATE POLICY "public read author-photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'author-photos');
CREATE POLICY "auth read book-files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'book-files');