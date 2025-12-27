-- End of Day Reset Procedure
-- This procedure resets the system for a new day:
-- 1. Reset all tables to EMPTY status
-- 2. Clear current_order_id from tables
-- 3. Archive unpaid orders from today
-- 4. Reset reservation status for completed reservations

CREATE OR REPLACE FUNCTION reset_daily_system()
RETURNS json AS $$
DECLARE
  v_tables_reset INT := 0;
  v_orders_archived INT := 0;
  v_reservations_completed INT := 0;
BEGIN
  -- Update all tables: Reset to EMPTY
  UPDATE public.tables
  SET 
    status = 'EMPTY',
    current_order_id = NULL,
    guest_count = NULL,
    bill_requested = FALSE,
    updated_at = NOW()
  WHERE status != 'EMPTY';
  
  GET DIAGNOSTICS v_tables_reset = ROW_COUNT;

  -- Archive unpaid orders (mark as ARCHIVED)
  UPDATE public.orders
  SET 
    status = 'ARCHIVED',
    updated_at = NOW()
  WHERE is_paid = FALSE 
    AND DATE(created_at) = CURRENT_DATE;
  
  GET DIAGNOSTICS v_orders_archived = ROW_COUNT;

  -- Mark completed reservations as ARCHIVED
  UPDATE public.reservations
  SET 
    status = 'ARCHIVED',
    updated_at = NOW()
  WHERE status = 'CHECKED_IN' 
    AND DATE(created_at) = CURRENT_DATE;
  
  GET DIAGNOSTICS v_reservations_completed = ROW_COUNT;

  -- Return summary
  RETURN json_build_object(
    'success', TRUE,
    'timestamp', NOW(),
    'tables_reset', v_tables_reset,
    'orders_archived', v_orders_archived,
    'reservations_archived', v_reservations_completed,
    'message', FORMAT('Reset complete: %s tables, %s orders, %s reservations', 
                      v_tables_reset, v_orders_archived, v_reservations_completed)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_daily_system() TO authenticated;
