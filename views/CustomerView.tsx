import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { CATEGORY_LABELS } from '../constants';
import { MenuItem, OrderItemStatus, ProductCategory, TableStatus, ItemType, ComboGroup } from '../types';
import { ShoppingCart, X, Plus, Minus, Search, BellRing, Clock, ChefHat, CheckCircle, ChevronDown, Check, Receipt, Sparkles, Star, ChevronUp, Coffee, Edit3, Trash2, XCircle, LogOut, ArrowLeft, UtensilsCrossed } from 'lucide-react';

const CustomerView = () => {
  const { tables, menu, activeTableId, setActiveTableId, startTableSession, addItemToOrder, orders, requestBill, setRole } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [cart, setCart] = useState<{ 
      item: MenuItem; 
      quantity: number; 
      note: string; 
      selectedOptions?: string[]; 
      totalPrice?: number; 
  }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallingStaff, setIsCallingStaff] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [comboModalItem, setComboModalItem] = useState<MenuItem | null>(null);
  const [comboSelections, setComboSelections] = useState<Record<string, string[]>>({});
  const [quantityModalItem, setQuantityModalItem] = useState<MenuItem | null>(null);
  const [quantityModalValue, setQuantityModalValue] = useState(1);
  const [quantityModalNote, setQuantityModalNote] = useState('');

  const currentTableOrder = orders.find(o => o.tableId === activeTableId && !o.isPaid);
  const orderedItems = currentTableOrder?.items || [];
  const activeTable = tables.find(t => t.id === activeTableId);
  const recommendedItems = menu.filter(m => m.isRecommended && m.available);

  // Hiệu ứng giỏ hàng khi thêm món
  const [cartBounce, setCartBounce] = useState(false);
  useEffect(() => {
    if (cart.length > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cart.length]);

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) return;
    if (item.type === ItemType.COMBO) {
        setComboModalItem(item);
        setComboSelections({});
        return;
    }
    setQuantityModalItem(item);
    setQuantityModalValue(1);
    setQuantityModalNote('');
  };

  const handleConfirmQuantity = () => {
      if (!quantityModalItem) return;
      setCart(prev => {
        const existing = prev.find(i => i.item.id === quantityModalItem.id && i.note === quantityModalNote);
        if (existing) {
          return prev.map(i => (i.item.id === quantityModalItem.id && i.note === quantityModalNote)
            ? { ...i, quantity: i.quantity + quantityModalValue } 
            : i
          );
        }
        return [...prev, { 
            item: quantityModalItem, 
            quantity: quantityModalValue, 
            note: quantityModalNote, 
            totalPrice: quantityModalItem.price 
        }];
      });
      setQuantityModalItem(null);
  };

  const handleComboOptionToggle = (group: ComboGroup, optionId: string, optionName: string) => {
      setComboSelections(prev => {
          const currentSelected = prev[group.id] || [];
          const isSelected = currentSelected.includes(optionName);
          if (isSelected) {
              return { ...prev, [group.id]: currentSelected.filter(id => id !== optionName) };
          } else {
              if (currentSelected.length >= group.max) {
                   if (group.max === 1) return { ...prev, [group.id]: [optionName] };
                   return prev;
              }
              return { ...prev, [group.id]: [...currentSelected, optionName] };
          }
      });
  };

  const isComboValid = () => {
      if (!comboModalItem || !comboModalItem.comboGroups) return false;
      return comboModalItem.comboGroups.every(group => {
          const selectedCount = (comboSelections[group.id] || []).length;
          return selectedCount >= group.min && selectedCount <= group.max;
      });
  };

  const confirmCombo = () => {
      if (!comboModalItem) return;
      const allSelectedOptionNames: string[] = [];
      let extraPrice = 0;
      comboModalItem.comboGroups?.forEach(group => {
          const selectedNames = comboSelections[group.id] || [];
          selectedNames.forEach(name => {
              const option = group.options.find(o => o.name === name);
              if (option) {
                  if (option.price && option.price > 0) {
                      extraPrice += option.price;
                      allSelectedOptionNames.push(`${name} (+${option.price.toLocaleString('vi-VN')}đ)`);
                  } else {
                      allSelectedOptionNames.push(name);
                  }
              }
          });
      });
      const finalUnitPrice = comboModalItem.price + extraPrice;
      setCart(prev => [...prev, { 
          item: comboModalItem, 
          quantity: 1, 
          note: '', 
          selectedOptions: allSelectedOptionNames,
          totalPrice: finalUnitPrice
      }]);
      setComboModalItem(null);
  };

  const submitOrder = () => {
    if (!activeTableId) return;
    cart.forEach(cartItem => {
      addItemToOrder(activeTableId, cartItem.item, cartItem.quantity, cartItem.note, cartItem.selectedOptions, cartItem.totalPrice);
    });
    setCart([]);
    setIsCartOpen(false);
  };

  const renderStatusBadge = (status: OrderItemStatus) => {
      switch(status) {
          case OrderItemStatus.PENDING: return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">CHỜ DUYỆT</span>;
          case OrderItemStatus.PREPARING: return <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">ĐANG NẤU</span>;
          case OrderItemStatus.READY: return <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold">XONG</span>;
          case OrderItemStatus.SERVED: return <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">ĐÃ LÊN</span>;
          case OrderItemStatus.CANCELLED: return <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-bold line-through">HỦY</span>;
      }
  }

  if (!activeTableId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-rose-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-rose-200 mb-4 rotate-3">
                <UtensilsCrossed size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Lẩu Ngon POS</h1>
            <p className="text-slate-500 font-medium">Chào mừng quý khách!</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full max-w-md">
          {tables.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTableId(t.id);
                if (t.status === TableStatus.EMPTY) startTableSession(t.id, 2);
              }}
              className={`p-3 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all group relative overflow-hidden ${
                t.status === TableStatus.OCCUPIED 
                ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-md' 
                : 'bg-white border-slate-200 hover:border-rose-400 hover:shadow-xl'
              }`}
            >
              <div className="text-2xl font-black">{t.name}</div>
              <div className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">
                {t.status === TableStatus.OCCUPIED ? 'ĐANG ĂN' : 'BÀN TRỐNG'}
              </div>
              <div className={`absolute -right-2 -bottom-2 w-12 h-12 rounded-full flex items-center justify-center transition-all ${t.status === TableStatus.OCCUPIED ? 'bg-rose-200 scale-100' : 'bg-slate-100 scale-0 group-hover:scale-100'}`}>
                <Check size={24} className={t.status === TableStatus.OCCUPIED ? 'text-rose-600' : 'text-slate-400'} />
              </div>
            </button>
          ))}
        </div>

        <button onClick={() => setRole(null)} className="mt-12 text-slate-400 font-bold hover:text-slate-600 transition flex items-center gap-2">
            <ArrowLeft size={18}/> Quay lại chọn vai trò
        </button>
      </div>
    );
  }

  const filteredMenu = selectedCategory === 'ALL' ? menu : menu.filter(m => m.category === selectedCategory);
  const cartTotal = cart.reduce((sum, i) => sum + (i.totalPrice || i.item.price) * i.quantity, 0);
  const orderTotal = orderedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header - Phân cấp mạnh hơn */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <span className="font-black text-lg">{activeTable?.name.split(' ')[1]}</span>
            </div>
            <div>
                <h2 className="font-black text-slate-800 leading-tight">BÀN {activeTable?.name.split(' ')[1]}</h2>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ĐANG PHỤC VỤ</span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-2">
             <button onClick={() => setIsCallingStaff(true)} className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition shadow-sm border border-amber-200/50">
                <BellRing size={20} />
            </button>
            <button onClick={() => setIsCartOpen(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-lg ${cartBounce ? 'scale-110' : 'scale-100'} ${cart.length > 0 ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-slate-100 text-slate-400 shadow-none'}`}>
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {cart.length}
                    </span>
                )}
            </button>
            <button 
                onClick={() => {
                    if (window.confirm('Quay lại màn hình chọn vai trò?')) {
                        setRole(null);
                        setActiveTableId(null);
                    }
                }}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition border border-slate-100"
                title="Thoát vai trò"
            >
                <LogOut size={18} />
            </button>
        </div>
      </header>

      {/* Danh mục - Responsive */}
      <nav className="sticky top-[57px] sm:top-[65px] z-20 bg-white/95 backdrop-blur-sm border-b border-slate-50 py-2 sm:py-3 overflow-x-auto whitespace-nowrap px-3 sm:px-4 scrollbar-hide">
        <div className="flex gap-2">
            <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
                TẤT CẢ
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                    key={key}
                    onClick={() => setSelectedCategory(key as ProductCategory)}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === key ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    {label}
                </button>
            ))}
        </div>
      </nav>

      <main className="px-3 sm:px-4 pt-4 sm:pt-6 max-w-2xl mx-auto w-full">
        {/* Recommended Slider - Tăng độ hấp dẫn */}
        {selectedCategory === 'ALL' && recommendedItems.length > 0 && (
            <section className="mb-10">
                <div className="flex justify-between items-end mb-4 px-1">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            MÓN PHẢI THỬ <Sparkles className="text-amber-400 fill-amber-400" size={18} />
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">GỢI Ý RIÊNG CHO BẠN</p>
                    </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                    {recommendedItems.map(item => (
                        <div key={item.id} onClick={() => handleAddToCart(item)} className="min-w-[280px] bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden relative group active:scale-95 transition-all">
                             <div className="h-44 w-full relative">
                                 <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                 <div className="absolute bottom-3 left-4">
                                     <div className="bg-amber-400 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg mb-1 inline-block">BEST SELLER</div>
                                     <h4 className="text-white font-black text-lg leading-tight">{item.name}</h4>
                                 </div>
                                 <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                                     <Plus size={20} />
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* Menu Grid - Sạch sẽ hơn */}
        <section>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">DANH SÁCH MÓN ĂN</h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {filteredMenu.map(item => (
                    <div key={item.id} onClick={() => handleAddToCart(item)} className={`bg-white p-3 rounded-3xl border border-slate-100 shadow-sm flex gap-4 active:scale-[0.98] transition-all group ${!item.available ? 'opacity-60' : ''}`}>
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 relative">
                            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            {!item.available && (
                                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                    <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-1 rounded-md rotate-[-15deg]">HẾT</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                                <h4 className="font-bold text-slate-800 leading-tight group-hover:text-rose-600 transition-colors">{item.name}</h4>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="font-black text-rose-600">{item.price.toLocaleString('vi-VN')}đ</span>
                                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                                    <Plus size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Món đã gọi - View gọn hơn */}
        {orderedItems.length > 0 && (
            <section className="mt-12 bg-slate-50 rounded-3xl p-5 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">ĐÃ ORDER</h3>
                    <span className="font-black text-slate-900">{orderTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="space-y-3">
                    {orderedItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                                <span className="font-bold text-slate-700">x{item.quantity} {item.name}</span>
                            </div>
                            {renderStatusBadge(item.status)}
                        </div>
                    ))}
                </div>
            </section>
        )}
      </main>

      {/* Floating Action Bar - UX mới: Nút tính tiền luôn ở tầm mắt */}
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-3 sm:px-4 flex gap-2 sm:gap-3">
            <button onClick={() => requestBill(activeTableId!)} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition active:scale-95">
                <Receipt size={20} className="text-rose-600" /> THANH TOÁN
            </button>
            <button onClick={() => setIsCartOpen(true)} className="flex-[2] bg-rose-600 text-white h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 flex items-center justify-center gap-3 relative hover:bg-rose-700 transition active:scale-95">
                <ShoppingCart size={20} /> 
                XEM GIỎ HÀNG
                {cart.length > 0 && <span className="px-2 py-0.5 bg-white text-rose-600 rounded-lg text-[10px] font-black">{cartTotal.toLocaleString()}đ</span>}
            </button>
      </div>

      {/* Modal Giỏ hàng & Option giữ nguyên logic cũ nhưng đẹp hơn */}
      {isCartOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
              <div className="bg-white w-full max-w-lg rounded-t-[40px] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4"></div>
                  <div className="p-6 flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-800">GIỎ HÀNG</h3>
                      <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><X/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto px-6 pb-20">
                      {cart.length === 0 ? (
                          <div className="py-20 text-center">
                              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                                  <ShoppingCart size={40} />
                              </div>
                              <p className="text-slate-400 font-bold">Bạn chưa chọn món nào</p>
                          </div>
                      ) : (
                          cart.map((i, idx) => (
                              <div key={idx} className="flex gap-4 mb-6 pb-6 border-b border-slate-50">
                                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                                      <img src={i.item.image} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="font-bold text-slate-800">{i.item.name}</h4>
                                      <p className="text-rose-600 font-black text-sm">{(i.totalPrice || i.item.price).toLocaleString()}đ</p>
                                      {i.selectedOptions?.map((o, idx) => <div key={idx} className="text-[10px] text-slate-400 font-bold">• {o}</div>)}
                                  </div>
                                  <div className="flex flex-col items-end justify-between">
                                      <button onClick={() => setCart(cart.filter((_, idx2) => idx2 !== idx))} className="text-slate-300 hover:text-rose-600 transition"><Trash2 size={18}/></button>
                                      <div className="flex items-center bg-slate-100 rounded-xl px-1 py-1">
                                          <button onClick={() => {
                                              const newC = [...cart];
                                              if (newC[idx].quantity > 1) newC[idx].quantity -= 1;
                                              setCart(newC);
                                          }} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400"><Minus size={14}/></button>
                                          <span className="w-8 text-center font-black text-slate-800">{i.quantity}</span>
                                          <button onClick={() => {
                                              const newC = [...cart];
                                              newC[idx].quantity += 1;
                                              setCart(newC);
                                          }} className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600"><Plus size={14}/></button>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  <div className="p-6 border-t border-slate-50 bg-slate-50/50">
                      <div className="flex justify-between items-center mb-6">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">TỔNG CỘNG</span>
                          <span className="text-3xl font-black text-slate-900">{cartTotal.toLocaleString()}đ</span>
                      </div>
                      <button 
                          onClick={submitOrder}
                          disabled={cart.length === 0}
                          className="w-full bg-rose-600 text-white h-16 rounded-3xl font-black text-lg shadow-xl shadow-rose-100 disabled:opacity-50 transition active:scale-95"
                      >
                          XÁC NHẬN GỬI ĐƠN
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Combo Modal & Quantity Modal UI tinh chỉnh tương tự... */}
      {quantityModalItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                  <div className="text-center mb-6">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto mb-4 shadow-xl">
                          <img src={quantityModalItem.image} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800">{quantityModalItem.name}</h3>
                      <p className="text-rose-600 font-black text-lg">{quantityModalItem.price.toLocaleString()}đ</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-8 mb-8">
                      <button onClick={() => setQuantityModalValue(Math.max(1, quantityModalValue - 1))} className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition"><Minus size={24}/></button>
                      <span className="text-4xl font-black text-slate-800 w-12 text-center">{quantityModalValue}</span>
                      <button onClick={() => setQuantityModalValue(quantityModalValue + 1)} className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center text-white hover:bg-rose-700 shadow-lg shadow-rose-100 transition"><Plus size={24}/></button>
                  </div>

                  <div className="mb-8">
                      <textarea 
                          placeholder="Ghi chú cho bếp... (ít cay, không hành...)"
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none h-24"
                          value={quantityModalNote}
                          onChange={(e) => setQuantityModalNote(e.target.value)}
                      />
                  </div>

                  <div className="flex gap-4">
                      <button onClick={() => setQuantityModalItem(null)} className="flex-1 h-14 bg-slate-100 rounded-2xl font-bold text-slate-500">ĐÓNG</button>
                      <button onClick={handleConfirmQuantity} className="flex-[2] h-14 bg-slate-800 text-white rounded-2xl font-black tracking-widest text-sm uppercase">THÊM VÀO GIỎ</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomerView;
