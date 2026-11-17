import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { endpoints, session } from '@/lib/api/instance';
import type { User } from '@/lib/api/schemas';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthValue {
  status: Status;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string; birthDate?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Restaura la sesión guardada y valida el token contra /auth/me.
  useEffect(() => {
    let alive = true;
    (async () => {
      const tokens = await session.restore();
      if (!tokens) return alive && setStatus('signedOut');
      try {
        const { user: me } = await endpoints.auth.me();
        if (!alive) return;
        setUser(me);
        setStatus('signedIn');
      } catch {
        if (alive && !session.get()) setStatus('signedOut');
        else if (alive) setStatus('signedIn'); // sin red: se conserva la sesión
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Si el refresh falla (token revocado) se cierra la sesión.
  useEffect(
    () =>
      session.subscribe((t) => {
        if (!t) {
          setUser(null);
          setStatus('signedOut');
          queryClient.clear();
        }
      }),
    [queryClient],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await endpoints.auth.login(email.trim().toLowerCase(), password);
    await session.set({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    setUser(res.user);
    setStatus('signedIn');
  }, []);

  const signUp = useCallback(async (input: { email: string; password: string; fullName: string; birthDate?: string }) => {
    const res = await endpoints.auth.register({ ...input, email: input.email.trim().toLowerCase() });
    await session.set({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    setUser(res.user);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    const refresh = session.get()?.refreshToken;
    try {
      await endpoints.auth.logout(refresh);
    } catch {
      // cerrar sesión local aunque el servidor no responda
    }
    await session.set(null);
  }, []);

  const value = useMemo(() => ({ status, user, signIn, signUp, signOut }), [status, user, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
