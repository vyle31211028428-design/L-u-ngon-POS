import React from 'react';
import { Role } from '../types';
import { useRestaurant } from '../context/RestaurantContext';
import { Users, ChefHat, UserCircle, Calculator, ShieldCheck } from 'lucide-react';

const RoleSelection = () => {
  const { setRole } = useRestaurant();

  const roles = [
    { id: Role.CUSTOMER, label: 'Khách Hàng (QR)', icon: <Users size={32} />, color: 'bg-blue-500' },
    { id: Role.STAFF, label: 'Nhân Viên', icon: <UserCircle size={32} />, color: 'bg-green-500' },
    { id: Role.KITCHEN, label: 'Bếp', icon: <ChefHat size={32} />, color: 'bg-orange-500' },
    { id: Role.CASHIER, label: 'Thu Ngân', icon: <Calculator size={32} />, color: 'bg-purple-500' },
    { id: Role.ADMIN, label: 'Quản Lý', icon: <ShieldCheck size={32} />, color: 'bg-gray-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Lẩu Ngon POS System</h1>
        <p className="text-center text-gray-600 mb-12">Chọn vai trò để đăng nhập vào hệ thống</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`${r.color} text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex flex-col items-center gap-4`}
            >
              {r.icon}
              <span className="text-xl font-bold">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
