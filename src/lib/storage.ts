import { supabase } from '@/integrations/supabase/client';

export function publicCoverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from('book-covers').getPublicUrl(path).data.publicUrl;
}

export function publicAdUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from('ad-images').getPublicUrl(path).data.publicUrl;
}

// Backwards-compatible signed url (kept for any callers still using it)
export async function signedCoverUrl(path: string | null | undefined): Promise<string | null> {
  return publicCoverUrl(path);
}
