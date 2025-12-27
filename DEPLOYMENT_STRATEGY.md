# Deployment Strategy - Hệ thống Triển khai Thực tế

## 🎯 Chiến lược Tổng quát

Ứng dụng POS được thiết kế để hoạt động trên **một máy chủ duy nhất** tại nhà hàng với 2 kiểu truy cập chính:

### 1️⃣ **Khách hàng (Customer)**
- **Cách truy cập:** Quét mã QR dán trên bàn
- **URL Pattern:** `http://192.168.1.100:5173/ban/table-1`
- **Hành vi:**
  - Vào thẳng giao diện gọi món
  - Không cần đăng nhập
  - Không thể thoát ra sang admin/kitchen
  - Chỉ xem được đơn hàng của chính bàn đó

### 2️⃣ **Nhân viên (Staff/Kitchen/Cashier/Admin)**
- **Cách truy cập:** Truy cập trang chủ hoặc /login
- **URL:** `http://192.168.1.100:5173/` hoặc `http://192.168.1.100:5173/login`
- **Hành vi:**
  - Gặp màn hình đăng nhập (PIN input)
  - Nhập mã PIN 4+ chữ số
  - Rate limiting: Sai 5 lần → khóa 15 phút
  - Sau đăng nhập: Tự điều hướng theo role
  - Logout: Quay lại /login

---

## 📋 Setup Hướng dẫn Triển khai

### Phase 1: Chuẩn bị Máy chủ

#### 1.1 Yêu cầu Phần cứng
```
- CPU: 2+ cores (Intel i5/i7 hoặc tương đương)
- RAM: 4GB+ (tối thiểu 2GB)
- Disk: 50GB+ (SSD preferred)
- Network: Kết nối WiFi stable
```

#### 1.2 Cài đặt Node.js
```bash
# macOS
brew install node@18

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows
# Tải từ https://nodejs.org/en/download/
```

Verify:
```bash
node --version  # Should be v18.x.x
npm --version   # Should be v9.x.x
```

#### 1.3 Cài đặt Supabase Client
App đã cấu hình `.env.local` với:
```env
VITE_SUPABASE_URL=https://elxenagkufgskkkeumrz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Kiểm tra:** Các biến đã được thiết lập trong Supabase project

---

### Phase 2: Build & Deploy

#### 2.1 Development Mode (Testing)
```bash
# 1. Clone repo
git clone https://github.com/your-repo/lau-ngon-pos.git
cd lau-ngon-pos

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# Server will be available at:
# - Local: http://localhost:5173
# - Network: http://192.168.1.100:5173
```

**Cách truy cập từ thiết bị khác:**
1. Tìm IP của máy chủ: `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)
2. Cấu hình bàn: Thay `localhost` bằng IP
3. QR Code: `http://192.168.1.100:5173/ban/table-1`

#### 2.2 Production Mode (Live)
```bash
# 1. Build app
npm run build

# 2. Preview build locally (optional testing)
npm run preview

# 3. Deploy using PM2 (recommended)
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'lau-ngon-pos',
    script: 'npm',
    args: 'run preview',
    env: {
      NODE_ENV: 'production',
      PORT: 5173
    },
    instances: 1,
    exec_mode: 'cluster',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
EOF

# 4. Start with PM2
pm2 start ecosystem.config.js
pm2 save          # Save config
pm2 startup       # Start on boot
```

**Verify Production:**
```bash
pm2 status
pm2 logs lau-ngon-pos

# Access: http://192.168.1.100:5173
```

---

### Phase 3: QR Code Generation

#### 3.1 Create QR Codes for Tables

```bash
# Install qrcode CLI
npm install -g qrcode-cli

# Generate QR for each table
qrcode "http://192.168.1.100:5173/ban/table-1" > qr-table-1.png
qrcode "http://192.168.1.100:5173/ban/table-2" > qr-table-2.png
qrcode "http://192.168.1.100:5173/ban/table-3" > qr-table-3.png
# ... repeat for all tables
```

#### 3.2 Print QR Codes
```bash
# 1. Sử dụng tool online: https://www.qr-code-generator.com/
# 2. Nhập URL: http://192.168.1.100:5173/ban/table-X
# 3. Download & In
# 4. Dán trên bàn

# Hoặc dùng script Python
python3 << 'PYTHON'
import qrcode
import os

os.makedirs('qr_codes', exist_ok=True)
server_ip = '192.168.1.100'  # Thay bằng IP thực tế

for table_num in range(1, 21):  # Tables 1-20
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(f'http://{server_ip}:5173/ban/table-{table_num}')
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(f'qr_codes/table-{table_num}.png')
    print(f'Generated QR for table {table_num}')
PYTHON
```

---

### Phase 4: Employee Setup

#### 4.1 Create Employee Accounts

1. **Access Admin Dashboard**
   ```
   URL: http://192.168.1.100:5173/login
   (Use admin PIN from initial setup)
   ```

2. **Go to NHÂN VIÊN tab**
   - Click "Thêm" (Add button)
   - Fill in:
     - Name: Tên nhân viên
     - Role: ADMIN / STAFF / KITCHEN / CASHIER
     - PIN: Click "Tạo" (Generate) hoặc nhập tay
     - Status: ACTIVE
   - Click "Lưu" (Save)

3. **Test Login**
   - Logout từ admin account
   - Login dengan PIN vừa tạo
   - Verify: Redirect đến trang tương ứng

#### 4.2 Employee PIN Management

```javascript
// PIN Rules:
// - Format: 4+ digit numbers only (0-9)
// - No letters, special characters
// - Examples: 1234, 9999, 123456789

// Auto-generation: Click "Tạo" button
// - Generates random 4-digit PIN
// - Checks for uniqueness in database
// - Max 50 retries if collision

// Manual entry: Type PIN directly
// - Input filters non-digits automatically
// - Minimum 4 digits enforced on save
```

---

## 🔐 Security Configuration

### Authentication System

```typescript
// Rate Limiting: Built-in
- Max Attempts: 5
- Lockout Duration: 15 minutes
- Reset on: Successful login OR after 15 min

// Session Storage
- Method: localStorage (browser)
- Persistence: Survives page refresh
- Logout: Clears all session data

// PIN Validation
- Client-side: /^[0-9]{4,}$/
- Server-side: PostgreSQL constraint
- Database: Stored in plain text (for POS terminal use)
```

### Network Security

```bash
# 1. Firewall: Allow port 5173 from local network only
sudo ufw allow from 192.168.1.0/24 to any port 5173

# 2. HTTPS (Optional, for remote access)
# Use reverse proxy: Nginx / Apache
# Get SSL cert: Let's Encrypt

# 3. VPN (For off-site access)
# Recommended: Tailscale, WireGuard
```

### Supabase Security

```sql
-- RLS (Row Level Security): Already enabled
-- Tables: employees, orders, tables, reservations, menu_items

-- Policy: Allow authenticated users to read
-- Policy: Allow specific roles to write

-- Check in Supabase Console:
-- Authentication > Policies (Should show "Enable" = on)
```

---

## 🚀 Deployment Checklist

### Pre-Deployment ✅

- [ ] Node.js v18+ installed
- [ ] npm dependencies installed (`npm install`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Environment variables set (`.env.local`)
- [ ] Supabase connection tested
- [ ] Database schema updated
- [ ] Employee accounts created
- [ ] QR codes printed and placed

### Deployment

- [ ] Build app (`npm run build`)
- [ ] Test build locally (`npm run preview`)
- [ ] Deploy with PM2 or systemd
- [ ] Verify via http://192.168.1.100:5173
- [ ] Test customer flow (scan QR)
- [ ] Test employee login (test PIN)
- [ ] Test each role view
- [ ] Test logout
- [ ] Check logs for errors

### Post-Deployment

- [ ] Monitor PM2 logs
- [ ] Verify database real-time sync
- [ ] Backup database daily
- [ ] Monitor network bandwidth
- [ ] Train staff on system usage
- [ ] Create backup procedure
- [ ] Document server IP & login PINs

---

## 📊 Monitoring & Troubleshooting

### Check Server Status

```bash
# PM2 status
pm2 status

# Check logs
pm2 logs lau-ngon-pos

# CPU/Memory usage
top
# or
pm2 monit
```

### Common Issues

#### Issue 1: "Cannot connect to server"
```bash
# Check if server is running
pm2 status

# Check port 5173
lsof -i :5173

# Restart
pm2 restart lau-ngon-pos
```

#### Issue 2: "Database connection error"
```bash
# Verify .env.local has correct credentials
cat .env.local

# Test connection
curl https://elxenagkufgskkkeumrz.supabase.co/rest/v1/
```

#### Issue 3: "Login fails - rate limited"
```javascript
// Clear localStorage to reset lockout
// In browser console:
localStorage.removeItem('lau_ngon_auth_lockUntil');
localStorage.setItem('lau_ngon_auth_attempts', '0');
```

#### Issue 4: "QR scan not working"
```bash
# Verify:
1. Phone on same WiFi as server
2. IP address in QR matches server IP
3. Port 5173 is accessible from phone
4. Try manual URL: http://192.168.1.100:5173/ban/table-1
```

---

## 🔄 Updates & Maintenance

### Regular Updates

```bash
# 1. Check for package updates
npm outdated

# 2. Update packages (carefully)
npm update

# 3. Test before deploying
npm run build
npm run preview

# 4. Deploy new version
git pull
npm install
npm run build
pm2 restart lau-ngon-pos
```

### Database Backups

```bash
# Supabase: Automatic daily backups
# Manual backup:
pg_dump -h db.elxenagkufgskkkeumrz.supabase.co \
        -U postgres \
        -d postgres \
        -f backup.sql

# Restore:
psql -h db.elxenagkufgskkkeumrz.supabase.co \
     -U postgres \
     -d postgres \
     -f backup.sql
```

---

## 📞 Support & Documentation

- **Auth System:** See [AUTHENTICATION.md](AUTHENTICATION.md)
- **Employee Management:** See [EMPLOYEE_MANAGEMENT.md](EMPLOYEE_MANAGEMENT.md)
- **API Reference:** See [backend_spec.md](backend_spec.md)
- **Database Schema:** See [database.sql](database.sql)

---

## 🎓 Training Guide for Staff

### For Admin/Manager
1. **First Login:** Use initial PIN
2. **Go to NHÂN VIÊN:** Create employee accounts
3. **Set Roles:** Assign KITCHEN/CASHIER/STAFF
4. **Generate PINs:** Use auto-generate feature

### For Kitchen Staff
1. **Login:** Enter your 4-digit PIN at `/login`
2. **View Orders:** Appears automatically
3. **Mark Ready:** Click "Sẵn sàng" when dish is ready
4. **Logout:** Click logout button when done

### For Cashier
1. **Login:** Enter your PIN
2. **Select Table:** Click on table to checkout
3. **Verify Total:** Review items and price
4. **Process Payment:** Cash, QR, Card options
5. **Close Table:** Confirm and mark as CLEAN

### For Customers
1. **Scan QR:** Using phone camera
2. **View Menu:** Browse items
3. **Place Order:** Select items and click đặt
4. **Wait:** Staff will bring food
5. **Pay:** Call staff or use QR payment

---

## 🌐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Lẩu Ngon POS System                     │
└─────────────────────────────────────────────────────────────┘

                          SERVER
                    (192.168.1.100:5173)
                    ├─ Node.js + Vite
                    ├─ React Application
                    └─ PM2 Process Manager

                              ↕
                       SUPABASE (Cloud)
                    ├─ PostgreSQL Database
                    ├─ Authentication
                    └─ Real-time Sync

        ┌───────────┬─────────────┬──────────────┬──────────┐
        │           │             │              │          │
        ↓           ↓             ↓              ↓          ↓
    KITCHEN       CASHIER       STAFF         ADMIN      CUSTOMER
    Staff PC      Staff PC      Staff PC      PC/Laptop   Phone
    /kitchen      /cashier      /staff        /admin      /ban/:id
    Login PIN     Login PIN     Login PIN     Login PIN   QR Scan
    Tablet        Desktop       Desktop       Desktop     Mobile
```

---

## Version Information

- **App Version:** 1.0.0
- **Node.js:** 18.x
- **React:** 19.x
- **Vite:** 5.x
- **Database:** PostgreSQL (Supabase)
- **Deployment:** PM2 / systemd

---

**Last Updated:** 27 December 2024
**Maintained by:** Development Team
