/**
 * TableView.tsx
 * Giao diện gọi món cho khách hàng (theo URL /ban/:tableId)
 * - Không cần login
 * - Không thể thoát (navigate sang admin/kitchen)
 * - Full screen order interface
 */

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { AlertCircle } from 'lucide-react';

const TableView: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const { tables, orders } = useRestaurant();

  const table = useMemo(
    () => tables.find((t) => t.id === tableId),
    [tables, tableId]
  );

  const tableOrders = useMemo(
    () => orders.filter((o) => o.tableId === tableId && o.isPaid === false),
    [orders, tableId]
  );

  if (!table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bàn không tồn tại</h1>
          <p className="text-gray-600 mb-6">Mã bàn: {tableId}</p>
          <p className="text-sm text-gray-500">
            Vui lòng quét lại mã QR hoặc liên hệ với nhân viên
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Không cho phép navigate */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🍲 Lẩu Ngon</h1>
            <p className="text-orange-100">Bàn số {table.name}</p>
          </div>
          {/* Info only - không có logout button */}
          <div className="text-right text-orange-100">
            <p className="text-sm">Nhân viên sẽ phục vụ bạn ngay</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Current Orders */}
        {tableOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Đơn hàng của bạn</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {tableOrders.map((order) => (
                <div key={order.id} className="p-4 flex justify-between items-center">
                  <span className="text-gray-700">
                    {order.items.length} món
                  </span>
                  <span className="font-semibold text-lg">
                    {(order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">
            Chọn từ thực đơn ở menu hoặc gọi nhân viên để đặt hàng
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            🔄 Làm mới trang
          </button>
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Bạn đang ở trang gọi món. Không được phép truy cập các tính năng quản lý.
        </p>
      </div>
    </div>
  );
};

export default TableView;
