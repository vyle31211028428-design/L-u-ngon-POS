
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { generateDailyReport } from '../services/geminiService';
// Added missing Calendar icon import
import { LayoutDashboard, Menu as MenuIcon, Settings, Sparkles, Plus, Edit, Trash2, X, Save, Eye, EyeOff, Users, KeyRound, Download, GripVertical, LogOut, TrendingUp, TrendingDown, Layers, Rocket, Calendar, AlertCircle, Power, ChefHat, Shield, Phone as PhoneIcon, Dices } from 'lucide-react';
import { ProductCategory, MenuItem, Role, ItemType, Employee } from '../types';
import { CATEGORY_LABELS } from '../constants';

const AdminView = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { orders, menu, tables, employees, addMenuItem, updateMenuItem, deleteMenuItem, reorderMenu, addEmployee, updateEmployee, deleteEmployee, clearTodayRevenue, closeDay, generateUniquePIN } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MENU' | 'EMPLOYEES' | 'SETTINGS'>('DASHBOARD');
  const [aiReport, setAiReport] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isClearingRevenue, setIsClearingRevenue] = useState(false);
  const [clearRevenueResult, setClearRevenueResult] = useState<{ ordersDeleted: number; revenueCleared: number } | null>(null);
  const [isClosingDay, setIsClosingDay] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [showClearRevenueModal, setShowClearRevenueModal] = useState(false);
  const [closeResult, setCloseResult] = useState<{ tablesReset: number; ordersArchived: number; reservationsArchived: number; message: string } | null>(null);
  
  // Employee management state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<typeof employees[0] | null>(null);
  const [employeeForm, setEmployeeForm] = useState<{ name: string; username: string; role: Role; pinCode: string; status: 'ACTIVE' | 'INACTIVE' }>({ 
    name: '', 
    username: '',
    role: 'STAFF' as unknown as Role, 
    pinCode: '', 
    status: 'ACTIVE' 
  });
  const [showPinCode, setShowPinCode] = useState<string | null>(null);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const itemSales: Record<string, number> = {};
  orders.forEach(o => { o.items.forEach(i => { itemSales[i.name] = (itemSales[i.name] || 0) + i.quantity; }); });
  const chartData = Object.entries(itemSales).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const COLORS = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  const handleGenerateReport = async () => {
      setIsLoadingReport(true);
      const report = await generateDailyReport(orders);
      setAiReport(report);
      setIsLoadingReport(false);
  };

  const handleCloseDay = async () => {
    try {
      setIsClosingDay(true);
      const result = await closeDay();
      setCloseResult(result);
      console.log('✅ Day closed successfully:', result);
    } catch (err) {
      console.error('Error closing day:', err);
      alert('Lỗi khi kết thúc ngày: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsClosingDay(false);
    }
  };

  const handleClearRevenue = async () => {
    try {
      setIsClearingRevenue(true);
      const result = await clearTodayRevenue();
      setClearRevenueResult(result);
      console.log('✅ Today\'s revenue cleared:', result);
    } catch (err) {
      console.error('Error clearing revenue:', err);
      alert('Lỗi khi xóa doanh thu: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsClearingRevenue(false);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm({ name: '', username: '', role: 'STAFF' as unknown as Role, pinCode: '', status: 'ACTIVE' });
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: typeof employees[0]) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      username: employee.username,
      role: employee.role,
      pinCode: employee.pinCode,
      status: employee.status,
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async () => {
    try {
      if (!employeeForm.name.trim()) {
        alert('Vui lòng nhập tên nhân viên');
        return;
      }
      if (!employeeForm.username.trim()) {
        alert('Vui lòng nhập tên đăng nhập');
        return;
      }
      if (!employeeForm.pinCode || employeeForm.pinCode.length < 4) {
        alert('Mã PIN phải tối thiểu 4 chữ số');
        return;
      }
      if (!/^\d{4,}$/.test(employeeForm.pinCode)) {
        alert('Mã PIN chỉ chứa số');
        return;
      }

      setIsSubmittingEmployee(true);

      if (editingEmployee) {
        await updateEmployee({
          id: editingEmployee.id,
          ...employeeForm,
        });
      } else {
        await addEmployee(employeeForm);
      }

      setShowEmployeeModal(false);
      setEmployeeForm({ name: '', username: '', role: 'STAFF' as unknown as Role, pinCode: '', status: 'ACTIVE' });
    } catch (err) {
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const handleGeneratePin = async () => {
    try {
      setIsGeneratingPin(true);
      const newPin = await generateUniquePIN();
      setEmployeeForm({ ...employeeForm, pinCode: newPin });
    } catch (err) {
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsGeneratingPin(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Bạn chắc chắn muốn khóa nhân viên này không?')) {
      try {
        await deleteEmployee(id);
      } catch (err) {
        alert('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        {/* Sidebar - Hidden on mobile, visible on md+ */}
        <aside className="hidden md:flex w-72 bg-slate-900 text-white flex flex-col shrink-0">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-900/40"><Rocket size={24}/></div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter">LAUNGON <span className="text-rose-600">PRO</span></h1>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Admin Control Center</p>
                    </div>
                </div>
                
                <nav className="space-y-1">
                    {[
                        { id: 'DASHBOARD', icon: LayoutDashboard, label: 'TỔNG QUAN' },
                        { id: 'MENU', icon: MenuIcon, label: 'THỰC ĐƠN' },
                        { id: 'EMPLOYEES', icon: Users, label: 'NHÂN VIÊN' },
                        { id: 'SETTINGS', icon: Settings, label: 'CÀI ĐẶT' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/40' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            <tab.icon size={18}/> {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-auto p-8 border-t border-slate-800/50">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-400 transition-colors"
                >
                    <LogOut size={18}/> ĐĂNG XUẤT
                </button>
            </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center justify-between mb-6">
                <h1 className="text-xl font-black text-slate-800">LAUNGON <span className="text-rose-600">PRO</span></h1>
                <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50"
                >
                    <MenuIcon size={24} className="text-slate-800"/>
                </button>
            </div>

            {/* Mobile Menu Drawer */}
            {showMobileMenu && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center"><Rocket size={24}/></div>
                                <div>
                                    <h1 className="text-lg font-black uppercase tracking-tight">LAUNGON <span className="text-rose-600">PRO</span></h1>
                                    <p className="text-[8px] font-bold text-slate-500">Admin Control</p>
                                </div>
                            </div>
                            
                            <nav className="space-y-1">
                                {[
                                    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'TỔNG QUAN' },
                                    { id: 'MENU', icon: MenuIcon, label: 'THỰC ĐƠN' },
                                    { id: 'EMPLOYEES', icon: Users, label: 'NHÂN VIÊN' },
                                    { id: 'SETTINGS', icon: Settings, label: 'CÀI ĐẶT' }
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id as any);
                                            setShowMobileMenu(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        <tab.icon size={16}/> {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        <div className="mt-auto p-6 border-t border-slate-800">
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login', { replace: true });
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-rose-400 transition-colors"
                            >
                                <LogOut size={16}/> ĐĂNG XUẤT
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'DASHBOARD' && (
                <div className="max-w-6xl mx-auto space-y-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">DASHBOARD</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Dữ liệu kinh doanh thời gian thực</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                                <Calendar size={18} className="text-slate-400"/>
                                <span className="text-xs font-black text-slate-800 uppercase">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
                            </div>
                            <button
                                onClick={() => setShowCloseDayModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                            >
                                <Power size={16} />
                                KẾT THÚC NGÀY
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards Luxury */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp size={30}/></div>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">+12.5%</span>
                            </div>
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">DOANH THU</h3>
                            <div className="text-4xl font-black text-slate-800">{totalRevenue.toLocaleString()}đ</div>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Layers size={30}/></div>
                                <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">85% Capacity</span>
                            </div>
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">ĐƠN HÀNG</h3>
                            <div className="text-4xl font-black text-slate-800">{totalOrders} ĐƠN</div>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Sparkles size={30}/></div>
                            </div>
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">BEST SELLER</h3>
                            <div className="text-xl font-black text-slate-800 line-clamp-1 truncate">{chartData[0]?.name || 'N/A'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Chart Area */}
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-8">TOP MÓN BÁN CHẠY</h3>
                            <div className="w-full h-80 flex">
                                <ResponsiveContainer width="100%" height={320} minWidth={0}>
                                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="quantity" radius={[12, 12, 0, 0]} barSize={40}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* AI Insight Center - Cao cấp hơn */}
                        <div className="bg-slate-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl transition-all group-hover:bg-rose-600/20"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-900/40"><Sparkles size={20}/></div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest">AI INSIGHTS</h3>
                                    </div>
                                    <button 
                                        onClick={handleGenerateReport}
                                        disabled={isLoadingReport}
                                        className="bg-white text-slate-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {isLoadingReport ? 'ĐANG PHÂN TÍCH...' : 'PHÂN TÍCH NGAY'}
                                    </button>
                                </div>
                                
                                <div className="flex-1 bg-white/5 backdrop-blur-md rounded-[32px] p-6 text-slate-300 text-sm leading-relaxed border border-white/10 overflow-y-auto max-h-[250px] custom-scrollbar">
                                    {aiReport ? (
                                        <div className="animate-in fade-in duration-700">
                                            {aiReport.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                            <Rocket size={40} className="mb-4" />
                                            <p className="font-bold">Nhấn "Phân tích ngay" để Gemini AI gợi ý các chiến lược tăng trưởng doanh thu dựa trên dữ liệu thật của bạn.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-8 flex items-center gap-4 text-slate-500 text-[10px] font-bold">
                                    <div className="flex -space-x-2">
                                        {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px]">{i}</div>)}
                                    </div>
                                    <span>HỆ THỐNG ĐANG PHÂN TÍCH 1,240 ĐIỂM DỮ LIỆU</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'SETTINGS' && (
                <div className="max-w-4xl mx-auto">
                    <div className="mb-10">
                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">CÀI ĐẶT</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Quản lý hệ thống và dữ liệu</p>
                    </div>

                    {/* Clear Today's Revenue Section */}
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">🗑️ Xóa Doanh Thu Hôm Nay</h3>
                            <p className="text-slate-500 font-bold text-sm">Xóa tất cả các đơn hàng được tạo hôm nay (từ 00:00 đến nay). Doanh thu sẽ được xóa khỏi hệ thống.</p>
                        </div>

                        <div className="bg-red-50 border border-red-200 p-6 rounded-[24px] mb-8">
                            <p className="text-red-800 font-bold text-sm">
                                ⚠️ <strong>CẢNH BÁO:</strong> Hành động này <strong>KHÔNG THỂ HOÀN TÁC</strong>. Tất cả đơn hàng hôm nay sẽ bị xóa vĩnh viễn.
                            </p>
                        </div>

                        {/* Current Day Revenue Display */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-[24px] mb-8">
                            <p className="text-blue-600 font-bold text-sm mb-2">💰 Doanh thu hôm nay:</p>
                            <div className="text-3xl font-black text-blue-900">
                                {orders.filter(o => {
                                    const orderDate = new Date(o.startTime).toDateString();
                                    const today = new Date().toDateString();
                                    return orderDate === today;
                                }).reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}đ
                            </div>
                            <p className="text-blue-600 text-sm mt-2">
                                Từ {orders.filter(o => {
                                    const orderDate = new Date(o.startTime).toDateString();
                                    const today = new Date().toDateString();
                                    return orderDate === today;
                                }).length} đơn hàng
                            </p>
                        </div>

                        {clearRevenueResult && (
                            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-[24px] mb-8">
                                <div className="font-black text-emerald-800 mb-2">✅ Xóa thành công!</div>
                                <div className="text-sm text-emerald-700 space-y-1">
                                    <p>• Đơn hàng bị xóa: {clearRevenueResult.ordersDeleted}</p>
                                    <p className="font-bold mt-2">• Doanh thu xóa: {clearRevenueResult.revenueCleared.toLocaleString()}đ</p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => setShowClearRevenueModal(true)}
                            disabled={isClearingRevenue}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-red-900/40"
                        >
                            {isClearingRevenue ? '⏳ ĐANG XÓA...' : '🗑️ XÓA DOANH THU HÔM NAY'}
                        </button>

                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl">
                            <h4 className="font-black text-slate-800 text-sm uppercase mb-4">⚠️ Lưu ý quan trọng:</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li>✅ Xóa <strong>TẤT CẢ đơn hàng</strong> được tạo hôm nay (từ 00:00 đến nay)</li>
                                <li>✅ Xóa doanh thu tương ứng khỏi báo cáo tài chính</li>
                                <li>❌ <strong>KHÔNG thể hoàn tác</strong> hành động này</li>
                                <li>❌ <strong>KHÔNG xóa</strong> menu, bàn, hoặc cấu hình hệ thống</li>
                                <li>ℹ️ Chỉ nên sử dụng khi cần xóa dữ liệu test hoặc dữ liệu lỗi</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Revenue Modal */}
            {showClearRevenueModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 space-y-6">
                        {!clearRevenueResult ? (
                            <>
                                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-200">
                                    <AlertCircle size={32} className="text-red-600 flex-shrink-0"/>
                                    <div>
                                        <h3 className="font-black text-red-700 text-sm uppercase">🚨 CẢNH BÁO</h3>
                                        <p className="text-xs text-red-600 mt-1">Hành động này <strong>KHÔNG THỂ HOÀN TÁC</strong></p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-2xl font-black text-slate-800">Xóa doanh thu hôm nay?</h2>
                                    <p className="text-sm text-slate-600">Hành động này sẽ:</p>
                                    <ul className="space-y-2 text-xs text-slate-600 ml-4">
                                        <li>✗ <strong>Xóa vĩnh viễn</strong> tất cả đơn hàng hôm nay</li>
                                        <li>✗ <strong>Xóa doanh thu</strong> khỏi báo cáo</li>
                                        <li>✗ <strong>Làm trống</strong> màn hình Bếp và Thu ngân</li>
                                    </ul>
                                </div>

                                {/* Today's Revenue Summary */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                                    <p className="font-black text-blue-700 text-sm mb-2">💰 Doanh thu sẽ bị xóa:</p>
                                    <p className="text-2xl font-black text-blue-900">
                                        {orders.filter(o => {
                                            const orderDate = new Date(o.startTime).toDateString();
                                            const today = new Date().toDateString();
                                            return orderDate === today;
                                        }).reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}đ
                                    </p>
                                    <p className="text-xs text-blue-600 mt-2">
                                        Từ {orders.filter(o => {
                                            const orderDate = new Date(o.startTime).toDateString();
                                            const today = new Date().toDateString();
                                            return orderDate === today;
                                        }).length} đơn hàng
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowClearRevenueModal(false)}
                                        disabled={isClearingRevenue}
                                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black uppercase text-xs py-3 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleClearRevenue}
                                        disabled={isClearingRevenue}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isClearingRevenue ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                Đang xóa...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={16} />
                                                Xóa ngay
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-xl">✓</div>
                                    <div>
                                        <h3 className="font-black text-emerald-700 text-sm uppercase">Xóa thành công!</h3>
                                        <p className="text-xs text-emerald-600 mt-1">Doanh thu hôm nay đã bị xóa</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-black text-slate-800 text-sm uppercase">Thống kê:</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-xl">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Đơn hàng xóa</p>
                                            <p className="text-2xl font-black text-slate-800">{clearRevenueResult.ordersDeleted}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Doanh thu xóa</p>
                                            <p className="text-lg font-black text-slate-800">{clearRevenueResult.revenueCleared.toLocaleString()}đ</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowClearRevenueModal(false);
                                        setClearRevenueResult(null);
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-colors"
                                >
                                    Đóng
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Close Day Modal */}
            {showCloseDayModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 space-y-6">
                        {!closeResult ? (
                            <>
                                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-200">
                                    <AlertCircle size={32} className="text-red-600 flex-shrink-0"/>
                                    <div>
                                        <h3 className="font-black text-red-700 text-sm uppercase">⚠️ CẢNH BÁO</h3>
                                        <p className="text-xs text-red-600 mt-1">Hành động này <strong>KHÔNG THỂ HOÀN TÁC</strong></p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-2xl font-black text-slate-800">Kết thúc ngày?</h2>
                                    <p className="text-sm text-slate-600">Hành động này sẽ:</p>
                                    <ul className="space-y-2 text-xs text-slate-600 ml-4">
                                        <li>✓ Reset <strong>tất cả bàn</strong> về trạng thái EMPTY</li>
                                        <li>✓ Xóa <strong>order ID</strong> khỏi các bàn</li>
                                        <li>✓ Lưu trữ <strong>đơn hàng chưa thanh toán</strong> (ARCHIVED)</li>
                                        <li>✓ Làm sạch màn hình Bếp và Thu ngân</li>
                                    </ul>
                                </div>

                                {/* Unpaid Orders Warning */}
                                {orders.filter(o => !o.isPaid).length > 0 && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                        <p className="font-black text-amber-700 text-sm mb-2">
                                            ⚠️ Còn {orders.filter(o => !o.isPaid).length} bàn chưa thanh toán
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            Các đơn hàng này sẽ được chuyển sang trạng thái ARCHIVED
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowCloseDayModal(false)}
                                        disabled={isClosingDay}
                                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black uppercase text-xs py-3 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleCloseDay}
                                        disabled={isClosingDay}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isClosingDay ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <Power size={16} />
                                                Kết thúc ngày
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-xl">✓</div>
                                    <div>
                                        <h3 className="font-black text-emerald-700 text-sm uppercase">Thành công!</h3>
                                        <p className="text-xs text-emerald-600 mt-1">Hệ thống đã sẵn sàng cho ngày mới</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-black text-slate-800 text-sm uppercase">Thống kê kết thúc:</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-xl">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Bàn Reset</p>
                                            <p className="text-2xl font-black text-slate-800">{closeResult.tablesReset}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Đơn Hàng Lưu</p>
                                            <p className="text-2xl font-black text-slate-800">{closeResult.ordersArchived}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowCloseDayModal(false);
                                        setCloseResult(null);
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-colors"
                                >
                                    Đóng
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* EMPLOYEES TAB */}
            {activeTab === 'EMPLOYEES' && (
                <div className="max-w-7xl mx-auto">
                    <div className="mb-10 flex justify-between items-end">
                        <div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">NHÂN SỰ</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Quản lý đội ngũ nhân viên</p>
                        </div>
                        <button
                            onClick={handleAddEmployee}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                        >
                            <Plus size={20} />
                            Thêm nhân viên mới
                        </button>
                    </div>

                    {/* Employees Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {employees.map(employee => (
                            <div key={employee.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                                {/* Avatar & Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                                        {employee.role === 'ADMIN' && <Shield size={28} className="text-slate-900" />}
                                        {employee.role === 'KITCHEN' && <ChefHat size={28} className="text-orange-600" />}
                                        {employee.role === 'CASHIER' && <PhoneIcon size={28} className="text-blue-600" />}
                                        {employee.role === 'STAFF' && <Users size={28} className="text-emerald-600" />}
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${employee.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                </div>

                                {/* Name & Role */}
                                <h3 className="text-xl font-black text-slate-800 mb-2">{employee.name}</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${
                                        employee.role === 'ADMIN' ? 'bg-slate-900 text-white' :
                                        employee.role === 'KITCHEN' ? 'bg-orange-100 text-orange-800' :
                                        employee.role === 'CASHIER' ? 'bg-blue-100 text-blue-800' :
                                        'bg-emerald-100 text-emerald-800'
                                    }`}>
                                        {employee.role}
                                    </span>
                                </div>

                                {/* PIN Code */}
                                <div className="bg-slate-50 p-3 rounded-xl mb-4">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Mã PIN</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-black text-slate-800 tracking-widest">
                                            {showPinCode === employee.id ? employee.pinCode : '••••'}
                                        </span>
                                        <button
                                            onClick={() => setShowPinCode(showPinCode === employee.id ? null : employee.id)}
                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPinCode === employee.id ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="text-xs text-slate-500 font-bold mb-4 uppercase">
                                    Trạng thái: <span className={employee.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}>
                                        {employee.status === 'ACTIVE' ? '✓ Hoạt động' : '✗ Bị khóa'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditEmployee(employee)}
                                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-black text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit size={16} />
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmployee(employee.id)}
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 font-black text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Khóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {employees.length === 0 && (
                        <div className="text-center py-20">
                            <Users size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-400 font-bold">Chưa có nhân viên nào. Hãy thêm nhân viên mới!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Employee Modal */}
            {showEmployeeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-800">
                                {editingEmployee ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên'}
                            </h2>
                            <button
                                onClick={() => setShowEmployeeModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Tên nhân viên</label>
                                <input
                                    type="text"
                                    value={employeeForm.name}
                                    onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-100 rounded-xl border border-slate-200 focus:border-rose-600 focus:outline-none font-bold"
                                    placeholder="VD: Nguyễn Văn A"
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Tên đăng nhập (duy nhất)</label>
                                <input
                                    type="text"
                                    value={employeeForm.username}
                                    onChange={(e) => setEmployeeForm({...employeeForm, username: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-100 rounded-xl border border-slate-200 focus:border-rose-600 focus:outline-none font-bold"
                                    placeholder="VD: nguyen_van_a"
                                />
                                <p className="text-xs text-slate-500 mt-1">Dùng để đăng nhập cùng với mã PIN</p>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Vai trò</label>
                                <div className="space-y-2">
                                    {['ADMIN', 'KITCHEN', 'CASHIER', 'STAFF'].map(role => (
                                        <label key={role} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="role"
                                                value={role}
                                                checked={employeeForm.role === role}
                                                onChange={(e) => setEmployeeForm({...employeeForm, role: e.target.value as Role})}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm font-bold text-slate-700">{role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* PIN Code */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Mã PIN (tối thiểu 4 chữ số)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={employeeForm.pinCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setEmployeeForm({...employeeForm, pinCode: val});
                                        }}
                                        className="flex-1 px-4 py-3 bg-slate-100 rounded-xl border border-slate-200 focus:border-rose-600 focus:outline-none font-black text-center text-2xl tracking-widest"
                                        placeholder="0000"
                                    />
                                    <button
                                        onClick={handleGeneratePin}
                                        disabled={isGeneratingPin}
                                        className="bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white px-4 py-3 rounded-xl font-black transition-all flex items-center gap-2"
                                        title="Tạo mã PIN 4 chữ số tự động"
                                    >
                                        <Dices size={18} />
                                        {isGeneratingPin ? 'Đang tạo...' : 'Tạo'}
                                    </button>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Trạng thái</label>
                                <div className="flex gap-2">
                                    <label className="flex-1 flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="ACTIVE"
                                            checked={employeeForm.status === 'ACTIVE'}
                                            onChange={() => setEmployeeForm({...employeeForm, status: 'ACTIVE'})}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-bold text-emerald-600">Hoạt động</span>
                                    </label>
                                    <label className="flex-1 flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="INACTIVE"
                                            checked={employeeForm.status === 'INACTIVE'}
                                            onChange={() => setEmployeeForm({...employeeForm, status: 'INACTIVE'})}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-bold text-red-600">Bị khóa</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowEmployeeModal(false)}
                                disabled={isSubmittingEmployee}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black uppercase text-xs py-3 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveEmployee}
                                disabled={isSubmittingEmployee}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmittingEmployee ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Lưu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Menu Management & Employees Tab tinh chỉnh UI tương tự ... */}
        </main>
    </div>
  );
};

export default AdminView;
