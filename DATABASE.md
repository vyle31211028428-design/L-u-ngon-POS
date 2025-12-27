# 🗄️ Lẩu Ngon POS - Database Schema & Migrations

## Supabase Setup Guide

### 1. Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose region (Singapore or Tokyo recommended for Southeast Asia)
4. Wait for project setup (5-10 minutes)

### 2. Get Connection Keys
1. Project Settings → API
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Enable Realtime
1. Database → Replication
2. Enable for tables: menu, tables, orders, reservations

---

## SQL Schema

### Create Tables

```sql
-- ============================================
-- 1. MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menu (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(12,0) NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  description TEXT,
  available BOOLEAN DEFAULT true,
  type TEXT NOT NULL, -- 'SINGLE' or 'COMBO'
  combo_groups JSONB,
  is_recommended BOOLEAN DEFAULT false,
  ingredients TEXT[],
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX idx_menu_category ON menu(category);
CREATE INDEX idx_menu_available ON menu(available);
CREATE INDEX idx_menu_type ON menu(type);

-- ============================================
-- 2. TABLES (SEATS) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'EMPTY',
  -- Status values: EMPTY, OCCUPIED, DIRTY, RESERVED
  current_order_id TEXT,
  guest_count INT,
  bill_requested BOOLEAN DEFAULT false,
  reservation_id TEXT,
  position JSONB, -- {x: number, y: number}
  section TEXT,   -- Floor, outdoor, VIP, etc.
  capacity INT,   -- Table capacity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_section ON tables(section);

-- ============================================
-- 3. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- Array of OrderItem
  start_time BIGINT NOT NULL,
  total_amount DECIMAL(12,0) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  payment_method TEXT, -- 'CASH', 'QR', 'CARD'
  discount JSONB, -- {type: 'PERCENT'|'FIXED', value: number}
  final_amount DECIMAL(12,0),
  tax_amount DECIMAL(12,0),
  grand_total DECIMAL(12,0),
  notes TEXT,
  updated_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_is_paid ON orders(is_paid);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ============================================
-- 4. RESERVATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  time TEXT NOT NULL, -- HH:mm format
  guest_count INT NOT NULL,
  table_id TEXT REFERENCES tables(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'PENDING',
  -- Status: PENDING, ARRIVED, CANCELLED
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_time ON reservations(time);
CREATE INDEX idx_reservations_table_id ON reservations(table_id);

-- ============================================
-- 5. DAILY REPORTS TABLE (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  total_orders INT,
  total_revenue DECIMAL(12,0),
  total_tax DECIMAL(12,0),
  total_discount DECIMAL(12,0),
  payment_breakdown JSONB,
  top_items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);
```

---

## Data Seeding

### Insert Sample Data

```sql
-- Insert sample menu items
INSERT INTO menu (id, name, price, category, type, is_recommended, available)
VALUES
  ('c1', 'Combo Lẩu Uyên Ương (2 người)', 299000, 'COMBO', 'COMBO', true, true),
  ('m1', 'Nước Lẩu Thái Tomyum', 129000, 'BROTH', 'SINGLE', true, true),
  ('m2', 'Nước Lẩu Nấm Thiên Nhiên', 119000, 'BROTH', 'SINGLE', false, true),
  ('m3', 'Ba Chỉ Bò Mỹ', 89000, 'MEAT', 'SINGLE', true, true),
  ('m4', 'Bắp Bò Úc', 99000, 'MEAT', 'SINGLE', true, true),
  ('m5', 'Tôm Sú Hùa', 79000, 'SEAFOOD', 'SINGLE', true, true),
  ('m6', 'Rau Muống', 29000, 'VEGGIE', 'SINGLE', false, true),
  ('m7', 'Nước Mía', 15000, 'DRINK', 'SINGLE', false, true);

-- Insert sample tables
INSERT INTO tables (id, name, status, section, capacity)
VALUES
  ('table-1', 'Bàn 1', 'EMPTY', 'Ngoài trời', 4),
  ('table-2', 'Bàn 2', 'EMPTY', 'Ngoài trời', 4),
  ('table-3', 'Bàn 3', 'EMPTY', 'Trong nhà', 6),
  ('table-4', 'Bàn 4', 'EMPTY', 'Trong nhà', 6),
  ('table-5', 'Bàn 5', 'EMPTY', 'VIP', 8),
  ('table-6', 'Bàn 6', 'EMPTY', 'Ngoài trời', 2);
```

---

## Realtime Configuration

### Enable Realtime for Tables

In Supabase Dashboard:

1. **Database** → **Replication**
2. Toggle ON for:
   - `menu` - Changes in menu items
   - `tables` - Table status updates
   - `orders` - New orders & updates
   - `reservations` - Reservation changes

---

## Row-Level Security (RLS) Policies

### Enable RLS

```sql
-- Enable RLS on all tables
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Menu: Everyone can READ, only admin can WRITE
-- ============================================
CREATE POLICY "menu_read_all" ON menu
  FOR SELECT USING (true);

CREATE POLICY "menu_write_admin" ON menu
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "menu_update_admin" ON menu
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "menu_delete_admin" ON menu
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- Tables: Everyone can READ & UPDATE
-- ============================================
CREATE POLICY "tables_read_all" ON tables
  FOR SELECT USING (true);

CREATE POLICY "tables_update_all" ON tables
  FOR UPDATE USING (true);

-- ============================================
-- Orders: Everyone can READ, INSERT, UPDATE
-- ============================================
CREATE POLICY "orders_read_all" ON orders
  FOR SELECT USING (true);

CREATE POLICY "orders_insert_all" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_update_all" ON orders
  FOR UPDATE USING (true);

-- ============================================
-- Reservations: Everyone can READ & WRITE
-- ============================================
CREATE POLICY "reservations_read_all" ON reservations
  FOR SELECT USING (true);

CREATE POLICY "reservations_insert_all" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reservations_update_all" ON reservations
  FOR UPDATE USING (true);
```

### Disable RLS (Development Only)

```sql
-- For development, you can disable RLS
ALTER TABLE menu DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
```

---

## Data Types & Formats

### JSONB Fields

#### combo_groups in menu
```json
{
  "groups": [
    {
      "id": "g1",
      "title": "Chọn vị nước lẩu",
      "min": 1,
      "max": 1,
      "options": [
        { "id": "opt1", "name": "Lẩu Thái", "price": 29000 },
        { "id": "opt2", "name": "Lẩu Nấm", "price": 0 }
      ]
    }
  ]
}
```

#### items in orders
```json
{
  "items": [
    {
      "id": "item-1",
      "menuItemId": "m1",
      "name": "Ba Chỉ Bò Mỹ",
      "price": 89000,
      "quantity": 2,
      "status": "READY",
      "selectedOptions": ["Lẩu Thái"],
      "note": "Không cay",
      "timestamp": 1703686800000,
      "prepStartTime": 1703686850000
    }
  ]
}
```

#### discount in orders
```json
{
  "type": "PERCENT",
  "value": 10
}
```

#### position in tables
```json
{
  "x": 100,
  "y": 200
}
```

---

## Backup & Maintenance

### Automatic Backups
Supabase automatically backs up your data. To download:

1. Project Settings → Backups
2. Download backup file

### Manual Backup

```sql
-- Export specific table
\COPY (SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '7 days') 
TO 'orders_backup.csv' WITH CSV HEADER;
```

---

## Performance Optimization

### Add Indexes for Common Queries

```sql
-- Fast lookup by table status
CREATE INDEX idx_tables_status_section 
ON tables(status, section);

-- Fast lookup of orders by table
CREATE INDEX idx_orders_table_not_paid 
ON orders(table_id, is_paid);

-- Fast lookup of active orders
CREATE INDEX idx_orders_created_desc 
ON orders(created_at DESC);

-- Fast search by phone (reservations)
CREATE INDEX idx_reservations_phone 
ON reservations(phone);
```

### Query Performance Tips

```sql
-- ✅ Fast: Use indexes
SELECT * FROM tables WHERE status = 'OCCUPIED';

-- ✅ Fast: Date range with index
SELECT * FROM orders 
WHERE created_at > NOW() - INTERVAL '1 day';

-- ❌ Slow: Full table scan
SELECT * FROM menu WHERE description ILIKE '%hot%';
```

---

## Migration Checklist

- [ ] Create Supabase project
- [ ] Get API credentials
- [ ] Create all 5 tables
- [ ] Create indexes
- [ ] Enable Realtime
- [ ] Enable RLS (or disable for dev)
- [ ] Seed sample data
- [ ] Test Realtime subscriptions
- [ ] Update .env.local with credentials
- [ ] Run `npm run dev` and verify

---

## Common Database Operations

### Reset All Data (Development)

```sql
-- Drop all tables and data
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS menu CASCADE;

-- Then run CREATE TABLE scripts again
```

### Archive Old Orders

```sql
-- Move old orders to archive
-- (First create archive_orders table with same schema)
INSERT INTO archive_orders 
SELECT * FROM orders 
WHERE is_paid = true AND created_at < NOW() - INTERVAL '30 days';

DELETE FROM orders 
WHERE is_paid = true AND created_at < NOW() - INTERVAL '30 days';
```

### Daily Report Generation

```sql
INSERT INTO daily_reports (id, report_date, total_orders, total_revenue, ...)
SELECT
  'report-' || CURRENT_DATE,
  CURRENT_DATE,
  COUNT(*) as total_orders,
  SUM(grand_total) as total_revenue,
  SUM(tax_amount) as total_tax,
  SUM(
    CASE WHEN discount IS NOT NULL 
    THEN CAST(discount->>'value' as DECIMAL)
    ELSE 0 END
  ) as total_discount,
  jsonb_object_agg(
    payment_method,
    COUNT(*)
  ) as payment_breakdown
FROM orders
WHERE DATE(created_at) = CURRENT_DATE AND is_paid = true
GROUP BY DATE(created_at)
ON CONFLICT (report_date) DO UPDATE SET
  total_orders = EXCLUDED.total_orders,
  total_revenue = EXCLUDED.total_revenue,
  total_tax = EXCLUDED.total_tax,
  total_discount = EXCLUDED.total_discount,
  payment_breakdown = EXCLUDED.payment_breakdown;
```

---

## Monitoring & Health Checks

### Database Health Script

```typescript
// src/utils/dbHealth.ts
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Test each table
    const tests = [
      supabase.from('menu').select('id').limit(1),
      supabase.from('tables').select('id').limit(1),
      supabase.from('orders').select('id').limit(1),
      supabase.from('reservations').select('id').limit(1),
    ];

    const results = await Promise.all(tests);
    return results.every(r => !r.error);
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};
```

### Monitor Realtime

```typescript
// Check if Realtime is working
const channel = supabase.channel('test')
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    console.log('✅ Realtime is working', payload);
  })
  .subscribe();

setTimeout(() => {
  supabase.removeChannel(channel);
}, 5000);
```

---

## Troubleshooting

### No Data Showing?

1. Check RLS policies allow SELECT
2. Verify table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'menu';`
3. Check data: `SELECT COUNT(*) FROM menu;`

### Realtime Not Working?

1. Verify Realtime enabled: Project Settings → Replication
2. Check Network tab in DevTools for WebSocket errors
3. Verify API key is correct

### Slow Queries?

1. Check indexes exist
2. Use `EXPLAIN ANALYZE` to see query plan
3. Consider pagination for large datasets

---

## References

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL JSON/JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated**: December 27, 2025  
**For**: Lẩu Ngon POS v1.0.0
