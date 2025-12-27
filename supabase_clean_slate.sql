-- ============================================================
-- CLEAN SLATE: Drop all tables and recreate from scratch
-- WARNING: This will DELETE all data. Only use if starting fresh!
-- ============================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS menu CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_table_active_order(UUID);
DROP FUNCTION IF EXISTS get_pending_items_count();
DROP FUNCTION IF EXISTS update_timestamp();

-- Now run the full supabase_schema.sql to recreate everything
