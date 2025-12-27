# 🔍 Debug Real-time Subscriptions

## Bước 1: Check Supabase Dashboard
1. Vào https://app.supabase.com
2. Chọn project
3. **Settings → Realtime**
4. Kiểm tra:
   - [ ] Status = "Enabled" (xanh)
   - [ ] Toggle tắt/bật để test

## Bước 2: Enable Realtime cho tables (nếu chưa)
Chạy trong **SQL Editor**:

```sql
-- Check xem Realtime publication có không
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Nếu không có, chạy:
CREATE PUBLICATION supabase_realtime;

-- Add tables vào publication
ALTER PUBLICATION supabase_realtime ADD TABLE menu, tables, orders, reservations;

-- Verify
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## Bước 3: Check subscription logs trong App
1. Mở app: http://localhost:5174
2. Mở F12 → Console
3. Tìm logs có chứa:
   - "Channel subscription"
   - "transformOrder"
   - "Subscription status"

## Bước 4: Test thủ công

### Terminal 1: Start app
```bash
npm run dev
```

### Terminal 2: Send test data qua Supabase SQL
```sql
-- Insert một order mới
INSERT INTO orders (table_id, items, start_time, total_amount, is_paid)
VALUES (
  (SELECT id FROM tables LIMIT 1),
  '[{"id":"test1","menuItemId":"m1","name":"Test","price":100000,"quantity":1,"status":"PENDING","timestamp":' || CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT) || '}]',
  CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT),
  100000,
  false
);
```

Check app - có update ngay không?

## Bước 5: Nếu vẫn không hoạt động

Thêm debug logs vào RestaurantContext:

```typescript
// Line ~290 trong RestaurantContext.tsx

const ordersSubscription = supabase
  .channel('public:orders')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload: any) => {
      console.log('🔄 REALTIME UPDATE received:', payload); // ADD THIS
      
      if (payload.eventType === 'INSERT') {
        setOrders(prev => [...prev, transformOrder(payload.new)]);
        console.log('✅ Order inserted:', payload.new.id); // ADD THIS
      } else if (payload.eventType === 'UPDATE') {
        setOrders(prev =>
          prev.map(o =>
            o.id === payload.new.id ? transformOrder(payload.new) : o
          )
        );
        console.log('✅ Order updated:', payload.new.id); // ADD THIS
      }
    }
  )
  .subscribe((status) => {
    console.log('📡 Orders subscription status:', status); // ADD THIS
  });
```

Sau đó:
1. Reload app
2. Mở F12 Console
3. Check logs xuất hiện
