
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';
import { OrderItem, OrderItemStatus, ProductCategory } from '../types';
import { Clock, CheckCircle, Flame, Coffee, Utensils, XCircle, MessageSquare, Wifi, WifiOff, LogOut, ChevronRight, AlertTriangle, ListFilter, Play, Zap, Eye, EyeOff } from 'lucide-react';

type FilterType = 'ALL' | 'KITCHEN' | 'BAR';

const KitchenView = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { orders, updateOrderItemStatus, updateOrderItemKitchenNote, tables, menu, markItemOutOfStock } = useRestaurant();
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [hideCompleted, setHideCompleted] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  
  const [noteModalItem, setNoteModalItem] = useState<{orderId: string, itemId: string, currentNote: string} | null>(null);
  const [noteInputValue, setNoteInputValue] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      }
  }, []);

  const activeItems = useMemo(() => {
    const items: { orderId: string; tableId: string; item: OrderItem }[] = [];
    orders.forEach(order => {
        if (!order.isPaid) {
            order.items.forEach(item => {
                if (item.status !== OrderItemStatus.SERVED && item.status !== OrderItemStatus.CANCELLED) {
                   items.push({ orderId: order.id, tableId: order.tableId, item });
                }
            });
        }
    });
    return items;
  }, [orders]);

  const filteredItems = useMemo(() => {
      let result = activeItems;
      if (filterType !== 'ALL') {
          result = result.filter(entry => {
              const menuItem = menu.find(m => m.id === entry.item.menuItemId);
              if (!menuItem) return true;
              return filterType === 'BAR' ? menuItem.category === ProductCategory.DRINK : menuItem.category !== ProductCategory.DRINK;
          });
      }
      if (hideCompleted) {
          result = result.filter(({ item }) => !completedItems.has(item.id));
      }
      return result.sort((a, b) => a.item.timestamp - b.item.timestamp);
  }, [activeItems, filterType, menu, hideCompleted, completedItems]);

  const aggregatedNeeded = useMemo(() => {
    const summary: Record<string, { name: string, total: number, category: ProductCategory }> = {};
    filteredItems.forEach(({ item }) => {
        if (item.status === OrderItemStatus.PENDING || item.status === OrderItemStatus.PREPARING) {
            const menuItem = menu.find(m => m.id === item.menuItemId);
            if (!summary[item.menuItemId]) {
                summary[item.menuItemId] = { 
                    name: item.name, 
                    total: 0, 
                    category: menuItem?.category || ProductCategory.OTHER 
                };
            }
            summary[item.menuItemId].total += item.quantity;
        }
    });
    return Object.values(summary);
  }, [filteredItems, menu]);

  const getTableName = (id: string) => tables.find(t => t.id === id)?.name || id;

  const handleStatusChange = (orderId: string, itemId: string, currentStatus: OrderItemStatus) => {
      let nextStatus = currentStatus;
      if (currentStatus === OrderItemStatus.PENDING) {
        nextStatus = OrderItemStatus.PREPARING;
      } else if (currentStatus === OrderItemStatus.PREPARING) {
        nextStatus = OrderItemStatus.READY;
        // Play sound & auto-hide after 3 seconds
        audioRef.current?.play().catch(() => {});
        setCompletedItems(prev => new Set([...prev, itemId]));
        setTimeout(() => {
          setCompletedItems(prev => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        }, 3000);
      } else if (currentStatus === OrderItemStatus.READY) {
        nextStatus = OrderItemStatus.SERVED;
      }
      updateOrderItemStatus(orderId, itemId, nextStatus);
  };

  const getTimeElapsed = (timestamp: number) => {
      return Math.floor((currentTime - timestamp) / 60000);
  };

  const getUrgencyColor = (elapsed: number, status: OrderItemStatus) => {
    if (status === OrderItemStatus.READY) return 'emerald';
    if (elapsed >= 20) return 'rose';
    if (elapsed >= 15) return 'orange';
    if (elapsed >= 10) return 'amber';
    return 'slate';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col h-screen overflow-hidden font-sans">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==" />
      
      <header className="bg-[#0f172a] border-b border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 shadow-2xl z-20">
        <div className="flex items-center gap-3 sm:gap-8 flex-1 sm:flex-none">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-rose-600 rounded-lg sm:rounded-xl shadow-lg shadow-rose-900/40">
                    <Flame className="text-white animate-pulse" size={20} />
                </div>
                <div>
                    <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tighter leading-none">KDS ELITE</h1>
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Kitchen Display</span>
                </div>
            </div>
            
            <div className="flex bg-slate-900 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-800 ml-auto sm:ml-0">
                {(['ALL', 'KITCHEN', 'BAR'] as FilterType[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={`px-3 sm:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-tighter sm:tracking-widest transition-all ${
                            filterType === t 
                            ? (t === 'BAR' ? 'bg-purple-600' : t === 'KITCHEN' ? 'bg-rose-600' : 'bg-blue-600') + ' text-white shadow-xl'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {t === 'ALL' ? 'Tất cả' : t === 'KITCHEN' ? 'Bếp' : 'Bar'}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto">
            <div className="text-right hidden sm:block">
                <div className="text-lg sm:text-xl font-mono font-black text-slate-400">{new Date(currentTime).toLocaleTimeString('vi-VN')}</div>
                <div className="text-[8px] sm:text-[10px] font-bold text-slate-600 uppercase">{filteredItems.length} ITEMS</div>
            </div>
            <button 
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`p-2 sm:p-3 rounded-lg sm:rounded-2xl transition-all border text-sm sm:text-base ${hideCompleted ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
            >
              {hideCompleted ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-2xl text-[8px] sm:text-[10px] font-black border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`}></div>
                <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                <span className="sm:hidden">{isOnline ? 'ON' : 'OFF'}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="p-2 sm:p-3 bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg sm:rounded-2xl transition-all border border-slate-800"
            >
                <LogOut size={18} />
            </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <aside className="w-full md:w-80 bg-[#0f172a] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col max-h-32 sm:max-h-40 md:max-h-none overflow-y-auto md:overflow-visible">
            <div className="p-3 sm:p-5 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
                <h2 className="font-black text-[8px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-500 flex items-center gap-2">
                    <ListFilter size={12} className="sm:w-3.5 sm:h-3.5"/> TỔNG HỢP
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 custom-scrollbar">
                {aggregatedNeeded.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-20">
                        <CheckCircle size={32} className="mb-2 sm:mb-4" />
                        <p className="font-black uppercase tracking-widest text-[8px] sm:text-xs">Trống</p>
                    </div>
                ) : (
                    aggregatedNeeded.map((agg, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-2 sm:p-4 rounded-[16px] sm:rounded-[20px] flex justify-between items-center group hover:border-rose-500/30 transition-all">
                            <span className="font-black text-slate-300 text-[11px] sm:text-sm uppercase tracking-tight line-clamp-2">{agg.name}</span>
                            <span className="bg-rose-600 text-white w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-lg sm:text-2xl shadow-lg shadow-rose-900/20 group-hover:scale-110 transition-transform flex-shrink-0 ml-2">
                                {agg.total}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </aside>

        <main className="flex-1 overflow-x-auto overflow-y-hidden bg-[#020617] p-2 sm:p-4 md:p-6 flex gap-2 sm:gap-4 md:gap-6 scrollbar-hide">
            {filteredItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-800">
                    <Utensils size={100} className="opacity-5 mb-6" />
                    <p className="text-2xl font-black opacity-10 uppercase tracking-[0.5em]">Waiting for orders</p>
                </div>
            ) : (
                filteredItems.map(({ orderId, tableId, item }) => {
                    const elapsed = getTimeElapsed(item.timestamp);
                    const urgencyColor = getUrgencyColor(elapsed, item.status);
                    const isUrgent = elapsed >= 10 && item.status !== OrderItemStatus.READY;
                    const isVeryUrgent = elapsed >= 20 && item.status !== OrderItemStatus.READY;

                    return (
                        <div 
                            key={item.id}
                            className={`flex-shrink-0 w-80 sm:w-96 flex flex-col bg-[#0f172a] rounded-2xl sm:rounded-[32px] border-2 transition-all duration-500 shadow-2xl relative overflow-hidden ${
                                item.status === OrderItemStatus.READY ? 'border-emerald-500 opacity-50 scale-95' : 
                                isVeryUrgent ? `border-rose-600 ring-4 ring-rose-600/20 animate-pulse` : 
                                isUrgent ? 'border-amber-500' : 'border-slate-800'
                            }`}
                        >
                            {isVeryUrgent && <div className="absolute inset-0 bg-rose-600/5 pointer-events-none"></div>}

                            <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center gap-2 bg-slate-900/40">
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{getTableName(tableId)}</div>
                                    <div className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5 sm:mt-1">#{orderId.slice(-4)}</div>
                                </div>
                                <div className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl font-mono font-black text-sm sm:text-xl flex items-center gap-1 sm:gap-2 flex-shrink-0 ${
                                  urgencyColor === 'rose' ? 'bg-rose-600 text-white animate-pulse' :
                                  urgencyColor === 'orange' ? 'bg-orange-600 text-white animate-pulse' :
                                  urgencyColor === 'amber' ? 'bg-amber-600 text-white' :
                                  urgencyColor === 'emerald' ? 'bg-emerald-600 text-white' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                    <Clock size={14} className="sm:w-5 sm:h-5" /> {elapsed}'
                                </div>
                            </div>

                            <div className="flex-1 p-4 sm:p-7 flex flex-col">
                                <div className="flex items-start gap-2 sm:gap-4 mb-3 sm:mb-6">
                                    <span className={`text-3xl sm:text-5xl font-black shrink-0 ${isVeryUrgent ? 'text-rose-500' : 'text-rose-600'}`}>
                                        {item.quantity}
                                    </span>
                                    <h3 className="text-lg sm:text-2xl font-black leading-tight text-white pt-0.5 sm:pt-2 uppercase tracking-tight line-clamp-3">{item.name}</h3>
                                </div>
                                
                                {item.note && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 sm:p-4 rounded-lg sm:rounded-2xl text-rose-400 text-xs sm:text-sm font-black mb-3 sm:mb-4 flex gap-2 sm:gap-3">
                                        <AlertTriangle size={16} className="shrink-0 sm:w-5 sm:h-5" />
                                        <span className="line-clamp-2">{item.note}</span>
                                    </div>
                                )}

                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-6">
                                        {item.selectedOptions.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400 font-bold bg-slate-800/30 p-1.5 sm:p-2 rounded-lg">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
                                                <span className="line-clamp-1">{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {item.kitchenNote && (
                                    <div className="mt-auto bg-blue-600/10 border border-blue-600/20 p-2.5 sm:p-4 rounded-lg sm:rounded-2xl text-blue-400 text-[10px] sm:text-[11px] font-black flex gap-1.5 sm:gap-2 uppercase tracking-wider">
                                        <MessageSquare size={14} className="shrink-0 sm:w-4 sm:h-4" /> <span className="line-clamp-2">BẾP: {item.kitchenNote}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 sm:p-6 bg-slate-900/80 flex gap-2 sm:gap-3 border-t border-slate-800">
                                <button 
                                    onClick={() => setNoteModalItem({ orderId, itemId: item.id, currentNote: item.kitchenNote || '' })}
                                    className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg sm:rounded-2xl transition-all flex items-center justify-center border border-slate-700"
                                >
                                    <MessageSquare size={18} className="sm:w-6 sm:h-6" />
                                </button>

                                {item.status !== OrderItemStatus.READY && (
                                  <button 
                                      onClick={() => handleStatusChange(orderId, item.id, item.status)}
                                      className={`flex-1 h-12 sm:h-16 rounded-lg sm:rounded-[20px] font-black text-[10px] sm:text-xs uppercase tracking-tighter sm:tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-3 ${
                                          item.status === OrderItemStatus.PENDING ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' : 
                                          'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                                      }`}
                                  >
                                      {item.status === OrderItemStatus.PENDING && <><Play size={14} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Bắt đầu</span><span className="sm:hidden">Làm</span></> }
                                      {item.status === OrderItemStatus.PREPARING && <><Zap size={14} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Xong</span><span className="sm:hidden">OK</span></> }
                                  </button>
                                )}
                                
                                {item.status === OrderItemStatus.READY && (
                                  <div className="flex-1 h-12 sm:h-16 rounded-lg sm:rounded-[20px] bg-emerald-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-tighter sm:tracking-[0.2em] flex items-center justify-center gap-1.5 sm:gap-3">
                                    <CheckCircle size={14} className="sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Đã xong</span><span className="sm:hidden">OK</span>
                                  </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </main>
      </div>

      {noteModalItem && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 backdrop-blur-xl">
              <div className="bg-[#0f172a] rounded-[40px] p-10 w-full max-w-lg border border-slate-800 shadow-3xl">
                  <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-widest text-center">Ghi chú nội bộ</h3>
                  <textarea 
                    autoFocus
                    className="w-full bg-[#020617] text-white border-2 border-slate-800 rounded-[24px] p-6 mb-8 focus:border-rose-600 outline-none h-48 font-bold text-lg"
                    placeholder="..."
                    value={noteInputValue || noteModalItem.currentNote}
                    onChange={(e) => setNoteInputValue(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => { setNoteModalItem(null); setNoteInputValue(''); }}
                        className="py-5 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                      >
                          Hủy
                      </button>
                      <button 
                        onClick={() => {
                            updateOrderItemKitchenNote(noteModalItem.orderId, noteModalItem.itemId, noteInputValue);
                            setNoteModalItem(null);
                            setNoteInputValue('');
                        }}
                        className="py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-500 shadow-xl shadow-rose-900/40 transition-all"
                      >
                          Lưu
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default KitchenView;
