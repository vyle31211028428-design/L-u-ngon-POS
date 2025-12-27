# Quick Reference Guide - Hướng dẫn Nhanh

## 🚀 Quick Start (5 phút)

### Development
```bash
cd lau-ngon-pos
npm install
npm run dev
# Visit: http://localhost:5173
```

### Production
```bash
npm run build
npm install -g pm2
pm2 start "npm run preview" --name lau-ngon-pos
# Visit: http://YOUR_SERVER_IP:5173
```

---

## 🔐 Login Credentials (Initial Setup)

| Role | PIN | Notes |
|------|-----|-------|
| ADMIN | 1234 | Create in database manually or from employee list |
| - | - | Generate new PINs from Admin > NHÂN VIÊN tab |

---

## 🗺️ URL Routes

### Public (No Auth)
| URL | Purpose |
|-----|---------|
| `/login` | PIN-based login page |
| `/ban/table-1` | Customer order view (Table 1) |
| `/table/table-1` | Alternative URL for customer |

### Protected (Require PIN Login)
| URL | Role | Purpose |
|-----|------|---------|
| `/` | Any | Home page (redirects to role page) |
| `/admin` | ADMIN | Admin dashboard, employee management |
| `/kitchen` | KITCHEN | Kitchen display, order tickets |
| `/cashier` | CASHIER | Table checkout, payment |
| `/staff` | STAFF | Take orders, manage tables |

---

## 👥 Role Permissions

| Feature | ADMIN | KITCHEN | CASHIER | STAFF | CUSTOMER |
|---------|-------|---------|---------|-------|----------|
| View Dashboard | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Menu | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Employees | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Orders | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update Order Items | ✅ | ✅ | ✅ | ✅ | ❌ |
| Checkout Tables | ✅ | ❌ | ✅ | ❌ | ❌ |
| Order Food | ✅ | ❌ | ✅ | ✅ | ✅ |
| View Own Table Only | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔑 PIN Management

### Rules
- **Format:** 4+ digits only (0-9)
- **No letters or special characters**
- **Examples:** 1234, 9999, 123456789

### Create PIN
1. Login as ADMIN
2. Go to NHÂN VIÊN tab
3. Click "Thêm" (Add)
4. Click "Tạo" (Generate) for auto PIN
5. Or type PIN manually (4+ digits)
6. Click "Lưu" (Save)

### Change PIN
1. Edit employee record
2. Change PIN field
3. Click "Lưu"

### Forgot PIN
1. Go to NHÂN VIÊN tab (Admin only)
2. Find employee
3. Click Edit
4. Change PIN
5. Save

---

## 📱 Customer QR Code Setup

### Generate QR Codes
```bash
# Using online tool:
# 1. Go to https://www.qr-code-generator.com/
# 2. Enter: http://192.168.1.100:5173/ban/table-1
# 3. Download & print

# Or using CLI:
npm install -g qrcode
qrcode "http://192.168.1.100:5173/ban/table-1" > table-1.png
```

### Print & Place
1. Print QR codes (one per table)
2. Laminate (optional)
3. Place on table or stand

### How Customer Uses
1. Scan QR with phone camera
2. Tap link to open POS
3. Browse menu and place order
4. Staff will bring food

---

## 🔓 Authentication Features

### Rate Limiting (Anti-Brute Force)
- **Max Attempts:** 5 wrong PINs
- **Lockout Duration:** 15 minutes
- **Auto Reset:** After 15 min OR successful login

### Session Management
- **Storage:** Browser localStorage
- **Persistence:** Survives page refresh
- **Logout:** Clears all session data

### Security Best Practices
1. Change default admin PIN immediately
2. Don't share employee PINs
3. Logout when leaving terminal
4. Use HTTPS in production (optional)
5. Backup database regularly

---

## 🛠️ Troubleshooting

### "Cannot login"
```
1. Verify PIN is 4+ digits (numbers only)
2. Check if account status is ACTIVE (not INACTIVE)
3. If locked (5 failed attempts):
   - Wait 15 minutes, or
   - Clear localStorage: localStorage.removeItem('lau_ngon_auth_lockUntil')
```

### "Server not responding"
```
1. Check if npm run dev is running
2. Verify port 5173: lsof -i :5173
3. Check network: ping 192.168.1.100
4. Restart: pm2 restart lau-ngon-pos
```

### "Cannot scan QR"
```
1. Verify phone is on same WiFi as server
2. Check QR contains correct IP: http://192.168.1.100:5173/ban/table-X
3. Try manual URL in phone browser
4. Ensure port 5173 is not blocked
```

### "Data not syncing"
```
1. Check Supabase connection: .env.local
2. Verify internet connection
3. Check Supabase status: https://status.supabase.com
4. Real-time subscriptions: Check AUTHENTICATION.md
```

---

## 📊 Key Features

### Admin Dashboard
- Daily revenue report
- Top 5 selling items
- Order analytics
- AI-powered insights (via Gemini)

### Kitchen Display
- Real-time order queue
- Filter by item type (KITCHEN/BAR)
- Mark items as READY
- Order timer (shows how long cooking)

### Cashier View
- Select table
- View all items
- Apply discount (% or fixed amount)
- Payment methods (Cash/QR/Card)
- Close table

### Staff View
- Table management (status, guest count)
- Reservation management
- Order management
- Table moves & merges

### Customer View
- View menu
- Place order
- Track order status
- Request payment

---

## 🔄 Workflow Example

### Customer Ordering
1. **Customer scans QR:** `/ban/table-1`
2. **Browses menu:** Selects items
3. **Places order:** Sends to kitchen
4. **Waits:** Order appears in KITCHEN view
5. **Kitchen prepares:** Marks items READY
6. **Staff delivers:** Brings food to table
7. **Customer eats:** Enjoys meal
8. **Request payment:** Signals server
9. **Cashier processes:** Checkout, payment, close table

### Employee Workflow
1. **Login:** Enter PIN → Auto-redirect to role page
2. **Work:** Kitchen prepares, staff takes orders, cashier checks out
3. **Logout:** Click logout button
4. **Redirects:** Back to /login

---

## 📚 Full Documentation

- **Authentication System:** [AUTHENTICATION.md](AUTHENTICATION.md)
- **Deployment Guide:** [DEPLOYMENT_STRATEGY.md](DEPLOYMENT_STRATEGY.md)
- **Employee Management:** [EMPLOYEE_MANAGEMENT.md](EMPLOYEE_MANAGEMENT.md)
- **Database Schema:** [database.sql](database.sql)
- **Backend Spec:** [backend_spec.md](backend_spec.md)

---

## 🎓 Common Tasks

### Add New Employee
```
Admin > NHÂN VIÊN > Thêm > Fill form > Lưu
```

### Delete Employee (Soft Delete)
```
Admin > NHÂN VIÊN > Click employee > Delete > Confirm
(Sets status to INACTIVE, doesn't remove from database)
```

### Clear Today's Revenue
```
Admin > DASHBOARD > "Xóa doanh thu hôm nay" > Confirm
```

### Close Day
```
Admin > DASHBOARD > "Kết thúc ngày" > Confirm
(Archives all orders, resets all tables)
```

### Generate Daily Report
```
Admin > DASHBOARD > "Báo cáo AI" > Wait for generation
(Uses Google Gemini AI to analyze sales)
```

---

## ⚙️ Configuration

### Environment Variables (.env.local)
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### PIN Limits (in context/AuthContext.tsx)
```typescript
const MAX_LOGIN_ATTEMPTS = 5;           // Change max attempts
const LOCKOUT_DURATION = 15 * 60 * 1000; // Change lockout time (ms)
```

### Employee PIN Rules (in context/RestaurantContext.tsx)
```typescript
// Regex pattern: ^[0-9]{4,}$
// Meaning: 4 or more digits, numbers only
```

---

## 📞 Support

- **Bug Reports:** GitHub Issues
- **Questions:** Check AUTHENTICATION.md or DEPLOYMENT_STRATEGY.md
- **Database Issues:** Supabase Dashboard (https://app.supabase.com)

---

## Version
- **Current:** 1.0.0
- **Last Updated:** 27 December 2024
- **Status:** ✅ Production Ready

---

## 📋 Checklist for First Deployment

- [ ] Server IP identified (e.g., 192.168.1.100)
- [ ] Node.js & npm installed
- [ ] App cloned and dependencies installed
- [ ] .env.local configured with Supabase keys
- [ ] Employee accounts created
- [ ] QR codes generated and printed
- [ ] PM2 configured for auto-start
- [ ] Tested customer flow (QR scan)
- [ ] Tested employee login (all roles)
- [ ] Tested kitchen, cashier, staff workflows
- [ ] Backup procedure documented
- [ ] Staff trained on system usage

✅ **Ready to serve customers!**
