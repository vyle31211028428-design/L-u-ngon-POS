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
import { Lock, AlertCircle, Clock, Eye, EyeOff, User, KeyRound, ChefHat, UtensilsCrossed } from 'lucide-react';

const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, loginAttempts, isLocked, lockUntil, user, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isCustomer, setIsCustomer] = useState(false);

  // Generate table list (12 tables)
  const tableList = Array.from({ length: 12 }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Bàn ${i + 1}`,
  }));

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

  const handleCustomerSelect = (tableId: string) => {
    navigate(`/ban/${tableId}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg relative z-10">
        {/* Header Card */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl mb-4 sm:mb-6 animate-bounce border-2 border-red-200">
            <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-2 sm:mb-3">Lẩu Ngon</h1>
          <p className="text-base sm:text-lg font-bold text-red-600 drop-shadow">POS Management System</p>
        </div>

        {/* Role Selection Toggle */}
        <div className="flex gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => {
              setIsCustomer(false);
              setUsername('');
              setPinCode('');
            }}
            className={`flex-1 py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
              !isCustomer
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <KeyRound size={18} className="sm:w-5 sm:h-5" />
            <span>Nhân viên</span>
          </button>
          <button
            onClick={() => setIsCustomer(true)}
            className={`flex-1 py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
              isCustomer
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <UtensilsCrossed size={18} className="sm:w-5 sm:h-5" />
            <span>Khách hàng</span>
          </button>
        </div>

        {/* Staff Login Form */}
        {!isCustomer && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-6 sm:p-8 space-y-5 sm:space-y-6 backdrop-blur-sm border border-white/20">
          {/* Section Title */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-2 bg-red-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-2 sm:mb-3">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
              <span className="text-xs sm:text-sm font-semibold text-red-700">Xác thực nhân viên</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Đăng nhập</h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 border-l-4 border-red-600 rounded-lg sm:rounded-xl animate-shake">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm sm:text-base">Lỗi đăng nhập</p>
                <p className="text-xs sm:text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Lockout Warning */}
          {isLocked && remainingTime !== null && (
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded-lg sm:rounded-xl">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="font-semibold text-yellow-900 text-sm sm:text-base">Tài khoản bị khóa</p>
                <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                  Vui lòng thử lại sau <span className="font-bold">{Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}</span>
                </p>
              </div>
            </div>
          )}

          {/* Attempt Counter */}
          {loginAttempts > 0 && loginAttempts < 5 && !isLocked && (
            <div className="flex items-center justify-between p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg sm:rounded-xl">
              <span className="text-xs sm:text-sm font-medium text-orange-800">Lần thử:</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      i < loginAttempts ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-bold text-orange-700">{5 - loginAttempts}/5</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black text-gray-800 uppercase tracking-wide">Tên đăng nhập</label>
            <div className="relative group">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                disabled={isLocked || isLoading}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all placeholder:text-gray-400 text-sm sm:text-base font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* PIN Input */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black text-gray-800 uppercase tracking-wide">Mã PIN</label>
            <div className="relative group">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition">
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                value={pinCode}
                onChange={handlePinInput}
                placeholder="••••"
                disabled={isLocked || isLoading}
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 text-center text-2xl sm:text-3xl tracking-[0.3em] sm:tracking-[0.5em] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                disabled={isLoading || pinCode.length === 0}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed transition-all hover:scale-110"
                title={showPin ? 'Ẩn PIN' : 'Hiển thị PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLocked || username.trim().length === 0 || pinCode.length < 4}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 uppercase tracking-wider text-xs sm:text-sm"
          >
            {isLoading ? (
              <>
                <div className="animate-spin">
                  <Lock className="w-5 h-5" />
                </div>
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Đăng nhập</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-white text-gray-500">hoặc</span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-900 uppercase">💡 Mẹo</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Mã PIN tối thiểu 4 ký tự</li>
              <li>Sai 5 lần sẽ bị khóa 15 phút</li>
              <li>Liên hệ quản lý nếu quên thông tin</li>
            </ul>
          </div>
        </form>
        )}

        {/* Customer Table Selection */}
        {isCustomer && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-6 sm:p-8 space-y-6 sm:space-y-8 backdrop-blur-sm border border-white/20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-2 sm:mb-3">
              <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-semibold text-blue-700">Chọn bàn của bạn</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Chọn bàn ăn</h2>
          </div>

          {/* Table Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {tableList.map(table => (
              <button
                key={table.id}
                onClick={() => handleCustomerSelect(table.id)}
                className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-400 transition-all active:scale-95 flex flex-col items-center gap-2"
              >
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <span className="font-black text-sm sm:text-base text-blue-900">{table.name}</span>
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-800 font-semibold">💡 Chọn số bàn của bạn để bắt đầu đặt hàng</p>
          </div>
        </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 space-y-1 sm:space-y-2">
          <p className="text-gray-700 text-xs sm:text-sm font-medium">Lẩu Ngon Restaurant</p>
          <p className="text-gray-500 text-xs">POS System v1.0 © 2025</p>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};

export default LoginView;
