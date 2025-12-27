## 🚀 HƯỚNG DẪN: Chuyển đổi sang Supabase

### 📋 Tóm tắt những gì đã được hoàn thành

Bạn vừa hoàn thành việc chuyển đổi toàn bộ Data Layer từ Mock Data sang **Supabase PostgreSQL** với Real-time Subscriptions.

---

## 📁 Các file đã tạo/sửa

### 1. **supabase_schema.sql** (File mới)
**Vị trí**: `/supabase_schema.sql`

Chứa đầy đủ SQL schema cho POS system:
- ✅ **menu**: Lưu menu items với JSONB cho combo_groups, ingredients
- ✅ **tables**: Quản lý bàn với status (EMPTY, OCCUPIED, DIRTY, RESERVED)
- ✅ **orders**: Đơn hàng với items lưu dạng JSONB để tối ưu POS
- ✅ **reservations**: Quản lý đặt bàn trước
- ✅ **Indexes**: Tối ưu query performance
- ✅ **REPLICA IDENTITY FULL**: Bật Real-time Subscriptions
- ✅ **RLS Policies**: Security rules (để phát triển, cho phép tất cả)
- ✅ **Helper Functions & Triggers**: Auto-update timestamp

**Cách dùng**:
```bash
# 1. Copy toàn bộ SQL từ file supabase_schema.sql
# 2. Mở Supabase Dashboard > SQL Editor
# 3. Paste và Execute
```

---

### 2. **components/DatabaseSetup.tsx** (File mới)
**Vị trí**: `/components/DatabaseSetup.tsx`

React component để:
- ✅ Kiểm tra kết nối Supabase
- ✅ Verify bảng menu, tables đã có dữ liệu chưa
- ✅ Tự động seed INITIAL_MENU, INITIAL_TABLES nếu bảng trống
- ✅ Hiển thị trạng thái setup (Loading → Success/Error)
- ✅ Chuyển đổi từ camelCase → snake_case trước khi insert

**Các bước**:
1. Chạy khi ứng dụng khởi động (được gọi từ App.tsx)
2. Hiển thị setup screen với progress bar
3. Sau khi hoàn tất (hoặc fail), cho phép skip để vào ứng dụng
4. Nếu lỗi, người dùng có thể "Thử lại" hoặc check .env.local

---

### 3. **context/RestaurantContext.tsx** (Rewrite hoàn toàn)
**Vị trị**: `/context/RestaurantContext.tsx`

File context đã được viết lại toàn bộ để:

#### ✅ **Initialization & Real-time**
```typescript
// 1. Fetch initial data từ Supabase khi mount
const [menuRes, tablesRes, ordersRes, reservationsRes] = await Promise.all([
  supabase.from('menu').select('*'),
  supabase.from('tables').select('*'),
  supabase.from('orders').select('*'),
  supabase.from('reservations').select('*'),
]);

// 2. Setup real-time subscriptions cho mỗi bảng
supabase
  .channel('public:menu')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, (payload) => {
    // INSERT/UPDATE/DELETE tự động cập nhật UI
  })
  .subscribe();
```

#### ✅ **Data Transformation Utilities**
```typescript
// Chuyển đổi từ DB (snake_case) → App (camelCase)
const transformMenu = (dbItem: any): MenuItem => ({
  ...
  comboGroups: dbItem.combo_groups || [],
  isRecommended: dbItem.is_recommended || false,
});

// Chuyển đổi từ App (camelCase) → DB (snake_case)
const toDbMenu = (item: MenuItem): any => ({
  ...
  combo_groups: item.comboGroups || [],
  is_recommended: item.isRecommended || false,
});
```

#### ✅ **CRUD Operations (Async/Promise-based)**

**1. Table & Order Operations**
```typescript
// Mở bàn: tạo order mới + update table status
const startTableSession = async (tableId: string, guestCount: number) => {
  // 1. Insert order mới vào DB
  // 2. Update table: current_order_id, guest_count, status=OCCUPIED
};

// Thêm món: get active order → add item → update total
const addItemToOrder = async (tableId: string, item: MenuItem, quantity: number) => {
  // 1. Fetch active order của bàn
  // 2. Create OrderItem object
  // 3. Push vào items array
  // 4. Tính lại total_amount
  // 5. Update order
};

// Update trạng thái món (Bếp: PENDING → PREPARING → READY)
const updateOrderItemStatus = async (orderId: string, itemId: string, status) => {
  // 1. Get order
  // 2. Find item trong items array, update status
  // 3. Update order
};

// Thanh toán: update order.is_paid, tính tax, change table status
const checkoutTable = async (tableId: string, paymentMethod: 'CASH' | 'QR' | 'CARD') => {
  // 1. Get active order
  // 2. Tính tax (VAT 8%), grand_total
  // 3. Update order: is_paid=true, payment_method, tax_amount, grand_total
  // 4. Update table: status=DIRTY, reset current_order_id
};
```

**2. Advanced Operations**
```typescript
// Chuyển bàn: move order từ bàn này sang bàn khác
const moveTable = async (fromTableId: string, toTableId: string) => {
  // 1. Get active order từ bàn cũ
  // 2. Update order.table_id
  // 3. Update old table: EMPTY
  // 4. Update new table: current_order_id, OCCUPIED
};

// Áp dụng giảm giá
const applyDiscount = async (orderId: string, discount: Discount) => {
  // 1. Get order
  // 2. Tính discountAmount = totalAmount * (percent/100) hoặc fixed value
  // 3. Update order.discount, final_amount
};
```

**3. Reservation Operations**
```typescript
const addReservation = async (res: ReservationInput) => {
  // Insert vào DB
};

const checkInReservation = async (reservationId: string, tableId: string) => {
  // Update reservation: status=ARRIVED, table_id
  // Update table: status=OCCUPIED, reservation_id
};
```

#### ✅ **Error Handling**
```typescript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Mỗi operation catch error và set state
try {
  // ... DB operation
} catch (err) {
  setError(err.message);
  console.error('Error:', err);
  throw err; // Re-throw để caller xử lý
}
```

---

### 4. **App.tsx** (Update)
**Vị trí**: `/App.tsx`

```typescript
const App = () => {
  const [setupComplete, setSetupComplete] = useState(false);

  // Hiển thị DatabaseSetup cho đến khi hoàn tất
  if (!setupComplete) {
    return <DatabaseSetup onSetupComplete={() => setSetupComplete(true)} />;
  }

  return (
    <RestaurantProvider>
      <MainApp />
    </RestaurantProvider>
  );
};

const MainApp = () => {
  const { role, isLoading, error } = useRestaurant();

  // Loading state: hiển thị spinner
  if (isLoading) {
    return <div>Đang tải dữ liệu...</div>;
  }

  // Error state: hiển thị error message + retry button
  if (error) {
    return <div>Lỗi: {error} <button onClick={() => window.location.reload()}>Thử lại</button></div>;
  }

  // Normal flow: render role-based views
  if (!role) return <RoleSelection />;
  // ... render views based on role
};
```

---

## 🔧 Cách sử dụng

### Step 1: Setup Supabase Project
```bash
# 1. Tạo Supabase project tại https://supabase.com
# 2. Copy URL & Key vào .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 2: Run SQL Schema
```bash
# 1. Copy toàn bộ content từ supabase_schema.sql
# 2. Vào Supabase Dashboard > SQL Editor
# 3. Paste + Execute
```

### Step 3: Start App
```bash
npm run dev
# Truy cập http://localhost:5173

# Lần đầu tiên:
# 1. DatabaseSetup chạy, kiểm tra kết nối
# 2. Nếu bảng trống, tự động seed INITIAL_MENU & INITIAL_TABLES
# 3. Sau ~2 giây, chuyển sang role selection screen
```

---

## 📊 Database Architecture

### **menu table**
```sql
- id: UUID (primary key)
- name: TEXT
- price: DECIMAL
- category: ENUM (COMBO, BROTH, MEAT, SEAFOOD, VEGGIE, DRINK, OTHER)
- type: ENUM (SINGLE, COMBO)
- combo_groups: JSONB -- [{id, title, min, max, options}]
- is_recommended: BOOLEAN
- ingredients: JSONB -- ["ingredient1", "ingredient2"]
- available: BOOLEAN
```

### **tables table**
```sql
- id: UUID
- name: TEXT (unique)
- status: ENUM (EMPTY, OCCUPIED, DIRTY, RESERVED)
- guest_count: INTEGER
- current_order_id: UUID (foreign key to orders)
- reservation_id: UUID (foreign key to reservations)
- bill_requested: BOOLEAN
- position: JSONB -- {x: number, y: number}
- section: TEXT
```

### **orders table**
```sql
- id: UUID
- table_id: UUID (foreign key)
- items: JSONB -- [{id, menuItemId, name, price, quantity, status, timestamp, ...}]
- start_time: BIGINT (unix timestamp)
- total_amount: DECIMAL
- is_paid: BOOLEAN
- payment_method: ENUM (CASH, QR, CARD)
- discount: JSONB -- {type: 'PERCENT'|'FIXED', value: number}
- final_amount: DECIMAL
- tax_amount: DECIMAL
- grand_total: DECIMAL
```

### **reservations table**
```sql
- id: UUID
- customer_name: TEXT
- phone: TEXT
- time: TEXT (ISO format or HH:mm)
- guest_count: INTEGER
- table_id: UUID (nullable, foreign key)
- status: ENUM (PENDING, ARRIVED, CANCELLED)
- note: TEXT
```

---

## 🔄 Real-time Flow

### Ví dụ: Khách gọi thêm "1 Lẩu Thái"

1. **CustomerView** gọi:
   ```typescript
   const { addItemToOrder } = useRestaurant();
   await addItemToOrder(activeTableId, lauThaiItem, 1);
   ```

2. **RestaurantContext** xử lý:
   ```typescript
   - Fetch active order từ Supabase
   - Create OrderItem: {id, menuItemId: 'combo-1', name: 'Lẩu Thái', ...}
   - Push vào order.items array
   - Update order: { items: [...], total_amount: newTotal }
   ```

3. **Supabase** (Database):
   ```sql
   UPDATE orders SET 
     items = [... old items, newItem],
     total_amount = 150000
   WHERE id = 'ord-xyz'
   ```

4. **Real-time Subscription** (All clients):
   ```typescript
   supabase.channel('public:orders')
     .on('postgres_changes', ..., (payload) => {
       setOrders(prev => prev.map(o =>
         o.id === payload.new.id ? transformOrder(payload.new) : o
       ))
     })
   ```

5. **All Views Updated Immediately** (within 100ms):
   - ✅ KitchenView: Thấy item mới PENDING
   - ✅ StaffView: Thấy bàn có order mới
   - ✅ CashierView: Thấy total amount tăng
   - ✅ AdminView: Thấy dashboard update

---

## ⚙️ Configuration

### Environment Variables (.env.local)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyD...
VITE_VAT_RATE=0.08
```

### VAT Rate
Được đọc từ `VITE_VAT_RATE` environment variable, default = 0.08 (8%)

```typescript
const vatRate = parseFloat(import.meta.env.VITE_VAT_RATE || '0.08');
```

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- Check `.env.local` có VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY?
- Supabase project có active?
- Network connection OK?

### "Table does not exist"
- Bạn đã run SQL schema từ supabase_schema.sql?
- Check Supabase > Table Editor, verify menu/tables/orders/reservations tồn tại

### "Realtime not updating"
- Supabase project phải có Realtime enabled (mặc định enabled)
- Check `ALTER TABLE ... REPLICA IDENTITY FULL` đã chạy?
- Thử refresh page

### OrderItem type errors
- OrderItemStatus.PENDING, .PREPARING, .READY, .SERVED, .CANCELLED
- Items stored as JSONB array, truy cập via order.items[index]

---

## 🎯 Next Steps

1. **Mobile Optimization**: Làm giao diện tương thích mobile (CustomerView đặc biệt)
2. **CashierView**: Hoàn thiện payment flow (receipt printing, payment gateway)
3. **AdminView**: Thêm dashboard charts (sales, top items, busy times)
4. **Gemini AI**: Tích hợp để gợi ý menu based on sales data
5. **Push Notifications**: Thêm real-time alerts (bill ready, new order, etc.)
6. **Reports**: Tạo export reports (PDF, Excel)
7. **Multi-location**: Support multiple restaurant locations

---

## 📚 Reference Documentation

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

---

Chúc mừng! Bạn đã successfully chuyển đổi sang Supabase! 🎉
