# End of Day (Kết Thúc Ngày) - Implementation Guide

## Overview
The "End of Day" feature provides a complete system reset mechanism for daily operations, ensuring a clean slate for the next business day.

## Features

### 1. **System Reset Function (Supabase RPC)**
- **Function Name**: `reset_daily_system()`
- **Location**: `supabase_reset_daily.sql`

#### What It Does:
1. **Reset All Tables**
   - Sets all table statuses to `EMPTY`
   - Clears `current_order_id` from all tables
   - Clears `guest_count` from all tables
   - Resets `bill_requested` flag to FALSE

2. **Archive Unpaid Orders**
   - Marks all unpaid orders from today as `ARCHIVED` (instead of deleting)
   - Preserves historical data for record-keeping

3. **Archive Checked-In Reservations**
   - Marks completed reservations as `ARCHIVED`
   - Keeps reservation history intact

4. **Return Summary**
   - Returns count of tables reset
   - Returns count of orders archived
   - Returns count of reservations archived

### 2. **Frontend Function (RestaurantContext)**
- **Function Name**: `closeDay()`
- **Location**: `context/RestaurantContext.tsx`

#### Implementation:
```typescript
const closeDay = useCallback(async () => {
  // 1. Call Supabase RPC: reset_daily_system()
  // 2. Await response with statistics
  // 3. Refresh all app data (menu, tables, orders, reservations)
  // 4. Return summary to UI
}, [refreshData]);
```

#### Return Value:
```typescript
{
  tablesReset: number;
  ordersArchived: number;
  reservationsArchived: number;
  message: string;
}
```

### 3. **Admin UI (AdminView)**
- **Location**: DASHBOARD tab
- **Button**: "KẾT THÚC NGÀY" (Red, with Power icon)

#### User Flow:
1. Admin clicks "KẾT THÚC NGÀY" button
2. Confirmation modal appears with:
   - ⚠️ Warning: Action cannot be undone
   - What will happen (reset tables, archive orders, etc.)
   - **⚠️ Unpaid Orders Warning** (if applicable)
   - Cancel / Confirm buttons
3. If confirmed, system executes `closeDay()`
4. Success modal shows statistics
5. System refreshes with clean state

#### UI Components:
- **Modal with two states**:
  - Confirmation state: Warning + action description
  - Success state: Statistics display

- **Unpaid Orders Warning**:
  - Shows count of tables with unpaid orders
  - Warns that these will be archived (not deleted)

## Data Safety

### What Gets Reset:
✓ All table statuses → EMPTY  
✓ All current_order_id → NULL  
✓ All guest_count → NULL  
✓ All unpaid orders → ARCHIVED  
✓ All checked-in reservations → ARCHIVED  

### What's NOT Deleted:
❌ Menu items (always preserved)  
❌ Paid orders (moved to history)  
❌ Completed reservations (moved to history)  
❌ System configuration  

### Why ARCHIVED instead of DELETE?
- Preserves historical data for auditing
- Allows future analytics and reporting
- Complies with data retention policies
- Can be filtered from normal views

## How to Use

### Prerequisites:
1. Deploy `supabase_reset_daily.sql` to your Supabase database
2. Ensure user has execute permission on `reset_daily_system()` function

### Deployment Steps:
```sql
-- Option A: Using Supabase Dashboard
1. Go to SQL Editor
2. Create new query
3. Paste content from supabase_reset_daily.sql
4. Execute

-- Option B: Using CLI
supabase db push  # If you have the migration file in migrations/
```

### Usage:
1. Go to Admin Dashboard
2. Locate red "KẾT THÚC NGÀY" button (top right)
3. Click to open confirmation modal
4. Review warning and statistics
5. Click "Kết thúc ngày" to execute
6. Confirm success message
7. System automatically refreshes with clean state

## Related Functions

### `deleteOldData(daysOld?: number)`
Deletes historical data older than N days:
- Deletes paid orders
- Deletes cancelled reservations
- Safe to run independently

**Usage**: Admin → Settings → "XÓA DỮ LIỆU X NGÀY"

### `refreshData()`
Manually fetches latest data from Supabase:
- Pulls all 4 tables
- Updates local state
- Useful if real-time sync is not working

## Monitoring & Logging

### Console Logs:
```javascript
// When closeDay starts:
"🌙 Closing day and resetting system..."

// When successful:
"✅ Day closed successfully: { tables_reset: 5, orders_archived: 8, ... }"

// On error:
"Error closing day: [error details]"
```

### Error Handling:
- Catches all RPC errors
- Shows user-friendly error message
- Logs to browser console for debugging
- Throws error for parent component handling

## Troubleshooting

### Issue: "Cannot execute reset_daily_system"
**Solution**: Ensure RPC function is deployed and user has execute permission

### Issue: Tables not resetting
**Solution**: Check that Supabase table has REPLICA IDENTITY FULL

### Issue: Data not showing changes after close
**Solution**: Click "Đóng" button to close modal, which triggers state refresh

### Issue: Unpaid orders appearing as ARCHIVED
**Expected behavior**: Orders are archived, not deleted (for record-keeping)

## Code Locations

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| RPC Function | `supabase_reset_daily.sql` | 1-50 | Database stored procedure |
| Context Function | `context/RestaurantContext.tsx` | ~1000 | Frontend wrapper |
| Handler | `views/AdminView.tsx` | ~40 | Event handler |
| Modal UI | `views/AdminView.tsx` | ~150 | User interface |

## Future Enhancements

1. **Scheduled Tasks**: Automatically run at 11:59 PM
2. **Email Notifications**: Send daily summary email
3. **Backup Before Close**: Automatic backup of daily data
4. **Custom Reports**: Generate end-of-day financial reports
5. **Undo Functionality**: 15-minute undo window for accidents

## Database Schema Changes

### Tables Updated:
- `public.tables` - Reset status and clear order references
- `public.orders` - Archive unpaid orders
- `public.reservations` - Archive checked-in reservations

### No Schema Changes Required:
- All changes use existing columns
- No migration needed (RPC function only)
- Backward compatible with existing data

## Security Notes

- Function requires authenticated user (Supabase auth)
- All changes timestamped automatically
- Audit trail preserved in ARCHIVED status
- Consider adding RLS policy to restrict to admins only:

```sql
CREATE POLICY "Only admins can call reset_daily_system"
ON public.functions FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

## Testing Checklist

- [ ] RPC function deployed successfully
- [ ] Button appears in Admin Dashboard
- [ ] Modal shows confirmation warning
- [ ] Unpaid orders warning displays (if applicable)
- [ ] closeDay() executes without errors
- [ ] Tables are reset to EMPTY
- [ ] Unpaid orders are archived
- [ ] Views refresh automatically
- [ ] Success modal shows correct counts
- [ ] Console logs show completion message
