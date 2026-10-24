import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, clearToken, getStoredUser, type LoginResponse } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  institution?: string;
  degree?: string;
  wallet?: string;
  year?: string;
  avatar?: string;
  studentId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const roleRoutes: Record<string, string> = {
  Admin: '/admin',
  Faculty: '/admin',
  Student: '/student',
  Recruiter: '/verify',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setUser(result.user);
    const route = roleRoutes[result.user.role] ?? '/student';
    navigate(route);
    return result;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
