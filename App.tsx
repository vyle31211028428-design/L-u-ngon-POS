import React, { useState } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Role } from './types';
import DatabaseSetup from './components/DatabaseSetup';
import RoleSelection from './components/RoleSelection';
import CustomerView from './views/CustomerView';
import KitchenView from './views/KitchenView';
import StaffView from './views/StaffView';
import CashierView from './views/CashierView';
import AdminView from './views/AdminView';

const MainApp = () => {
  const { role, isLoading, error } = useRestaurant();

  // Nếu đang loading, hiển thị thông báo
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-xl text-gray-700">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Nếu có lỗi connection
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Lỗi Kết nối</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Vui lòng kiểm tra kết nối Supabase trong .env.local
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!role) {
    return <RoleSelection />;
  }

  const renderView = () => {
    switch (role) {
      case Role.CUSTOMER: return <CustomerView />;
      case Role.KITCHEN: return <KitchenView />;
      case Role.STAFF: return <StaffView />;
      case Role.CASHIER: return <CashierView />;
      case Role.ADMIN: return <AdminView />;
      default: return <div>Unknown Role</div>;
    }
  };

  return (
    <div className="relative">
      {renderView()}
    </div>
  );
};

const App = () => {
  const [setupComplete, setSetupComplete] = useState(false);

  // Nếu setup chưa hoàn tất, hiển thị DatabaseSetup
  if (!setupComplete) {
    return <DatabaseSetup onSetupComplete={() => setSetupComplete(true)} />;
  }

  return (
    <RestaurantProvider>
      <MainApp />
    </RestaurantProvider>
  );
};

export default App;