# 🍲 Lẩu Ngon POS - Setup & Implementation Guide

## 📋 Tổng Quan Hệ Thống

Lẩu Ngon POS là một hệ thống quản lý nhà hàng lẩu hiện đại, được xây dựng với:
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Mobile-first, Responsive)
- **Real-time**: Supabase (Postgres + Realtime Subscriptions)
- **AI**: Google Gemini API (Phân tích báo cáo)
- **Icons**: Lucide React
- **Charts**: Recharts

## 🚀 Quick Start

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Environment Variables
Tạo file `.env.local` trong root directory:

```dotenv
# Supabase Configuration (get from: https://supabase.com/dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini API (get from: https://makersuite.google.com/app/apikey)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# App Configuration
VITE_VAT_RATE=0.08
VITE_ALTERNATE_VAT_RATE=0.10
VITE_APP_NAME=Lẩu Ngon POS
```

### 3. Khởi động Development Server
```bash
npm run dev
```

### 4. Build cho Production
```bash
npm run build
npm run preview
```

## 🗄️ Cấu trúc Database (Supabase)

### Tables cần tạo:

```sql
-- Menu Items
CREATE TABLE menu (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(12,0),
  category TEXT,
  image TEXT,
  description TEXT,
  available BOOLEAN DEFAULT true,
  type TEXT, -- SINGLE or COMBO
  combo_groups JSONB,
  is_recommended BOOLEAN DEFAULT false,
  ingredients TEXT[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tables
CREATE TABLE tables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'EMPTY', -- EMPTY, OCCUPIED, DIRTY, RESERVED
  current_order_id TEXT,
  guest_count INT,
  bill_requested BOOLEAN DEFAULT false,
  reservation_id TEXT,
  position JSONB,
  section TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  table_id TEXT REFERENCES tables(id),
  items JSONB,
  start_time BIGINT,
  total_amount DECIMAL(12,0),
  is_paid BOOLEAN DEFAULT false,
  payment_method TEXT,
  discount JSONB,
  final_amount DECIMAL(12,0),
  tax_amount DECIMAL(12,0),
  grand_total DECIMAL(12,0),
  updated_at BIGINT,
  created_at TIMESTAMP DEFAULT now()
);

-- Reservations
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  phone TEXT,
  time TEXT,
  guest_count INT,
  table_id TEXT REFERENCES tables(id),
  status TEXT DEFAULT 'PENDING', -- PENDING, ARRIVED, CANCELLED
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

## 📁 Cấu trúc Thư mục

```
src/
├── components/
│   ├── RoleSelection.tsx      # Role selector UI
│   └── ...
├── context/
│   └── RestaurantContext.tsx  # Global state management
├── hooks/
│   ├── useToast.ts           # Toast notifications
│   ├── useDebounce.ts        # Debounce/Throttle
│   └── useStorage.ts         # Local/Session Storage
├── services/
│   ├── supabaseClient.ts     # Supabase initialization
│   └── geminiService.ts      # AI service
├── utils/
│   ├── billing.ts            # Billing calculations
│   ├── combo.ts              # Combo validation
│   ├── time.ts               # Time utilities
│   ├── kitchen.ts            # Kitchen aggregation
│   ├── table.ts              # Table operations
│   └── ui.ts                 # UI helpers
├── views/
│   ├── CustomerView.tsx      # Mobile ordering
│   ├── KitchenView.tsx       # Dark mode KDS
│   ├── StaffView.tsx         # Table management
│   ├── CashierView.tsx       # Billing & payment
│   └── AdminView.tsx         # Dashboard & insights
├── types.ts                  # TypeScript definitions
├── constants.ts              # App constants
├── App.tsx                   # Main app component
└── index.tsx                 # Entry point
```

## 🎯 Các Module Chính

### 1. Customer View (Mobile Web)
- **Tính năng**: Gọi món, chọn combo phức tạp, xem giỏ hàng, gọi nhân viên
- **Responsive**: Mobile-first design
- **Combo Logic**: Min/Max validation, dynamic pricing
- **Real-time**: Cập nhật giỏ hàng tức thì

### 2. Kitchen Display System (KDS)
- **Giao diện**: Dark mode (giảm mỏi mắt)
- **Quy trình**: Pending → Preparing → Ready → Served
- **Burn Effect**:
  - Yellow border: Quá 10 phút
  - Red border + flashing: Quá 15 phút
- **Aggregation**: Sidebar hiển thị tổng số từng loại món
- **Kitchen Notes**: Gửi ghi chú ngược cho phục vụ

### 3. Staff View
- **Sơ đồ bàn**: Visualize table status
- **Color codes**:
  - Trắng: Trống
  - Xanh: Có khách
  - Cam: Chờ bill
  - Đỏ: Chờ dọn
- **Ready Alerts**: Hiển thị số món xong
- **Operations**: Check-in, chuyển bàn, gộp bàn

### 4. Cashier View
- **Priority List**: Bàn chờ thanh toán nổi lên đầu
- **Billing Engine**:
  - Tự động trừ món Cancelled
  - Tính VAT (8% hoặc 10%)
  - Hỗ trợ giảm giá (% hoặc tiền mặt)
- **Payment**: CASH/QR/CARD → Chuyển sang "DIRTY"

### 5. Admin View
- **Dashboard**: Biểu đồ doanh thu, top sales
- **AI Insights**: Dùng Gemini để phân tích kinh doanh
- **Menu Management**: Thêm/Sửa/Xóa, drag & drop sắp xếp

## 🔐 Security & Performance

### Environment Variables
- ✅ Sử dụng `VITE_*` prefix (exposed to client)
- ✅ Safe fallbacks để tránh crash
- ✅ Validation checks khi khởi động

### Supabase Client
```typescript
// ✅ Proper error handling & health checks
import { supabase, checkSupabaseHealth } from './services/supabaseClient';

const isHealthy = await checkSupabaseHealth();
```

### Gemini Service
```typescript
// ✅ Graceful degradation khi API key chưa có
import { isGeminiConfigured } from './services/geminiService';

if (isGeminiConfigured()) {
  // Generate AI insights
}
```

### Performance Optimizations
- ✅ `useMemo` cho tính toán nặng
- ✅ Lazy loading cho components
- ✅ Debounce/Throttle cho expensive operations
- ✅ Optimistic UI updates

## 🧪 Testing

```bash
npm test
```

## 📦 Build & Deploy

### Vite Build
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to Netlify
- Connect git repository
- Build: `npm run build`
- Publish: `dist`

## 🎨 Customization

### Tailwind Config
- Màu sắc: `tailwind.config.js`
- Animations: Burn effect, pulse warning
- Dark mode: Hỗ trợ class-based dark mode

### Theme Colors
```javascript
// tailwind.config.js
colors: {
  'primary': '#D32F2F',    // Tomato red
  'secondary': '#FFA500',  // Orange
  'success': '#4CAF50',    // Green
  // ...
}
```

## 📱 Mobile Optimization

- Viewport meta tag (already in index.html)
- Safe area inset support
- Touch-friendly button sizes (48px minimum)
- Font size override để tránh zoom trên iOS

## 🐛 Troubleshooting

### Supabase Connection Fails
1. Check `.env.local` has correct URL and key
2. Verify Supabase project is active
3. Check RLS policies allow anonymous access

### Gemini API Errors
1. Verify API key is valid
2. Check quota limits
3. Fallback to mock data if API fails

### TypeScript Errors
1. Update types.ts with latest interfaces
2. Rebuild: `npm run build`

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Google Generative AI](https://ai.google.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## 📝 Notes

- Tất cả thời gian lưu giữ dưới dạng timestamp (milliseconds)
- Tiền tệ: VND (Vietname Dong)
- Ngôn ngữ: Tiếng Việt
- Timezone: Asia/Ho_Chi_Minh

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "feat: description"`
3. Push: `git push origin feature/name`
4. Create PR

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-27  
**Maintained by**: Lẩu Ngon Dev Team
