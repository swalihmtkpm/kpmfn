import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword } from '@/lib/authCrypto';

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  must_change_password: boolean;
  preferred_language: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  setAdminSession: (val: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('imthiyaz_admin_session') === '1';
    }
    return false;
  });
  const [loading, setLoading] = useState(true);

  const setAdminSession = useCallback((val: boolean) => {
    if (val) {
      localStorage.setItem('imthiyaz_admin_session', '1');
      setIsAdmin(true);
    } else {
      localStorage.removeItem('imthiyaz_admin_session');
      setIsAdmin(false);
    }
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const isLocalAdmin = localStorage.getItem('imthiyaz_admin_session') === '1';
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    setProfile(prof as Profile | null);
    setIsAdmin(isLocalAdmin || !!roles?.some((r) => r.role === 'admin'));
  }, []);

  useEffect(() => {
    const isLocalAdmin = localStorage.getItem('imthiyaz_admin_session') === '1';
    if (isLocalAdmin) {
      setIsAdmin(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(localStorage.getItem('imthiyaz_admin_session') === '1');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn: AuthCtx['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUp: AuthCtx['signUp'] = async (email, password, username, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username, full_name: fullName ?? null },
      },
    });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    setAdminSession(false);
    await supabase.auth.signOut().catch(() => {});
  };

  const changePassword: AuthCtx['changePassword'] = async (newPassword) => {
    if (!newPassword || newPassword.length < 5) {
      return { error: 'Password must be at least 5 characters' };
    }

    try {
      // 1. Hash the new password with SHA-256 for persistent database storage
      const hashed = await hashPassword(newPassword);

      // 2. Persist to cloud permanent database (library_settings)
      await supabase.from('library_settings').upsert(
        {
          key: 'admin_security_config',
          value: {
            password_hash: hashed,
            updated_at: new Date().toISOString(),
            username: 'msoekutb',
          },
        },
        { onConflict: 'key' }
      );

      // 3. Cache locally for immediate offline/instant verification
      if (typeof window !== 'undefined') {
        localStorage.setItem('imthiyaz_admin_pw_hash', hashed);
      }

      // 4. If Supabase auth user exists, also update Supabase Auth & profile
      if (user) {
        await supabase.auth.updateUser({ password: newPassword }).catch(() => {});
        await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id).catch(() => {});
        await loadProfile(user.id).catch(() => {});
      }

      return {};
    } catch (e: any) {
      return { error: e?.message || 'Failed to update admin password' };
    }
  };

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  return (
    <Ctx.Provider value={{ user, session, profile, isAdmin, loading, setAdminSession, signIn, signUp, signOut, changePassword, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
