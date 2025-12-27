# Username + PIN Login - Quick Reference

## 🔐 What Changed?

Your POS system now uses **Username + PIN** instead of just PIN for employee login.

## 📋 What You Need to Do

### 1. Update Your Database
Run these SQL commands in your Supabase SQL editor:

```sql
-- Add username column
ALTER TABLE employees ADD COLUMN username TEXT UNIQUE;

-- Update existing employees
UPDATE employees SET username = 'emp_' || SUBSTRING(id::text, 1, 8) WHERE username IS NULL;

-- Make it required
ALTER TABLE employees ALTER COLUMN username SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
```

### 2. Assign Proper Usernames
In AdminView → NHÂN VIÊN tab:
- Edit each employee
- Add a proper username (e.g., "huynh_kitchen", "admin_main")
- Ensure all usernames are unique
- Save

### 3. Test Login
Try logging in:
- Username: (what you assigned)
- PIN: (existing 4-digit PIN)
- Should work immediately

## 🎯 Example Usernames

| Role | Example |
|------|---------|
| Admin | `admin_main`, `admin_backup` |
| Kitchen | `huynh_kitchen`, `kitchen_01` |
| Cashier | `cashier_front`, `cashier_02` |
| Staff | `thao_staff`, `staff_tables` |

## ❌ Common Mistakes

| Mistake | Fix |
|---------|-----|
| Username has spaces | Use underscores: `huynh kitchen` → `huynh_kitchen` |
| Duplicate usernames | Each username must be unique |
| Forgot to set username | Use AdminView to add for each employee |
| Old system (PIN only) | Update your database first! |

## ✅ Verification Checklist

- [ ] Database migration completed (username column added)
- [ ] All employees have usernames assigned
- [ ] Usernames are unique (no duplicates)
- [ ] Can login with username + PIN
- [ ] Rate limiting still works (5 failed attempts)
- [ ] Lockout still works (15-minute lockout)
- [ ] Role-based access control works
- [ ] Customer table access works (no login needed)

## 📞 Troubleshooting

**Q: "Username or PIN incorrect" error**
A: Check:
- Username is exactly as assigned (case-sensitive)
- PIN is correct (4+ digits)
- Employee is set to ACTIVE status
- No spaces before/after username

**Q: Can't create new employee without username**
A: The username field is now required. Add a unique username when creating employees.

**Q: Need to change a username**
A: Edit the employee in AdminView → NHÂN VIÊN tab, update username, and save.

**Q: Still getting locked out after 15 minutes?**
A: This is correct behavior - try again after 15 minutes, or clear browser localStorage as admin.

## 🚀 What Improved

| Metric | Before | After |
|--------|--------|-------|
| Security | PIN-only | Username + PIN |
| Possible Combos | 10,000 | 10,000,000+ |
| User Identification | Anonymous | Identified (by username) |
| Audit Trail | ❌ No | ✅ Yes (can see who logged in) |

## 📚 Full Documentation

- **AUTHENTICATION.md** - Complete auth system documentation
- **DATABASE_MIGRATION.md** - Detailed migration guide with SQL
- **USERNAME_PIN_IMPLEMENTATION.md** - Full technical implementation details

---

**Questions?** Check the documentation files or review the git history: `git log --oneline | head -5`
