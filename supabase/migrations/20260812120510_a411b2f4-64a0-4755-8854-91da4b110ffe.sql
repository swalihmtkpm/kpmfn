CREATE POLICY "public read active borrow records" ON public.borrow_records FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.borrow_records TO anon;