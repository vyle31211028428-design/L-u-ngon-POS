-- ============================================================
-- FIX: Add missing columns to existing tables
-- Run this if you get "column does not exist" errors
-- ============================================================

-- Add section column to tables if it doesn't exist
ALTER TABLE tables ADD COLUMN IF NOT EXISTS section TEXT DEFAULT NULL;

-- Add position column to tables if it doesn't exist  
ALTER TABLE tables ADD COLUMN IF NOT EXISTS position JSONB DEFAULT NULL;

-- Add combo_groups to menu if doesn't exist
ALTER TABLE menu ADD COLUMN IF NOT EXISTS combo_groups JSONB DEFAULT '[]'::JSONB;

-- Add ingredients to menu if doesn't exist
ALTER TABLE menu ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::JSONB;

-- Add is_recommended to menu if doesn't exist
ALTER TABLE menu ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;

-- Verify all columns exist now
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('menu', 'tables', 'orders', 'reservations')
ORDER BY table_name, ordinal_position;
