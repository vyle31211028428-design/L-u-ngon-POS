-- ============================================================
-- Enable Real-time for Employees Table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Enable Real-time on employees table
BEGIN;

-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS "supabase_realtime" CASCADE;

-- Create publication for all tables with real-time enabled
CREATE PUBLICATION "supabase_realtime" FOR TABLE
  menu,
  tables,
  orders,
  reservations,
  employees;

COMMIT;

-- Verify publication was created
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Check publication tables
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ============================================================
-- Verify REPLICA IDENTITY is set
-- ============================================================

-- For menu
ALTER TABLE menu REPLICA IDENTITY FULL;

-- For tables
ALTER TABLE tables REPLICA IDENTITY FULL;

-- For orders
ALTER TABLE orders REPLICA IDENTITY FULL;

-- For reservations
ALTER TABLE reservations REPLICA IDENTITY FULL;

-- For employees (most important for new feature)
ALTER TABLE employees REPLICA IDENTITY FULL;

-- ============================================================
-- Verify setup
-- ============================================================

-- Check REPLICA IDENTITY status
SELECT 
  t.relname as table_name,
  CASE 
    WHEN t.relreplident = 'd' THEN 'DEFAULT'
    WHEN t.relreplident = 'n' THEN 'NOTHING'
    WHEN t.relreplident = 'f' THEN 'FULL'
    WHEN t.relreplident = 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class t
WHERE t.relname IN ('menu', 'tables', 'orders', 'reservations', 'employees')
ORDER BY t.relname;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('menu', 'tables', 'orders', 'reservations', 'employees')
ORDER BY tablename;
