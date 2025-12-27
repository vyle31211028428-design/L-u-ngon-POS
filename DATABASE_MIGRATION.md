# Database Migration Guide

## Username Field Addition for Enhanced Authentication

### What Changed
The `employees` table now includes a `username` field to support dual-factor authentication (Username + PIN) instead of PIN-only authentication.

### Migration Steps

#### For New Databases
No action needed. The updated `supabase_schema.sql` file includes the username column with proper constraints.

#### For Existing Databases
Apply these SQL commands in your Supabase SQL editor:

```sql
-- Step 1: Add username column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN username TEXT UNIQUE;

-- Step 2: Create index for query performance
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);

-- Step 3: Update existing employee records with default usernames
-- This is a temporary solution - you should assign proper usernames afterward
UPDATE employees 
SET username = 'emp_' || SUBSTRING(id::text, 1, 8) 
WHERE username IS NULL;

-- Step 4: Make username NOT NULL (after all records are updated)
ALTER TABLE employees 
ALTER COLUMN username SET NOT NULL;

-- Step 5: Verify migration
SELECT id, name, username, role, status FROM employees ORDER BY created_at;
```

### Schema Changes

**Before:**
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**After:**
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,  -- NEW: For dual authentication
  role TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
```

### Authentication Flow Change

**Before:**
```
Employee Login
    ↓
Enter PIN (e.g., "1234")
    ↓
Query: SELECT * FROM employees WHERE pin_code = ? AND status = 'ACTIVE'
    ↓
Match found → Login success
```

**After:**
```
Employee Login
    ↓
Enter Username (e.g., "huynh_kitchen")
Enter PIN (e.g., "1234")
    ↓
Query: SELECT * FROM employees WHERE username = ? AND pin_code = ? AND status = 'ACTIVE'
    ↓
Both match → Login success
```

### TypeScript Type Updates

**Before:**
```typescript
interface Employee {
  id: string;
  name: string;
  role: Role;
  pinCode: string;
  status: 'ACTIVE' | 'INACTIVE';
}
```

**After:**
```typescript
interface Employee {
  id: string;
  name: string;
  username: string;           // NEW: Unique login identifier
  role: Role;
  pinCode: string;
  status: 'ACTIVE' | 'INACTIVE';
}
```

### Data Requirements

When creating or updating employees, both fields are now required:

| Field | Type | Constraints | Example |
|-------|------|-------------|---------|
| name | TEXT | NOT NULL | "Nguyễn Văn A" |
| username | TEXT | NOT NULL, UNIQUE | "nguyen_van_a" |
| pinCode | TEXT | 4+ digits, numeric | "1234" |
| role | ENUM | ADMIN, KITCHEN, CASHIER, STAFF | "KITCHEN" |
| status | TEXT | ACTIVE or INACTIVE | "ACTIVE" |

### Username Guidelines

- **Format:** Alphanumeric (letters, numbers, underscores, hyphens)
- **Length:** 3-20 characters recommended
- **Uniqueness:** Database enforces UNIQUE constraint
- **Examples:**
  - `admin_main`
  - `kitchen_02`
  - `cashier_front`
  - `thanh_staff`

### Rollback Instructions

If you need to revert to PIN-only authentication:

```sql
-- Remove username column and index
DROP INDEX IF EXISTS idx_employees_username;
ALTER TABLE employees DROP COLUMN username;

-- This will break the application - revert code changes too!
```

**Important:** Rollback requires reverting code changes in:
- `/context/AuthContext.tsx`
- `/views/LoginView.tsx`
- `/views/AdminView.tsx`
- `/types.ts`

### Verification

After migration, verify the changes:

```sql
-- Check table structure
\d employees

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'employees';

-- Sample query
SELECT username, name, role, status 
FROM employees 
ORDER BY created_at DESC 
LIMIT 10;
```

### Testing

After migration, test the following scenarios:

1. **New Employee Creation:**
   - Create employee with unique username
   - Should succeed
   - Try duplicate username
   - Should fail (UNIQUE constraint)

2. **Login:**
   - Enter username + PIN
   - Should authenticate successfully
   - Enter wrong username
   - Should show "Username or PIN incorrect"
   - Enter wrong PIN
   - Should show "Username or PIN incorrect"

3. **Rate Limiting:**
   - 5 wrong attempts
   - Should lock account for 15 minutes
   - Rate limiting applies to username+PIN combo

4. **Admin Functions:**
   - Edit employee username
   - Should work if new username is unique
   - List employees
   - Should show username field

### Performance Impact

**Added Index:**
- `idx_employees_username` on username column
- Improves login query performance
- ~0.1% storage overhead for typical restaurant (50-100 employees)

**Query Optimization:**
```sql
-- Before (full table scan if username added without index)
SELECT * FROM employees WHERE username = 'admin_main';

-- After (index scan with new index)
SELECT * FROM employees WHERE username = 'admin_main';  -- Uses idx_employees_username
```

### Support & Troubleshooting

**Q: I see "Username is missing" error**
A: Old employees don't have usernames. Run Step 3 of migration to populate with defaults, then manually assign proper usernames.

**Q: Login shows "Username or PIN incorrect" but I'm sure it's right**
A: Check:
1. Username is trimmed (no spaces)
2. PIN is exactly what was set
3. Employee status is 'ACTIVE'
4. Username is unique (no duplicates)

**Q: Can I change an employee's username?**
A: Yes, in AdminView employee edit form. The database will validate uniqueness.

**Q: What if I need to use special characters in username?**
A: Currently database only allows TEXT. Update validation if needed, but recommend sticking to alphanumeric + underscore/hyphen for compatibility.
