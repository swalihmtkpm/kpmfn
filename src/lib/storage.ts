import { supabase } from '@/integrations/supabase/client';

const cache = new Map<string, { url: string; expires: number }>();

export async function signedCoverUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const key = `book-covers:${path}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.url;
  const { data } = await supabase.storage.from('book-covers').createSignedUrl(path, 60 * 60);
  if (!data?.signedUrl) return null;
  cache.set(key, { url: data.signedUrl, expires: now + 55 * 60 * 1000 });
  return data.signedUrl;
}
