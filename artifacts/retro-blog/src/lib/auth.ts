import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createElement } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "blog_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Register the token getter so every API call includes the Authorization header
setAuthTokenGetter(() => getToken());

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: "USER" | "ADMIN" | "OWNER";
  avatarUrl?: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isOwner: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate token by fetching /api/auth/me
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u) setUser(u);
        else removeToken();
      })
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token: string, userData: AuthUser) => {
    setToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  const isAdmin = useCallback(() => {
    return user?.role === "ADMIN" || user?.role === "OWNER";
  }, [user]);

  const isOwner = useCallback(() => {
    return user?.role === "OWNER";
  }, [user]);

  return createElement(AuthContext.Provider, { value: { user, loading, login, logout, isAdmin, isOwner } }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
