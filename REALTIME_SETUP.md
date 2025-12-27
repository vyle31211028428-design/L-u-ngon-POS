# ⚡ Hướng Dẫn Setup Realtime Supabase

## 1️⃣ Enable Realtime trong Supabase Dashboard

### Bước 1: Vào Supabase Console
- https://app.supabase.com
- Chọn project của bạn

### Bước 2: Vào Settings → Realtime
- **Supabase Dashboard** → **Settings** (icon bánh răng)
- Chọn tab **Realtime**
- Nhấn **Enable Realtime**

### Bước 3: Bật Realtime cho mỗi bảng
**Supabase Dashboard** → **SQL Editor**

Chạy lệnh sau để bật Realtime trên tất cả tables:

```sql
-- Bật Realtime cho tất cả bảng
ALTER TABLE menu REPLICA IDENTITY FULL;
ALTER TABLE tables REPLICA IDENTITY FULL;
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE reservations REPLICA IDENTITY FULL;

-- Verify
SELECT * FROM pg_class WHERE oid::regclass::text IN ('menu', 'tables', 'orders', 'reservations');
```

✅ Đã có trong `supabase_schema.sql` - không cần chạy lại nếu bạn đã execute schema file.

---

## 2️⃣ Verify Real-time Setup

### Check trong Supabase Dashboard:
1. **Supabase** → **Realtime** → Kiểm tra status
2. Phải hiển thị "Enabled" với logo xanh ✅

### Check trong Code:
- **RestaurantContext.tsx** đã có 4 subscription channels:
  ```typescript
  - public:menu
  - public:tables
  - public:orders
  - public:reservations
  ```

---

## 3️⃣ Test Real-time Sync

### Test 1: Mở 2 browser windows side-by-side

```
Browser 1 (http://localhost:5174):
1. Chọn Customer
2. Chọn "Bàn 1"
3. Thêm "Combo Lẩu..." 

Browser 2 (http://localhost:5174):
1. Chọn Kitchen
2. Đợi... sẽ thấy item xuất hiện ngay lập tức
```

**Expected**: Item xuất hiện trong <200ms (real-time sync)

---

## 4️⃣ Real-time Subscriptions Đã Implement

### Menu Subscription
```typescript
supabase
  .channel('public:menu')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'menu' },
    (payload) => {
      // INSERT: Thêm menu item mới
      // UPDATE: Cập nhật item (giá, tên, status)
      // DELETE: Xóa item khỏi menu
    }
  )
  .subscribe();
```

### Tables Subscription
```typescript
supabase
  .channel('public:tables')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'tables' },
    (payload) => {
      // UPDATE: Trạng thái bàn (EMPTY → OCCUPIED → DIRTY)
      // Cập nhật current_order_id, guest_count
    }
  )
  .subscribe();
```

### Orders Subscription
```typescript
supabase
  .channel('public:orders')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      // INSERT: Order mới được tạo
      // UPDATE: Items được thêm, status thay đổi
      // DELETE: Order bị hủy
    }
  )
  .subscribe();
```

### Reservations Subscription
```typescript
supabase
  .channel('public:reservations')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'reservations' },
    (payload) => {
      // INSERT: Đặt bàn mới
      // UPDATE: Reservation status thay đổi (PENDING → ARRIVED)
      // DELETE: Hủy đặt bàn
    }
  )
  .subscribe();
```

---

## 5️⃣ Real-time Flows

### Flow 1: Customer thêm item
```
Customer View → Add Item Button
  ↓
RestaurantContext.addItemToOrder()
  ↓
Supabase INSERT/UPDATE orders
  ↓
Real-time broadcast (public:orders)
  ↓
Kitchen View → Item xuất hiện ngay
```

### Flow 2: Kitchen cập nhật status
```
Kitchen View → "Bắt đầu" Button
  ↓
RestaurantContext.updateOrderItemStatus()
  ↓
Supabase UPDATE orders.items[].status
  ↓
Real-time broadcast (public:orders)
  ↓
Customer View & Staff View → Status thay đổi ngay
```

### Flow 3: Bàn chuyển trạng thái
```
Customer → Checkout
  ↓
RestaurantContext.checkoutTable()
  ↓
Supabase UPDATE tables (status → DIRTY)
  ↓
Real-time broadcast (public:tables)
  ↓
Staff View → Bàn status cập nhật ngay
```

---

## 6️⃣ Troubleshooting

### ❌ Real-time không hoạt động?

**1. Check Realtime enabled trong Supabase:**
```sql
-- Supabase → SQL Editor
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
```
Should return 1 row (supabase_realtime publication exists)

**2. Check REPLICA IDENTITY:**
```sql
SELECT schemaname, tablename, replica_identity 
FROM pg_tables 
WHERE tablename IN ('menu', 'tables', 'orders', 'reservations');
```
All should show `replica_identity = 'f'` (FULL)

**3. Check browser console:**
```
F12 → Console
Look for: "Channel subscription successful"
```

**4. Check network in DevTools:**
- **F12** → **Network**
- Filter by "websocket"
- Should see connection to Supabase realtime server

### ❌ Delay trong real-time?

- Typical latency: 50-150ms
- Max acceptable: <500ms
- Nếu > 500ms: Check network connection, server load

### ❌ Subscription lỗi?

Check logs:
```typescript
// RestaurantContext.tsx - Line 290+
const subscription = supabase
  .channel('public:menu')
  .on('postgres_changes', ...)
  .subscribe((status) => {
    console.log('Subscription status:', status); // Log status
  });
```

---

## 7️⃣ Best Practices

### ✅ DO:
- Unsubscribe khi component unmount (cleanup)
- Use separate channels per table (easier debugging)
- Log subscription status in development

### ❌ DON'T:
- Subscribe to all events without filtering
- Create new subscription on every render
- Ignore subscription errors

---

## 8️⃣ Performance Tips

### Optimize subscriptions:
```typescript
// ❌ SLOW - Subscribe to everything
.on('postgres_changes', { event: '*', ... })

// ✅ FAST - Subscribe only to specific events
.on('postgres_changes', { event: 'UPDATE', ... })
```

### Reduce payload size:
```typescript
// ❌ SLOW - Select all columns
.select('*')

// ✅ FAST - Select only needed columns
.select('id, name, status, items')
```

---

## 9️⃣ Monitoring Real-time

### Check in Supabase Dashboard:
- **Realtime** → Check active connections
- **Logs** → SQL logs show INSERT/UPDATE/DELETE
- **Database** → Monitor table changes

### Check in Code:
```typescript
// Console logs show all changes
console.log('transformOrder - id:', dbItem.id, 'items count:', items.length);
```

---

## ✅ Checklist

- [ ] Enable Realtime trong Supabase dashboard
- [ ] REPLICA IDENTITY FULL trên tất cả tables
- [ ] Test real-time sync (2 browser windows)
- [ ] Check WebSocket connection (DevTools Network)
- [ ] Verify subscription logs in console
- [ ] Test Kitchen → Customer flow
- [ ] Test Customer → Kitchen flow
- [ ] Monitor latency (<200ms)

---

## 📊 Expected Results

| Action | Latency | Status |
|--------|---------|--------|
| Add item | <100ms | ✅ |
| Change status | <100ms | ✅ |
| Update table | <150ms | ✅ |
| Cancel order | <100ms | ✅ |

---

## 🆘 Need Help?

- Check **browser console** (F12)
- Check **Supabase logs** → SQL logs
- Check **network** (F12 → Network → WebSocket)
- Read error message carefully

---

*Last updated: December 27, 2025*
*Real-time Setup: COMPLETE ✅*
