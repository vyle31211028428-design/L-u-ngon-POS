/**
 * AuthContext.tsx
 * Xác thực người dùng dựa trên PIN
 * Lưu trữ: user info, role, token, login state
 */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { Role } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthUser {
  id: string;
  name: string;
  role: Role;
  pinCode: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  isLocked: boolean;
  lockUntil: number | null;

  login: (pinCode: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const STORAGE_KEY = 'lau_ngon_auth';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in ms

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch (err) {
        console.error('Failed to parse stored auth:', err);
      }
    }
    setIsLoading(false);

    // Check lockout status
    const storedLockUntil = localStorage.getItem(`${STORAGE_KEY}_lockUntil`);
    if (storedLockUntil) {
      const lockTime = parseInt(storedLockUntil);
      if (lockTime > Date.now()) {
        setIsLocked(true);
        setLockUntil(lockTime);
      } else {
        localStorage.removeItem(`${STORAGE_KEY}_lockUntil`);
        localStorage.setItem(`${STORAGE_KEY}_attempts`, '0');
      }
    }

    const storedAttempts = localStorage.getItem(`${STORAGE_KEY}_attempts`);
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
  }, []);

  // Check lockout timer
  useEffect(() => {
    if (!isLocked || !lockUntil) return;

    const timer = setInterval(() => {
      if (Date.now() >= lockUntil) {
        setIsLocked(false);
        setLockUntil(null);
        setLoginAttempts(0);
        localStorage.removeItem(`${STORAGE_KEY}_lockUntil`);
        localStorage.setItem(`${STORAGE_KEY}_attempts`, '0');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockUntil]);

  const login = useCallback(
    async (pinCode: string) => {
      try {
        setError(null);

        // Check if account is locked
        if (isLocked && lockUntil && Date.now() < lockUntil) {
          const remainingMins = Math.ceil((lockUntil - Date.now()) / 60000);
          throw new Error(`Tài khoản bị khóa. Vui lòng thử lại sau ${remainingMins} phút`);
        }

        // Validate PIN format
        if (!pinCode || pinCode.length < 4) {
          throw new Error('Mã PIN phải ít nhất 4 ký tự');
        }

        setIsLoading(true);

        // Query database for employee with matching PIN
        const { data, error: dbError } = await supabase
          .from('employees')
          .select('id, name, role, pin_code, status')
          .eq('pin_code', pinCode)
          .eq('status', 'ACTIVE')
          .limit(1);

        if (dbError) throw dbError;

        if (!data || data.length === 0) {
          // Incorrect PIN - increment attempts
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          localStorage.setItem(`${STORAGE_KEY}_attempts`, newAttempts.toString());

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            // Lock account
            const lockTime = Date.now() + LOCKOUT_DURATION;
            setIsLocked(true);
            setLockUntil(lockTime);
            localStorage.setItem(`${STORAGE_KEY}_lockUntil`, lockTime.toString());
            throw new Error('Mã PIN sai quá nhiều lần. Tài khoản bị khóa 15 phút');
          }

          throw new Error(
            `Mã PIN không chính xác. Còn ${MAX_LOGIN_ATTEMPTS - newAttempts} lần thử`
          );
        }

        // Login successful
        const employee = data[0];
        const authUser: AuthUser = {
          id: employee.id,
          name: employee.name,
          role: employee.role as Role,
          pinCode: employee.pin_code,
        };

        setUser(authUser);
        setLoginAttempts(0);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        localStorage.setItem(`${STORAGE_KEY}_attempts`, '0');
        localStorage.removeItem(`${STORAGE_KEY}_lockUntil`);

        console.log('✅ Login successful:', authUser.name);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Login error:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isLocked, lockUntil, loginAttempts]
  );

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Logged out');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    loginAttempts,
    isLocked,
    lockUntil,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
