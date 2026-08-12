REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

DROP POLICY IF EXISTS "active ads readable" ON public.advertisements;

CREATE POLICY "public read active ads"
ON public.advertisements FOR SELECT
TO anon, authenticated
USING (
  is_active
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

CREATE POLICY "admins read all ads"
ON public.advertisements FOR SELECT
TO authenticated
USING (public.is_admin());

GRANT SELECT ON public.advertisements TO anon;