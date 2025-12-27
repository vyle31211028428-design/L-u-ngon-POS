-- ============================================================
-- LẨU NGON POS - SUPABASE DATABASE SCHEMA
-- ============================================================
-- Convention: snake_case cho database, camelCase cho frontend
-- JSONB được dùng cho dữ liệu semi-structured
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: menu
-- Description: Danh sách các món ăn/đồ uống
-- ============================================================
CREATE TABLE IF NOT EXISTS menu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('COMBO', 'BROTH', 'MEAT', 'SEAFOOD', 'VEGGIE', 'DRINK', 'OTHER')),
  image TEXT,
  description TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  type TEXT NOT NULL CHECK (type IN ('SINGLE', 'COMBO')) DEFAULT 'SINGLE',
  
  -- JSONB fields: combo groups with options
  -- Structure: [{ id, title, min, max, options: [{id, name, price}] }]
  combo_groups JSONB DEFAULT '[]'::JSONB,
  
  -- Boolean fields
  is_recommended BOOLEAN DEFAULT false,
  
  -- Array of ingredients (for allergen info, display)
  -- Structure: ["ingredient1", "ingredient2"]
  ingredients JSONB DEFAULT '[]'::JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT price_positive CHECK (price > 0)
);

-- Indexes for menu
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(category);
CREATE INDEX IF NOT EXISTS idx_menu_available ON menu(available);
CREATE INDEX IF NOT EXISTS idx_menu_type ON menu(type);

-- Enable realtime for menu
ALTER TABLE menu REPLICA IDENTITY FULL;

-- ============================================================
-- TABLE: tables (bàn ăn)
-- Description: Thông tin các bàn tại nhà hàng
-- ============================================================
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('EMPTY', 'OCCUPIED', 'DIRTY', 'RESERVED')) DEFAULT 'EMPTY',
  
  -- Guest count: số khách hiện tại
  guest_count INTEGER DEFAULT NULL,
  
  -- Bill requested flag
  bill_requested BOOLEAN DEFAULT false,
  
  -- Link to current order (if any)
  current_order_id UUID DEFAULT NULL,
  
  -- Link to reservation (if reserved)
  reservation_id UUID DEFAULT NULL,
  
  -- Position on restaurant map (for staff view)
  -- Structure: { x: number, y: number }
  position JSONB DEFAULT NULL,
  
  -- Section/area name (e.g., "Tầng 1", "Ngoài trời")
  section TEXT DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tables
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_current_order ON tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_tables_reservation ON tables(reservation_id);
CREATE INDEX IF NOT EXISTS idx_tables_section ON tables(section);

-- Enable realtime for tables
ALTER TABLE tables REPLICA IDENTITY FULL;

-- ============================================================
-- TABLE: orders (đơn hàng)
-- Description: Đơn hàng của bàn, chứa mảng items dưới dạng JSONB
-- Note: Chúng tôi sử dụng JSONB cho items thay vì tách bảng 
-- vì đó là pattern tối ưu cho POS (transactions nhanh, aggregation dễ)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  
  -- Array of order items
  -- Structure: [
  --   {
  --     id, menuItemId, name, price, quantity,
  --     note?, kitchenNote?, selectedOptions?: string[],
  --     status: 'PENDING'|'PREPARING'|'READY'|'SERVED'|'CANCELLED',
  --     timestamp, prepStartTime?
  --   }
  -- ]
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  -- Time when table session started
  start_time BIGINT NOT NULL,
  
  -- Billing
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_method TEXT DEFAULT NULL CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'QR', 'CARD')),
  
  -- Discount (structure: { type: 'PERCENT'|'FIXED', value: number })
  discount JSONB DEFAULT NULL,
  
  final_amount DECIMAL(10, 2) DEFAULT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT NULL,
  grand_total DECIMAL(10, 2) DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT total_amount_non_negative CHECK (total_amount >= 0)
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_paid ON orders(is_paid);
CREATE INDEX IF NOT EXISTS idx_orders_start_time ON orders(start_time);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable realtime for orders
ALTER TABLE orders REPLICA IDENTITY FULL;

-- ============================================================
-- TABLE: reservations (đặt bàn)
-- Description: Quản lý đặt bàn trước
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Reservation time (ISO format or HH:mm)
  time TEXT NOT NULL,
  
  guest_count INTEGER NOT NULL,
  
  -- Table assignment (optional, can be NULL if not yet assigned)
  table_id UUID DEFAULT NULL REFERENCES tables(id) ON DELETE SET NULL,
  
  -- Status: PENDING (chờ), ARRIVED (đã tới), CANCELLED (đã hủy)
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ARRIVED', 'CANCELLED')) DEFAULT 'PENDING',
  
  -- Note from customer
  note TEXT DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reservations
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(time);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);

-- Enable realtime for reservations
ALTER TABLE reservations REPLICA IDENTITY FULL;

-- ============================================================
-- SECURITY: Row Level Security (RLS) Policies
-- ============================================================
-- Note: Trong development, có thể tắt RLS để đơn giản
-- Production: Thiết lập RLS dựa trên user roles

ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Allow all for anon/authenticated (can tighten later based on roles)
DROP POLICY IF EXISTS "Allow all for menu" ON menu;
CREATE POLICY "Allow all for menu" ON menu
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for tables" ON tables;
CREATE POLICY "Allow all for tables" ON tables
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for orders" ON orders;
CREATE POLICY "Allow all for orders" ON orders
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for reservations" ON reservations;
CREATE POLICY "Allow all for reservations" ON reservations
  FOR ALL USING (true);

-- ============================================================
-- FUNCTIONS: Helpers for business logic
-- ============================================================

-- Function: Get active orders (not paid) for a table
CREATE OR REPLACE FUNCTION get_table_active_order(table_uuid UUID)
RETURNS TABLE(
  id UUID,
  table_id UUID,
  items JSONB,
  start_time BIGINT,
  total_amount DECIMAL,
  is_paid BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    orders.id,
    orders.table_id,
    orders.items,
    orders.start_time,
    orders.total_amount,
    orders.is_paid,
    orders.created_at
  FROM orders
  WHERE orders.table_id = table_uuid AND orders.is_paid = false
  ORDER BY orders.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Get pending kitchen items count across all orders
CREATE OR REPLACE FUNCTION get_pending_items_count()
RETURNS TABLE(item_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    SUM(jsonb_array_length(items)), 0
  )::BIGINT
  FROM orders
  WHERE is_paid = false AND items @> '[{"status":"PENDING"}]'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: Auto-update timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS menu_update_timestamp ON menu;
CREATE TRIGGER menu_update_timestamp BEFORE UPDATE ON menu
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tables_update_timestamp ON tables;
CREATE TRIGGER tables_update_timestamp BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS orders_update_timestamp ON orders;
CREATE TRIGGER orders_update_timestamp BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS reservations_update_timestamp ON reservations;
CREATE TRIGGER reservations_update_timestamp BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- COMMENTS: Documentation
-- ============================================================

COMMENT ON TABLE menu IS 'Menu items: combos, meat, seafood, drinks, etc. Items with type=COMBO have combo_groups.';
COMMENT ON TABLE tables IS 'Restaurant tables with status (EMPTY, OCCUPIED, DIRTY, RESERVED).';
COMMENT ON TABLE orders IS 'Orders per table. Items stored as JSONB array for POS performance.';
COMMENT ON TABLE reservations IS 'Advance table reservations with customer contact and status.';

COMMENT ON COLUMN orders.items IS 'Array of OrderItem with: id, menuItemId, name, price, quantity, note, status, timestamp, prepStartTime, selectedOptions, kitchenNote';
COMMENT ON COLUMN tables.position IS 'Map position: {x: number, y: number} for staff floor plan view.';
COMMENT ON COLUMN tables.current_order_id IS 'Foreign key to active (unpaid) order for this table. NULL if empty.';

-- ============================================================
-- TABLE: employees
-- Description: Quản lý nhân sự hệ thống
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'KITCHEN', 'CASHIER')),
  pin_code TEXT NOT NULL CHECK (pin_code ~ '^[0-9]{4,}$'),  -- At least 4 digits
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_pin_code ON employees(pin_code);

-- Enable realtime for employees
ALTER TABLE employees REPLICA IDENTITY FULL;

-- RLS for employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for employees" ON employees;
CREATE POLICY "Allow all for employees" ON employees
  FOR ALL USING (true);

-- Comment
COMMENT ON TABLE employees IS 'Employee management for POS system. PIN code is 4 digits for login.';
COMMENT ON COLUMN employees.pin_code IS 'Login PIN code - exactly 4 digits.';

