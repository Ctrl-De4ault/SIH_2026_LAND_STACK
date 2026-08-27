import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { setToken, getToken } from "./api.js";

const AuthContext = createContext(null);

const STAFF_ROLES = ["patwari", "sub_registrar", "planner", "tax_officer", "admin", "national_steward"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // On mount, if we have a stored token, resolve the current user.
  useEffect(() => {
    let alive = true;
    async function bootstrap() {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const me = await api.auth.me();
        if (alive) setUser(me.user || me);
      } catch {
        setToken(null);
      } finally {
        if (alive) setReady(true);
      }
    }
    bootstrap();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.auth.login(email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const isStaff = Boolean(user && STAFF_ROLES.includes(user.role));

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { STAFF_ROLES };
