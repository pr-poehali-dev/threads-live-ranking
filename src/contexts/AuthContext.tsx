import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const AUTH_URL = 'https://functions.poehali.dev/65be31bc-44ff-4b94-8c1f-ab350a862b33';
const TOKEN_KEY = 'threadly_token';

export interface User {
  id: number;
  email: string;
  name: string;
  provider: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${AUTH_URL}?action=me`, { headers: { 'X-Auth-Token': token } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = async (action: 'login' | 'register', payload: Record<string, string>) => {
    const res = await fetch(`${AUTH_URL}?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  };

  const login = (email: string, password: string) => handleAuth('login', { email, password });
  const register = (email: string, password: string, name: string) =>
    handleAuth('register', { email, password, name });

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
