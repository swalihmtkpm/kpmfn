/**
 * Cryptographic helpers for admin authentication and password security.
 * Uses the standard Web Crypto API (SHA-256) supported in all modern browsers and Node environments.
 */

export async function hashPassword(password: string): Promise<string> {
  const clean = password.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(clean);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('crypto.subtle error, using fallback:', e);
    }
  }

  // Fallback for non-secure HTTP contexts if needed
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return 'legacy_' + Math.abs(hash).toString(16);
}

export async function verifyPassword(password: string, expectedHash: string): Promise<boolean> {
  if (!password || !expectedHash) return false;
  const hash = await hashPassword(password);
  return hash === expectedHash;
}
