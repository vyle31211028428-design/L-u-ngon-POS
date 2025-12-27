/**
 * DatabaseSetup.tsx
 * Component để kiểm tra kết nối Supabase, verify dữ liệu, và seed dữ liệu ban đầu
 * Hiển thị trạng thái setup cho user
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { INITIAL_MENU, INITIAL_TABLES } from '../constants';
import { MenuItem, Table } from '../types';

interface SetupStatus {
  step: 'checking' | 'seeding' | 'success' | 'error';
  message: string;
  progress: number;
  details: string[];
}

export const DatabaseSetup: React.FC<{ onSetupComplete: () => void }> = ({ onSetupComplete }) => {
  const [status, setStatus] = useState<SetupStatus>({
    step: 'checking',
    message: 'Đang kiểm tra kết nối...',
    progress: 0,
    details: [],
  });

  const updateStatus = (update: Partial<SetupStatus>) => {
    setStatus(prev => ({ ...prev, ...update }));
  };

  const addDetail = (detail: string) => {
    setStatus(prev => ({
      ...prev,
      details: [...prev.details, `[${new Date().toLocaleTimeString()}] ${detail}`],
    }));
  };

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // Step 1: Check Supabase connection
        addDetail('1. Kiểm tra kết nối Supabase...');
        const { data: connectionTest, error: connError } = await supabase
          .from('menu')
          .select('count', { count: 'exact', head: true });

        if (connError) {
          throw new Error(`Connection failed: ${connError.message}`);
        }

        addDetail('✓ Kết nối Supabase thành công');
        updateStatus({ progress: 25 });

        // Step 2: Check if menu table has data
        addDetail('2. Kiểm tra dữ liệu bảng menu...');
        const { data: existingMenu, error: menuError } = await supabase
          .from('menu')
          .select('id', { count: 'exact' })
          .limit(1);

        if (menuError) {
          throw new Error(`Failed to query menu: ${menuError.message}`);
        }

        const menuEmpty = !existingMenu || existingMenu.length === 0;

        if (!menuEmpty) {
          addDetail(`✓ Menu đã có ${existingMenu?.length || 0} mục. Bỏ qua seeding.`);
        } else {
          addDetail('⚠ Menu trống, cần seed dữ liệu...');
        }

        updateStatus({ progress: 50 });

        // Step 3: Check tables
        addDetail('3. Kiểm tra dữ liệu bảng tables...');
        const { data: existingTables, error: tablesError } = await supabase
          .from('tables')
          .select('id', { count: 'exact' })
          .limit(1);

        if (tablesError) {
          throw new Error(`Failed to query tables: ${tablesError.message}`);
        }

        const tablesEmpty = !existingTables || existingTables.length === 0;

        if (!tablesEmpty) {
          addDetail(`✓ Tables đã có ${existingTables?.length || 0} bàn. Bỏ qua seeding.`);
        } else {
          addDetail('⚠ Tables trống, cần seed dữ liệu...');
        }

        updateStatus({ progress: 75 });

        // Step 4: Seed data if needed
        if (menuEmpty || tablesEmpty) {
          addDetail('4. Seeding dữ liệu ban đầu...');

          if (menuEmpty) {
            addDetail('  - Đang thêm menu items...');
            // Transform menu items: camelCase -> snake_case
            // Note: Don't send 'id' - let Supabase auto-generate UUIDs
            const menuToInsert = INITIAL_MENU.map((item: MenuItem) => ({
              name: item.name,
              price: item.price,
              category: item.category,
              image: item.image,
              description: item.description || null,
              available: item.available,
              type: item.type,
              combo_groups: item.comboGroups || [],
              is_recommended: item.isRecommended || false,
              ingredients: item.ingredients || [],
            }));

            const { error: insertMenuError } = await supabase
              .from('menu')
              .insert(menuToInsert);

            if (insertMenuError) {
              throw new Error(`Failed to seed menu: ${insertMenuError.message}`);
            }

            addDetail(`  ✓ Đã thêm ${menuToInsert.length} menu items`);
          }

          if (tablesEmpty) {
            addDetail('  - Đang thêm tables...');
            // Transform tables: camelCase -> snake_case
            // Note: Don't send 'id' - let Supabase auto-generate UUIDs
            const tablesToInsert = INITIAL_TABLES.map((table: Table) => ({
              name: table.name,
              status: table.status,
              guest_count: table.guestCount || null,
              bill_requested: table.billRequested || false,
              current_order_id: table.currentOrderId || null,
              reservation_id: table.reservationId || null,
              position: table.position || null,
              section: table.section || null,
            }));

            // Use upsert to avoid duplicate key conflicts
            // Update if exists (by name), insert if doesn't
            const { error: insertTablesError } = await supabase
              .from('tables')
              .upsert(tablesToInsert, { onConflict: 'name' });

            if (insertTablesError) {
              throw new Error(`Failed to seed tables: ${insertTablesError.message}`);
            }

            addDetail(`  ✓ Đã thêm ${tablesToInsert.length} tables`);
          }

          addDetail('✓ Seeding hoàn tất');
        }

        updateStatus({ progress: 100 });

        // Final success
        addDetail('');
        addDetail('=== SETUP HOÀN TẤT ===');
        addDetail('Database đã sẵn sàng! Ứng dụng sẽ bắt đầu trong 2 giây...');

        updateStatus({
          step: 'success',
          message: '✓ Setup hoàn tất thành công!',
          progress: 100,
        });

        // Auto-close after 2 seconds
        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Setup error:', error);
        addDetail('');
        addDetail(`❌ LỖI: ${errorMsg}`);
        updateStatus({
          step: 'error',
          message: `❌ Setup thất bại: ${errorMsg}`,
          progress: 100,
        });
      }
    };

    setupDatabase();
  }, [onSetupComplete]);

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🍲 Lẩu Ngon POS</h1>
          <h2 className="text-xl text-gray-600">Khởi tạo Database</h2>
        </div>

        {/* Status Card */}
        <div
          className={`rounded-lg p-6 mb-6 ${
            status.step === 'success'
              ? 'bg-green-50 border-2 border-green-200'
              : status.step === 'error'
              ? 'bg-red-50 border-2 border-red-200'
              : 'bg-blue-50 border-2 border-blue-200'
          }`}
        >
          <p
            className={`text-lg font-semibold mb-2 ${
              status.step === 'success'
                ? 'text-green-800'
                : status.step === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }`}
          >
            {status.message}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                status.step === 'success'
                  ? 'bg-green-500'
                  : status.step === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-right">{status.progress}%</p>
        </div>

        {/* Details Log */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto mb-6 border border-gray-700">
          {status.details.length === 0 ? (
            <p className="text-gray-500">Đang chuẩn bị...</p>
          ) : (
            <div>
              {status.details.map((detail, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-words">
                  {detail}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Helper Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">💡 Thông tin:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Kiểm tra kết nối Supabase</li>
            <li>Nếu bảng trống, sẽ tự động thêm dữ liệu ban đầu</li>
            <li>Quá trình này chỉ chạy một lần khi ứng dụng khởi động</li>
          </ul>
        </div>

        {/* Error Recovery */}
        {status.step === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};

export default DatabaseSetup;
