/**
 * HomePage.tsx
 * Dashboard chính - Redirect theo role hoặc hiển thị menu
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Smartphone, ChefHat, DollarSign, Settings } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Auto-redirect to role-specific page
  useEffect(() => {
    if (!user) return;

    const roleRoutes: Record<string, string> = {
      ADMIN: '/admin',
      STAFF: '/staff',
      KITCHEN: '/kitchen',
      CASHIER: '/cashier',
    };

    const route = roleRoutes[user.role];
    if (route) {
      navigate(route, { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) {
    return null;
  }

  // Fallback UI if auto-redirect fails
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Lẩu Ngon POS</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              Xin chào, <strong>{user.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Đang chuyển hướng tới trang của bạn...</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
