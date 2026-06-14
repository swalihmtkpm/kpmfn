import { supabase } from '@/integrations/supabase/client';

const EXPIRY = 60 * 60 * 24 * 7; // 7 days

export async function signedCoverUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from('book-covers').createSignedUrl(path, EXPIRY);
  return data?.signedUrl ?? null;
}

export async function signedAdUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from('ad-images').createSignedUrl(path, EXPIRY);
  return data?.signedUrl ?? null;
}

export async function signedCoverUrls(paths: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  const valid = paths.filter(Boolean);
  if (!valid.length) return m;
  const { data } = await supabase.storage.from('book-covers').createSignedUrls(valid, EXPIRY);
  (data ?? []).forEach((d: any) => { if (d.path && d.signedUrl) m.set(d.path, d.signedUrl); });
  return m;
}

// Backwards-compat (some files still import these)
export const publicCoverUrl = (_: string | null | undefined): string | null => null;
export const publicAdUrl = (_: string | null | undefined): string | null => null;
