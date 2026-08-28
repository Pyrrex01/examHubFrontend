import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { api, configureApi } from '../api/client';
import { clearSession, readSession, writeSession } from '../api/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    configureApi({
      getToken: () => sessionRef.current?.token ?? null,
      onUnauthorized: () => {
        clearSession();
        setSession(null);
      },
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api.post('/auth/login', { email, password }, { auth: false });

    const next = { token: result.token, user: result.user };
    writeSession(next);
    setSession(next);

    return next.user;
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider.');
  }

  return context;
}
