
import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { TableStatus, OrderItemStatus, MenuItem, ProductCategory, ItemType } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { User, CheckSquare, Bell, Sparkles, Receipt, PlusCircle, Search, X, Minus, Plus, Trash2, Edit3, Clock, ChefHat, CheckCircle, Info, LogOut, ArrowLeft, ArrowRightLeft, CalendarClock, Phone, UserCheck, Calendar, Users } from 'lucide-react';

const StaffView = () => {
  const { tables, orders, menu, reservations, updateOrderItemStatus, startTableSession, closeTable, addItemToOrder, setRole, moveTable, addReservation, cancelReservation, checkInReservation } = useRestaurant();
  const [viewMode, setViewMode] = useState<'TABLES' | 'RESERVATIONS'>('TABLES');
  const [orderingTableId, setOrderingTableId] = useState<string | null>(null);
  const [detailTableId, setDetailTableId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [staffCart, setStaffCart] = useState<{ item: MenuItem; quantity: number; note: string }[]>([]);
  const [isMoveTableMode, setIsMoveTableMode] = useState(false);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [resForm, setResForm] = useState({ name: '', phone: '', guests: 2, time: '', note: '', tableId: '' });

  // Thống kê nhanh cho Staff
  const stats = useMemo(() => {
    const total = tables.length;
    const occupied = tables.filter(t => t.status === TableStatus.OCCUPIED).length;
    const dirty = tables.filter(t => t.status === TableStatus.DIRTY).length;
    const billNeeded = tables.filter(t => t.billRequested).length;
    const readyItemsTotal = orders.reduce((sum, o) => 
        sum + (o.isPaid ? 0 : o.items.filter(i => i.status === OrderItemStatus.READY).length), 0);
    
    return { total, occupied, dirty, billNeeded, readyItemsTotal };
  }, [tables, orders]);

  const getReadyItems = (tableId: string) => {
    const order = orders.find(o => o.tableId === tableId && !o.isPaid);
    if (!order) return [];
    return order.items.filter(i => i.status === OrderItemStatus.READY);
  };

  const handleServeItem = (tableId: string, itemId: string) => {
      const order = orders.find(o => o.tableId === tableId && !o.isPaid);
      if (order) updateOrderItemStatus(order.id, itemId, OrderItemStatus.SERVED);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">SERVICE <span className="text-rose-600">HUB</span></h1>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setViewMode('TABLES')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'TABLES' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>SƠ ĐỒ BÀN</button>
                <button onClick={() => setViewMode('RESERVATIONS')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'RESERVATIONS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>ĐẶT TRƯỚC</button>
            </div>
        </div>
        <button onClick={() => setRole(null)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition">
            <LogOut size={20} />
        </button>
      </header>

      {/* Stats Summary - Cực kỳ hữu ích cho nhân viên phục vụ */}
      <div className="grid grid-cols-4 gap-4 px-6 py-6 max-w-7xl mx-auto">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
              <div>
                  <div className="text-xl font-black">{stats.occupied}/{stats.total}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang ngồi</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Clock size={24}/></div>
              <div>
                  <div className="text-xl font-black">{stats.billNeeded}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chờ Bill</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center animate-bounce"><Bell size={24}/></div>
              <div>
                  <div className="text-xl font-black text-emerald-600">{stats.readyItemsTotal}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Món xong</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><Sparkles size={24}/></div>
              <div>
                  <div className="text-xl font-black">{stats.dirty}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cần dọn</div>
              </div>
          </div>
      </div>

      <main className="px-6 max-w-7xl mx-auto">
          {viewMode === 'TABLES' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map(table => {
                    const readyItems = getReadyItems(table.id);
                    return (
                        <div key={table.id} onClick={() => { if(table.status !== TableStatus.EMPTY) setDetailTableId(table.id); }} className={`group relative bg-white rounded-[32px] border-2 transition-all p-5 shadow-sm hover:shadow-xl cursor-pointer ${
                            table.status === TableStatus.EMPTY ? 'border-slate-100 opacity-60' :
                            table.status === TableStatus.OCCUPIED ? (table.billRequested ? 'border-amber-400 bg-amber-50/20' : 'border-blue-400') :
                            table.status === TableStatus.DIRTY ? 'border-rose-400 bg-rose-50/20' : 'border-purple-400'
                        }`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">{table.name}</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                        {table.status === TableStatus.EMPTY && 'Sẵn sàng'}
                                        {table.status === TableStatus.OCCUPIED && 'Phục vụ'}
                                        {table.status === TableStatus.DIRTY && 'Chờ dọn'}
                                        {table.status === TableStatus.RESERVED && 'Đặt trước'}
                                    </span>
                                </div>
                                {table.billRequested && <div className="p-2 bg-amber-500 text-white rounded-xl animate-pulse"><Receipt size={18}/></div>}
                                {readyItems.length > 0 && <div className="p-2 bg-emerald-500 text-white rounded-xl animate-bounce shadow-lg shadow-emerald-200"><Bell size={18}/></div>}
                            </div>

                            <div className="flex-1">
                                {table.status === TableStatus.OCCUPIED ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                            <Users size={16}/> {table.guestCount} khách
                                        </div>
                                        {readyItems.length > 0 && (
                                            <div className="bg-emerald-500 text-white p-3 rounded-2xl">
                                                <div className="text-[10px] font-black uppercase mb-1">Cần trả món ({readyItems.length})</div>
                                                <div className="text-xs font-bold truncate">{readyItems[0].name}...</div>
                                            </div>
                                        )}
                                    </div>
                                ) : table.status === TableStatus.EMPTY ? (
                                    <button onClick={(e) => { e.stopPropagation(); startTableSession(table.id, 2); }} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-300 hover:border-blue-400 hover:text-blue-400 transition-all font-bold">
                                        MỞ BÀN
                                    </button>
                                ) : table.status === TableStatus.DIRTY ? (
                                    <button onClick={(e) => { e.stopPropagation(); closeTable(table.id); }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-100">XÁC NHẬN DỌN XONG</button>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
              </div>
          ) : (
              /* Giao diện Reservations tương tự tinh chỉnh UI */
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Khách</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bàn</th>
                              <th className="p-6 text-right"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {reservations.map(res => (
                              <tr key={res.id} className="group hover:bg-slate-50/50 transition-colors">
                                  <td className="p-6 font-bold text-slate-800">{res.customerName}</td>
                                  <td className="p-6 text-rose-600 font-black">{res.time}</td>
                                  <td className="p-6 text-center font-bold">{res.guestCount}</td>
                                  <td className="p-6 text-blue-600 font-black">{tables.find(t => t.id === res.tableId)?.name || 'N/A'}</td>
                                  <td className="p-6 text-right">
                                      <button onClick={() => checkInReservation(res.id, res.tableId!)} className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-xs font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">CHECK-IN</button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </main>

      {/* Detail Modal Tối ưu tương tự Customer View... */}
      {detailTableId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">CHI TIẾT: {tables.find(t => t.id === detailTableId)?.name}</h3>
                      <button onClick={() => setDetailTableId(null)} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><X/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8">
                      {/* List Order Items ... */}
                  </div>
                  <div className="p-8 border-t border-slate-50 flex gap-4">
                      <button onClick={() => setOrderingTableId(detailTableId)} className="flex-1 h-14 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs">GỌI THÊM MÓN</button>
                      <button onClick={() => setIsMoveTableMode(true)} className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><ArrowRightLeft/></button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StaffView;
