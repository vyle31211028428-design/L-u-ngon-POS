/**
 * LoginView.tsx
 * Màn hình đăng nhập bằng Tên đăng nhập + Mã PIN
 * - Input tên đăng nhập
 * - Input PIN (che dấu ký tự)
 * - Rate limiting feedback
 * - Redirect theo role sau khi đăng nhập
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, Clock } from 'lucide-react';

const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, loginAttempts, isLocked, lockUntil, user, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin',
        STAFF: '/staff',
        KITCHEN: '/kitchen',
        CASHIER: '/cashier',
      };
      const route = roleRoutes[user.role] || '/';
      navigate(route, { replace: true });
    }
  }, [user, navigate]);

  // Update remaining lockout time
  useEffect(() => {
    if (!isLocked || !lockUntil) return;

    const timer = setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining > 0) {
        setRemainingTime(remaining);
      } else {
        setRemainingTime(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(username, pinCode);
      setUsername('');
      setPinCode('');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPinCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lẩu Ngon POS</h1>
          <p className="text-gray-600">Đăng nhập bằng Tên đăng nhập và Mã PIN</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Lockout Warning */}
          {isLocked && remainingTime !== null && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Tài khoản bị khóa</p>
                <p className="text-sm text-yellow-700">
                  Vui lòng thử lại sau {Math.floor(remainingTime / 60)} phút {remainingTime % 60} giây
                </p>
              </div>
            </div>
          )}

          {/* Attempt Counter */}
          {loginAttempts > 0 && loginAttempts < 5 && !isLocked && (
            <p className="text-sm text-orange-600 text-center">
              Còn {5 - loginAttempts} lần thử
            </p>
          )}

          {/* Username Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              disabled={isLocked || isLoading}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              autoFocus
            />
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mã PIN</label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pinCode}
                onChange={handlePinInput}
                placeholder="Nhập mã PIN của bạn"
                disabled={isLocked || isLoading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-center text-2xl tracking-widest disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                {showPin ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLocked || username.trim().length === 0 || pinCode.length < 4}
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin">⏳</div>
            )}
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Footer Info */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Lẩu Ngon Restaurant POS System v1.0
        </p>
      </div>
    </div>
  );
};

export default LoginView;
