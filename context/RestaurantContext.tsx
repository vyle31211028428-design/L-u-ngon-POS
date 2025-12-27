/**
 * RestaurantContext.tsx
 * Global state management cho ứng dụng POS
 * Data source: Supabase PostgreSQL với Real-time subscriptions
 * 
 * Mô hình:
 * - Fetch dữ liệu từ Supabase khi ứng dụng khởi động
 * - Lắng nghe real-time changes từ tất cả bảng
 * - CRUD operations gọi trực tiếp Supabase, UI cập nhật via real-time
 */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import {
  MenuItem,
  Order,
  OrderItem,
  OrderItemStatus,
  Table,
  TableStatus,
  Discount,
  Reservation,
  Role,
  Employee,
} from '../types';
import { supabase } from '../services/supabaseClient';
import { generateId } from '../src/utils/ui';

// ============================================================
// TYPES
// ============================================================

interface RestaurantContextType {
  // Global state
  role: Role | null;
  setRole: (role: Role | null) => void;
  menu: MenuItem[];
  tables: Table[];
  orders: Order[];
  reservations: Reservation[];
  employees: Employee[];
  activeTableId: string | null;
  setActiveTableId: (id: string | null) => void;
  isLoading: boolean;
  error: string | null;

  // Table & Order operations
  startTableSession: (tableId: string, guestCount: number) => Promise<void>;
  addItemToOrder: (
    tableId: string,
    item: MenuItem,
    quantity: number,
    note?: string,
    selectedOptions?: string[],
    variantPrice?: number
  ) => Promise<void>;
  updateOrderItemStatus: (
    orderId: string,
    itemId: string,
    status: OrderItemStatus
  ) => Promise<void>;
  updateOrderItemKitchenNote: (
    orderId: string,
    itemId: string,
    note: string
  ) => Promise<void>;
  requestBill: (tableId: string) => Promise<void>;
  checkoutTable: (
    tableId: string,
    paymentMethod: 'CASH' | 'QR' | 'CARD'
  ) => Promise<void>;
  closeTable: (tableId: string) => Promise<void>;

  // Advanced operations
  moveTable: (fromTableId: string, toTableId: string) => Promise<void>;
  applyDiscount: (orderId: string, discount: Discount) => Promise<void>;
  markItemOutOfStock: (menuItemId: string) => Promise<void>;

  // Reservation operations
  addReservation: (
    res: Omit<Reservation, 'id' | 'status' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  checkInReservation: (reservationId: string, tableId: string) => Promise<void>;

  // Menu operations
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  reorderMenu: (newMenu: MenuItem[]) => Promise<void>;
  deleteOldData: (daysOld?: number) => Promise<{ ordersDeleted: number; reservationsDeleted: number; total: number }>;
  refreshData: () => Promise<void>;
  closeDay: () => Promise<{ tablesReset: number; ordersArchived: number; reservationsArchived: number; message: string }>;
  clearTodayRevenue: () => Promise<{ ordersDeleted: number; revenueCleared: number }>;

  // Employee operations
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  generateUniquePIN: () => Promise<string>;
}

// ============================================================
// CONTEXT
// ============================================================

const RestaurantContext = createContext<RestaurantContextType | undefined>(
  undefined
);

export const useRestaurant = (): RestaurantContextType => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};

// ============================================================
// PROVIDER
// ============================================================

export const RestaurantProvider = ({ children }: { children?: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // DATA TRANSFORMATION UTILITIES
  // ============================================================

  /**
   * Transform từ database (snake_case) sang app (camelCase)
   */
  const transformMenu = (dbItem: any): MenuItem => ({
    id: dbItem.id,
    name: dbItem.name,
    price: dbItem.price,
    category: dbItem.category,
    image: dbItem.image,
    description: dbItem.description,
    available: dbItem.available,
    type: dbItem.type,
    comboGroups: dbItem.combo_groups || [],
    isRecommended: dbItem.is_recommended || false,
    ingredients: dbItem.ingredients || [],
  });

  const transformTable = (dbItem: any): Table => ({
    id: dbItem.id,
    name: dbItem.name,
    status: dbItem.status,
    guestCount: dbItem.guest_count,
    billRequested: dbItem.bill_requested || false,
    currentOrderId: dbItem.current_order_id,
    reservationId: dbItem.reservation_id,
    position: dbItem.position,
    section: dbItem.section,
  });

  const transformOrder = (dbItem: any): Order => {
    // Parse items if it's a string (from JSONB)
    let items = dbItem.items || [];
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.error('Failed to parse order items:', items, e);
        items = [];
      }
    }

    console.log('transformOrder - id:', dbItem.id, 'items count:', Array.isArray(items) ? items.length : 0, 'items:', items);

    return {
      id: dbItem.id,
      tableId: dbItem.table_id,
      items: Array.isArray(items) ? items : [],
      startTime: dbItem.start_time,
      totalAmount: dbItem.total_amount,
      isPaid: dbItem.is_paid,
      paymentMethod: dbItem.payment_method,
      discount: dbItem.discount,
      finalAmount: dbItem.final_amount,
      taxAmount: dbItem.tax_amount,
      grandTotal: dbItem.grand_total,
    };
  };

  const transformReservation = (dbItem: any): Reservation => ({
    id: dbItem.id,
    customerName: dbItem.customer_name,
    phone: dbItem.phone,
    time: dbItem.time,
    guestCount: dbItem.guest_count,
    tableId: dbItem.table_id,
    status: dbItem.status,
    note: dbItem.note,
  });

  const transformEmployee = (dbItem: any): Employee => ({
    id: dbItem.id,
    name: dbItem.name,
    role: dbItem.role,
    pinCode: dbItem.pin_code,
    status: dbItem.status,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
  });

  /**
   * Transform từ app (camelCase) sang database (snake_case)
   */
  const toDbMenu = (item: MenuItem): any => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    image: item.image,
    description: item.description,
    available: item.available,
    type: item.type,
    combo_groups: item.comboGroups || [],
    is_recommended: item.isRecommended || false,
    ingredients: item.ingredients || [],
  });

  const toDbTable = (item: Table): any => ({
    id: item.id,
    name: item.name,
    status: item.status,
    guest_count: item.guestCount,
    bill_requested: item.billRequested,
    current_order_id: item.currentOrderId,
    reservation_id: item.reservationId,
    position: item.position,
    section: item.section,
  });

  const toDbOrder = (item: Order): any => ({
    id: item.id,
    table_id: item.tableId,
    items: item.items,
    start_time: item.startTime,
    total_amount: item.totalAmount,
    is_paid: item.isPaid,
    payment_method: item.paymentMethod,
    discount: item.discount,
    final_amount: item.finalAmount,
    tax_amount: item.taxAmount,
    grand_total: item.grandTotal,
  });

  const toDbReservation = (item: Reservation): any => ({
    id: item.id,
    customer_name: item.customerName,
    phone: item.phone,
    time: item.time,
    guest_count: item.guestCount,
    table_id: item.tableId,
    status: item.status,
    note: item.note,
  });

  const toDbEmployee = (item: Employee): any => ({
    id: item.id,
    name: item.name,
    role: item.role,
    pin_code: item.pinCode,
    status: item.status,
  });

  // ============================================================
  // INITIALIZATION & REAL-TIME SUBSCRIPTIONS
  // ============================================================

  useEffect(() => {
    const initializeAndSubscribe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch initial data in parallel
        const [menuRes, tablesRes, ordersRes, reservationsRes, employeesRes] = await Promise.all([
          supabase.from('menu').select('*'),
          supabase.from('tables').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('reservations').select('*'),
          supabase.from('employees').select('*'),
        ]);

        // Handle errors
        if (menuRes.error) throw menuRes.error;
        if (tablesRes.error) throw tablesRes.error;
        if (ordersRes.error) throw ordersRes.error;
        if (reservationsRes.error) throw reservationsRes.error;
        if (employeesRes.error) throw employeesRes.error;

        // Set initial state
        if (menuRes.data) setMenu(menuRes.data.map(transformMenu));
        if (tablesRes.data) setTables(tablesRes.data.map(transformTable));
        if (ordersRes.data) setOrders(ordersRes.data.map(transformOrder));
        if (reservationsRes.data)
          setReservations(reservationsRes.data.map(transformReservation));
        if (employeesRes.data)
          setEmployees(employeesRes.data.map(transformEmployee));

        setIsLoading(false);

        // Setup real-time subscriptions
        const menuSubscription = supabase
          .channel('public:menu')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'menu' },
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                setMenu(prev => [...prev, transformMenu(payload.new)]);
              } else if (payload.eventType === 'UPDATE') {
                setMenu(prev =>
                  prev.map(m =>
                    m.id === payload.new.id ? transformMenu(payload.new) : m
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setMenu(prev => prev.filter(m => m.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        const tablesSubscription = supabase
          .channel('public:tables')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tables' },
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                setTables(prev => [...prev, transformTable(payload.new)]);
              } else if (payload.eventType === 'UPDATE') {
                setTables(prev =>
                  prev.map(t =>
                    t.id === payload.new.id ? transformTable(payload.new) : t
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setTables(prev => prev.filter(t => t.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        const ordersSubscription = supabase
          .channel('public:orders')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload: any) => {
              console.log('🔄 REALTIME UPDATE (orders):', payload.eventType, payload.new?.id || payload.old?.id);
              if (payload.eventType === 'INSERT') {
                setOrders(prev => [...prev, transformOrder(payload.new)]);
                console.log('✅ Order inserted:', payload.new.id);
              } else if (payload.eventType === 'UPDATE') {
                setOrders(prev =>
                  prev.map(o =>
                    o.id === payload.new.id ? transformOrder(payload.new) : o
                  )
                );
                console.log('✅ Order updated:', payload.new.id);
              } else if (payload.eventType === 'DELETE') {
                setOrders(prev => prev.filter(o => o.id !== payload.old.id));
                console.log('✅ Order deleted:', payload.old.id);
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Orders subscription status:', status);
          });

        const reservationsSubscription = supabase
          .channel('public:reservations')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'reservations' },
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                setReservations(prev => [...prev, transformReservation(payload.new)]);
              } else if (payload.eventType === 'UPDATE') {
                setReservations(prev =>
                  prev.map(r =>
                    r.id === payload.new.id ? transformReservation(payload.new) : r
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setReservations(prev => prev.filter(r => r.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        const employeesSubscription = supabase
          .channel('public:employees')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'employees' },
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                setEmployees(prev => [...prev, transformEmployee(payload.new)]);
              } else if (payload.eventType === 'UPDATE') {
                setEmployees(prev =>
                  prev.map(e =>
                    e.id === payload.new.id ? transformEmployee(payload.new) : e
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setEmployees(prev => prev.filter(e => e.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // Cleanup subscriptions on unmount
        return () => {
          supabase.removeChannel(menuSubscription);
          supabase.removeChannel(tablesSubscription);
          supabase.removeChannel(ordersSubscription);
          supabase.removeChannel(reservationsSubscription);
          supabase.removeChannel(employeesSubscription);
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setIsLoading(false);
        console.error('Failed to initialize database:', err);
      }
    };

    initializeAndSubscribe();
  }, []);

  // ============================================================
  // TABLE & ORDER OPERATIONS
  // ============================================================

  const startTableSession = useCallback(
    async (tableId: string, guestCount: number) => {
      try {
        // Create new order (without id - let Supabase generate UUID)
        const orderData = {
          table_id: tableId,
          items: [],
          start_time: Date.now(),
          total_amount: 0,
          is_paid: false,
        };

        // Insert order and get the returned ID
        const { data: insertedData, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select('id')
          .single();

        if (orderError) throw orderError;
        if (!insertedData?.id) throw new Error('Failed to get order ID');

        const orderId = insertedData.id;

        // Update table: set current_order_id, guest_count, status
        const { error: tableError } = await supabase
          .from('tables')
          .update({
            current_order_id: orderId,
            guest_count: guestCount,
            status: 'OCCUPIED',
          })
          .eq('id', tableId);

        if (tableError) throw tableError;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error starting table session:', err);
        throw err;
      }
    },
    []
  );

  const addItemToOrder = useCallback(
    async (
      tableId: string,
      item: MenuItem,
      quantity: number,
      note?: string,
      selectedOptions?: string[],
      variantPrice?: number
    ) => {
      try {
        // Lấy active order của bàn
        const { data: activeOrders, error: queryError } = await supabase
          .from('orders')
          .select('*')
          .eq('table_id', tableId)
          .eq('is_paid', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (queryError) throw queryError;
        if (!activeOrders || activeOrders.length === 0) {
          throw new Error('Không tìm thấy đơn hàng hoạt động cho bàn này');
        }

        const order = transformOrder(activeOrders[0]);

        // Tạo order item mới
        const newItem: OrderItem = {
          id: generateId('item'),
          menuItemId: item.id,
          name: item.name,
          price: variantPrice || item.price,
          quantity,
          note,
          selectedOptions,
          status: OrderItemStatus.PENDING,
          timestamp: Date.now(),
        };

        // Thêm item vào mảng items
        const updatedItems = [...order.items, newItem];

        // Tính lại total_amount
        const newTotal = updatedItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );

        // Update order
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            items: updatedItems,
            total_amount: newTotal,
          })
          .eq('id', order.id);

        if (updateError) throw updateError;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error adding item to order:', err);
        throw err;
      }
    },
    []
  );

  const updateOrderItemStatus = useCallback(
    async (orderId: string, itemId: string, status: OrderItemStatus) => {
      try {
        // Lấy order
        const { data: orderData, error: queryError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (queryError) throw queryError;
        if (!orderData) throw new Error('Order not found');

        const order = transformOrder(orderData);

        // Update item trong array
        const updatedItems = order.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                status,
                prepStartTime: status === 'PREPARING' ? Date.now() : item.prepStartTime,
              }
            : item
        );

        // Update order
        const { error: updateError } = await supabase
          .from('orders')
          .update({ items: updatedItems })
          .eq('id', orderId);

        if (updateError) throw updateError;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error updating item status:', err);
        throw err;
      }
    },
    []
  );

  const updateOrderItemKitchenNote = useCallback(
    async (orderId: string, itemId: string, kitchenNote: string) => {
      try {
        const { data: orderData, error: queryError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (queryError) throw queryError;
        if (!orderData) throw new Error('Order not found');

        const order = transformOrder(orderData);

        const updatedItems = order.items.map(item =>
          item.id === itemId ? { ...item, kitchenNote } : item
        );

        const { error: updateError } = await supabase
          .from('orders')
          .update({ items: updatedItems })
          .eq('id', orderId);

        if (updateError) throw updateError;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error updating kitchen note:', err);
        throw err;
      }
    },
    []
  );

  const requestBill = useCallback(async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ bill_requested: true })
        .eq('id', tableId);

      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error requesting bill:', err);
      throw err;
    }
  }, []);

  const checkoutTable = useCallback(
    async (tableId: string, paymentMethod: 'CASH' | 'QR' | 'CARD') => {
      try {
        // Lấy all active orders for table
        const { data: ordersData, error: queryError } = await supabase
          .from('orders')
          .select('*')
          .eq('table_id', tableId)
          .eq('is_paid', false);

        if (queryError) throw queryError;
        if (!ordersData || ordersData.length === 0) throw new Error('No active order found');

        // Calculate total for all orders
        let totalAmount = 0;
        const transformedOrders = ordersData.map(transformOrder);
        transformedOrders.forEach(order => {
          totalAmount += order.totalAmount;
        });

        // Tính tax và final amount (VAT 8% theo constants)
        const vatRate = 0.08;
        const taxAmount = totalAmount * vatRate;
        const grandTotal = totalAmount + taxAmount;

        // Update all orders: mark as paid
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            is_paid: true,
            payment_method: paymentMethod,
            tax_amount: taxAmount / ordersData.length,
            grand_total: grandTotal / ordersData.length,
            final_amount: totalAmount / ordersData.length,
          })
          .eq('table_id', tableId)
          .eq('is_paid', false);

        if (orderError) throw orderError;

        // Update table: reset
        const { error: tableError } = await supabase
          .from('tables')
          .update({
            status: 'DIRTY',
            current_order_id: null,
            guest_count: null,
            bill_requested: false,
          })
          .eq('id', tableId);

        if (tableError) throw tableError;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error checking out table:', err);
        throw err;
      }
    },
    []
  );

  const closeTable = useCallback(async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status: 'EMPTY', guest_count: null })
        .eq('id', tableId);

      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error closing table:', err);
      throw err;
    }
  }, []);

  // ============================================================
  // ADVANCED OPERATIONS
  // ============================================================

  const moveTable = useCallback(
    async (fromTableId: string, toTableId: string) => {
      try {
        // Lấy active order từ bàn cũ
        const { data: orderData, error: queryError } = await supabase
          .from('orders')
          .select('*')
          .eq('table_id', fromTableId)
          .eq('is_paid', false)
          .single();

        if (queryError && queryError.code !== 'PGRST116') throw queryError;
        if (!orderData) return; // Không có đơn hàng nào

        const order = transformOrder(orderData);

        // Update order: change table_id
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({ table_id: toTableId })
          .eq('id', order.id);

        if (updateOrderError) throw updateOrderError;

        // Update old table
        const { error: updateOldError } = await supabase
          .from('tables')
          .update({
            status: 'EMPTY',
            current_order_id: null,
            guest_count: null,
          })
          .eq('id', fromTableId);

        if (updateOldError) throw updateOldError;

        // Update new table
        const { error: updateNewError } = await supabase
          .from('tables')
          .update({
            current_order_id: order.id,
            status: 'OCCUPIED',
          })
          .eq('id', toTableId);

        if (updateNewError) throw updateNewError;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error moving table:', err);
        throw err;
      }
    },
    []
  );

  const applyDiscount = useCallback(async (orderId: string, discount: Discount) => {
    try {
      const { data: orderData, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (queryError) throw queryError;
      if (!orderData) throw new Error('Order not found');

      const order = transformOrder(orderData);

      // Tính final amount sau discount
      let discountAmount = 0;
      if (discount.type === 'PERCENT') {
        discountAmount = order.totalAmount * (discount.value / 100);
      } else {
        discountAmount = discount.value;
      }

      const finalAmount = Math.max(0, order.totalAmount - discountAmount);

      const { error } = await supabase
        .from('orders')
        .update({
          discount,
          final_amount: finalAmount,
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error applying discount:', err);
      throw err;
    }
  }, []);

  const markItemOutOfStock = useCallback(async (menuItemId: string) => {
    try {
      const { error } = await supabase
        .from('menu')
        .update({ available: false })
        .eq('id', menuItemId);

      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error marking item out of stock:', err);
      throw err;
    }
  }, []);

  // ============================================================
  // RESERVATION OPERATIONS
  // ============================================================

  const addReservation = useCallback(
    async (
      res: Omit<Reservation, 'id' | 'status' | 'created_at' | 'updated_at'>
    ) => {
      try {
        const newReservation: Reservation = {
          ...res,
          id: generateId('res'),
          status: 'PENDING',
        };

        const { error } = await supabase
          .from('reservations')
          .insert([toDbReservation(newReservation)]);

        if (error) throw error;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error adding reservation:', err);
        throw err;
      }
    },
    []
  );

  const cancelReservation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'CANCELLED' })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error cancelling reservation:', err);
      throw err;
    }
  }, []);

  const checkInReservation = useCallback(
    async (reservationId: string, tableId: string) => {
      try {
        // Update reservation
        const { error: resError } = await supabase
          .from('reservations')
          .update({ status: 'ARRIVED', table_id: tableId })
          .eq('id', reservationId);

        if (resError) throw resError;

        // Update table
        const { error: tableError } = await supabase
          .from('tables')
          .update({
            status: 'OCCUPIED',
            reservation_id: reservationId,
          })
          .eq('id', tableId);

        if (tableError) throw tableError;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error checking in reservation:', err);
        throw err;
      }
    },
    []
  );

  // ============================================================
  // MENU OPERATIONS
  // ============================================================

  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    try {
      const newItem: MenuItem = {
        ...item,
        id: generateId('menu'),
      };

      const { error } = await supabase
        .from('menu')
        .insert([toDbMenu(newItem)]);

      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error adding menu item:', err);
      throw err;
    }
  }, []);

  const updateMenuItem = useCallback(async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu')
        .update(toDbMenu(item))
        .eq('id', item.id);

      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error updating menu item:', err);
      throw err;
    }
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('menu').delete().eq('id', id);

      if (error) throw error;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error deleting menu item:', err);
      throw err;
    }
  }, []);

  const reorderMenu = useCallback(async (newMenu: MenuItem[]) => {
    try {
      // For now, just update the local state directly via mutations
      // In a full implementation, you might batch update order positions in DB
      setMenu(newMenu);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error reordering menu:', err);
      throw err;
    }
  }, []);

  // Refresh all data from Supabase (manual refresh)
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Refreshing data from Supabase...');

      const [menuRes, tablesRes, ordersRes, reservationsRes] = await Promise.all([
        supabase.from('menu').select('*'),
        supabase.from('tables').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('reservations').select('*'),
      ]);

      if (menuRes.data) setMenu(menuRes.data.map(transformMenu));
      if (tablesRes.data) setTables(tablesRes.data.map(transformTable));
      if (ordersRes.data) setOrders(ordersRes.data.map(transformOrder));
      if (reservationsRes.data) setReservations(reservationsRes.data.map(transformReservation));

      console.log('✅ Data refreshed');
      setIsLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error refreshing data:', err);
      setIsLoading(false);
    }
  }, []);
  
  const clearTodayRevenue = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      console.log(`🗑️ Clearing today's revenue (all orders from ${todayStart})...`);

      // Get all orders from today to calculate revenue
      const { data: todayOrders, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', todayStart);

      if (queryError) throw queryError;

      let revenueCleared = 0;
      if (todayOrders) {
        todayOrders.forEach(order => {
          const orderData = transformOrder(order);
          revenueCleared += orderData.totalAmount;
        });
      }

      // Delete all orders from today
      const { data: deletedOrders, error: ordersError } = await supabase
        .from('orders')
        .delete()
        .gte('created_at', todayStart)
        .select('id');

      if (ordersError) throw ordersError;

      const ordersDeleted = deletedOrders?.length || 0;
      console.log(`✅ Successfully cleared today's revenue: ${ordersDeleted} orders (${revenueCleared.toLocaleString()}đ)`);
      setError(null);
      
      // Refresh data
      await refreshData();
      
      return {
        ordersDeleted,
        revenueCleared,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error clearing today\'s revenue:', err);
      throw err;
    }
  }, [refreshData]);

  const deleteOldData = useCallback(async (daysOld: number = 1) => {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const cutoffDate = new Date(cutoffTime).toISOString();

      console.log(`🗑️ Deleting data older than ${daysOld} day(s)...`);

      // Delete paid orders older than X days
      const { data: deletedOrders, error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('is_paid', true)
        .lt('created_at', cutoffDate)
        .select('id');

      if (ordersError) throw ordersError;

      // Delete cancelled reservations older than X days
      const { data: deletedReservations, error: reservationsError } = await supabase
        .from('reservations')
        .delete()
        .eq('status', 'CANCELLED')
        .lt('created_at', cutoffDate)
        .select('id');

      if (reservationsError) throw reservationsError;

      const totalDeleted = (deletedOrders?.length || 0) + (deletedReservations?.length || 0);
      console.log(`✅ Successfully deleted ${totalDeleted} old records`);
      setError(null);
      
      return {
        ordersDeleted: deletedOrders?.length || 0,
        reservationsDeleted: deletedReservations?.length || 0,
        total: totalDeleted,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error deleting old data:', err);
      throw err;
    }
  }, []);

  const closeDay = useCallback(async () => {
    try {
      console.log('🌙 Closing day and resetting system...');
      
      // Call RPC function
      const { data, error } = await supabase.rpc('reset_daily_system');
      
      if (error) throw error;
      if (!data) throw new Error('No response from reset_daily_system');
      
      console.log('✅ Day closed successfully:', data);
      
      // Reload all data
      await refreshData();
      
      setError(null);
      
      return {
        tablesReset: data.tables_reset || 0,
        ordersArchived: data.orders_archived || 0,
        reservationsArchived: data.reservations_archived || 0,
        message: data.message || 'System reset complete',
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error closing day:', err);
      throw err;
    }
  }, [refreshData]);

  // ============================================================
  // EMPLOYEE OPERATIONS
  // ============================================================

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validate PIN code (minimum 4 digits)
      if (!employee.pinCode || !/^\d{4,}$/.test(employee.pinCode)) {
        throw new Error('Mã PIN phải tối thiểu 4 chữ số');
      }

      const { error } = await supabase
        .from('employees')
        .insert({
          name: employee.name,
          role: employee.role,
          pin_code: employee.pinCode,
          status: employee.status,
        });

      if (error) throw error;
      console.log('✅ Employee added:', employee.name);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error adding employee:', err);
      throw err;
    }
  }, []);

  const updateEmployee = useCallback(async (employee: Employee) => {
    try {
      // Validate PIN code (minimum 4 digits)
      if (!employee.pinCode || !/^\d{4,}$/.test(employee.pinCode)) {
        throw new Error('Mã PIN phải tối thiểu 4 chữ số');
      }

      const { error } = await supabase
        .from('employees')
        .update({
          name: employee.name,
          role: employee.role,
          pin_code: employee.pinCode,
          status: employee.status,
        })
        .eq('id', employee.id);

      if (error) throw error;
      console.log('✅ Employee updated:', employee.name);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error updating employee:', err);
      throw err;
    }
  }, []);

  const generateUniquePIN = useCallback(async (): Promise<string> => {
    try {
      let pin = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 50;

      while (!isUnique && attempts < maxAttempts) {
        // Generate random 4-digit PIN (0000-9999)
        pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

        // Check if PIN already exists in database
        const { data, error } = await supabase
          .from('employees')
          .select('id')
          .eq('pin_code', pin)
          .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique) {
        throw new Error('Could not generate unique PIN after 50 attempts');
      }

      return pin;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error generating PIN:', err);
      throw new Error('Lỗi tạo mã PIN: ' + errorMsg);
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      // Soft delete: change status to INACTIVE
      const { error } = await supabase
        .from('employees')
        .update({ status: 'INACTIVE' })
        .eq('id', id);

      if (error) throw error;
      console.log('✅ Employee deleted (soft delete):', id);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error deleting employee:', err);
      throw err;
    }
  }, []);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value: RestaurantContextType = {
    role,
    setRole,
    menu,
    tables,
    orders,
    reservations,
    employees,
    activeTableId,
    setActiveTableId,
    isLoading,
    error,
    startTableSession,
    addItemToOrder,
    updateOrderItemStatus,
    updateOrderItemKitchenNote,
    requestBill,
    checkoutTable,
    closeTable,
    moveTable,
    applyDiscount,
    markItemOutOfStock,
    addReservation,
    cancelReservation,
    checkInReservation,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenu,
    deleteOldData,
    refreshData,
    closeDay,
    clearTodayRevenue,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    generateUniquePIN,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

export default RestaurantProvider;
