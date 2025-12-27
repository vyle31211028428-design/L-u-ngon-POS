
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';
import { TableStatus, OrderItemStatus } from '../types';
import { Receipt, CreditCard, Banknote, QrCode, LogOut, X, Printer, Percent, History, Calendar, ArrowLeft, Search, Wallet } from 'lucide-react';

const CashierView = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { tables, orders, checkoutTable, closeTable, applyDiscount } = useRestaurant();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const occupiedTables = useMemo(() => {
      return tables.filter(t => (t.status === TableStatus.OCCUPIED || t.status === TableStatus.DIRTY))
                   .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                   .sort((a, b) => (b.billRequested ? 1 : 0) - (a.billRequested ? 1 : 0));
  }, [tables, searchTerm]);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const currentOrder = orders.find(o => o.tableId === selectedTableId && !o.isPaid);
  const paidOrders = useMemo(() => orders.filter(o => o.isPaid).sort((a,b) => b.startTime - a.startTime), [orders]);

  const subTotal = currentOrder?.items.reduce((sum, item) => {
      return item.status !== OrderItemStatus.CANCELLED ? sum + (item.price * item.quantity) : sum;
  }, 0) || 0;
  
  const discountAmount = currentOrder?.discount ? (
      currentOrder.discount.type === 'PERCENT' ? subTotal * (currentOrder.discount.value / 100) : currentOrder.discount.value
  ) : 0;

  const vat = (subTotal - discountAmount) * 0.08;
  const finalTotal = Math.max(0, subTotal - discountAmount + vat);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Bàn - Responsive */}
      <aside className="w-full md:w-96 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 no-print max-h-96 md:max-h-none overflow-y-auto md:overflow-visible">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                  <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">CASHIER <span className="text-blue-600">STATION</span></h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hệ thống thu ngân v2.5</p>
              </div>
              <button onClick={() => setShowHistory(true)} className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-100 transition shadow-sm"><History size={20}/></button>
          </div>

          <div className="p-4 border-b border-slate-50">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                  <input 
                    type="text" 
                    placeholder="Tìm bàn..."
                    className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
              {occupiedTables.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTableId(t.id)}
                    className={`px-6 py-5 border-b border-slate-50 cursor-pointer transition-all ${selectedTableId === t.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}
                  >
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="text-lg font-black text-slate-800">{t.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{t.id}</div>
                          </div>
                          {t.billRequested && (
                              <div className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-md animate-pulse shadow-lg shadow-rose-200 uppercase">CHỜ THANH TOÁN</div>
                          )}
                          {t.status === TableStatus.DIRTY && (
                              <div className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-md uppercase">CHỜ DỌN</div>
                          )}
                      </div>
                  </div>
              ))}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="w-full h-12 bg-white border border-slate-200 text-slate-400 font-bold rounded-xl hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center gap-2"
              >                  <LogOut size={18} /> ĐĂNG XUẤT
              </button>
          </div>
      </aside>

      {/* Main Payment Area */}
      <main className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden relative w-full">
          {!selectedTableId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  <Wallet size={100} className="opacity-10 mb-4" />
                  <p className="font-black text-xl opacity-20 uppercase tracking-widest">Chọn bàn để hiển thị hóa đơn</p>
              </div>
          ) : (
              <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full p-10 animate-in fade-in slide-in-from-right-10 duration-500">
                  <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col flex-1 border border-slate-100">
                      {/* Bill Header */}
                      <div className="px-10 py-8 bg-slate-800 text-white flex justify-between items-center no-print">
                          <div>
                              <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-1">CHI TIẾT HÓA ĐƠN</div>
                              <h2 className="text-3xl font-black">{selectedTable?.name}</h2>
                          </div>
                          <div className="flex gap-3">
                              <button onClick={() => setShowDiscountModal(true)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition"><Percent size={20}/></button>
                              <button onClick={() => window.print()} className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-500 transition shadow-lg shadow-blue-900/40"><Printer size={20}/></button>
                              <button onClick={() => setSelectedTableId(null)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500/20 transition"><X size={20}/></button>
                          </div>
                      </div>

                      {/* Printable Content */}
                      <div id="printable-area" className="flex-1 overflow-y-auto px-10 py-8 bg-white">
                          <div className="hidden print:block text-center mb-10">
                              <h1 className="text-3xl font-black uppercase tracking-tight">LẨU NGON RESTAURANT</h1>
                              <p className="text-slate-500 text-sm">HÓA ĐƠN THANH TOÁN</p>
                              <div className="w-full border-b-2 border-slate-900 my-4"></div>
                          </div>

                          <table className="w-full">
                              <thead>
                                  <tr className="border-b border-slate-100">
                                      <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Món ăn</th>
                                      <th className="text-center py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SL</th>
                                      <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn giá</th>
                                      <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {currentOrder?.items.map((item, idx) => (
                                      <tr key={idx} className={item.status === OrderItemStatus.CANCELLED ? 'opacity-30 line-through' : ''}>
                                          <td className="py-5">
                                              <div className="font-bold text-slate-800">{item.name}</div>
                                              {item.selectedOptions?.map((o, idx) => <div key={idx} className="text-[10px] text-slate-400 font-bold">• {o}</div>)}
                                          </td>
                                          <td className="py-5 text-center font-black">x{item.quantity}</td>
                                          <td className="py-5 text-right font-bold">{item.price.toLocaleString()}</td>
                                          <td className="py-5 text-right font-black">{ (item.price * item.quantity).toLocaleString() }</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>

                          <div className="mt-10 pt-10 border-t-2 border-slate-100 space-y-4">
                              <div className="flex justify-between text-slate-400 font-bold">
                                  <span>TẠM TÍNH</span>
                                  <span>{subTotal.toLocaleString()}đ</span>
                              </div>
                              {discountAmount > 0 && (
                                  <div className="flex justify-between text-rose-500 font-black">
                                      <span>GIẢM GIÁ</span>
                                      <span>-{discountAmount.toLocaleString()}đ</span>
                                  </div>
                              )}
                              <div className="flex justify-between text-slate-400 font-bold">
                                  <span>VAT (8%)</span>
                                  <span>{vat.toLocaleString()}đ</span>
                              </div>
                              <div className="flex justify-between pt-6 border-t border-slate-100">
                                  <span className="text-xl font-black text-slate-800">TỔNG CỘNG</span>
                                  <span className="text-4xl font-black text-blue-600">{finalTotal.toLocaleString()}đ</span>
                              </div>
                          </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex gap-4 no-print">
                          <button onClick={() => checkoutTable(selectedTableId!, 'CASH')} className="flex-1 h-20 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-600 transition shadow-sm group">
                              <Banknote size={24} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-black uppercase tracking-widest">Tiền mặt</span>
                          </button>
                          <button onClick={() => checkoutTable(selectedTableId!, 'QR')} className="flex-1 h-20 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600 transition shadow-sm group">
                              <QrCode size={24} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-black uppercase tracking-widest">Chuyển khoản / QR</span>
                          </button>
                          <button onClick={() => checkoutTable(selectedTableId!, 'CARD')} className="flex-1 h-20 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-purple-500 hover:text-purple-600 transition shadow-sm group">
                              <CreditCard size={24} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-black uppercase tracking-widest">Quẹt thẻ</span>
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </main>

      {/* History & Discount Modal UI tương tự tinh chỉnh sang trọng hơn... */}
    </div>
  );
};

export default CashierView;
