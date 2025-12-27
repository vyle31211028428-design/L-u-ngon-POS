# 🍲 Lẩu Ngon POS

> Hệ thống Point of Sale (POS) chuyên dụng cho nhà hàng Lẩu tại Việt Nam

[![React 18](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-blue?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-2.39-blue?logo=supabase)](https://supabase.com)

## ✨ Tính năng Chính

### 👥 5 Vai trò Người dùng

#### 1. **Customer View** 📱 (Mobile Web)
- Giao diện tối ưu cho điện thoại (Mobile-first responsive)
- **Combo Lẩu Thông minh**:
  - Chọn nước lẩu (1-2 vị, có phụ thu)
  - Chọn thịt & hải sản (Min/Max validation)
  - Chọn rau & nấm
  - Hiển thị giá động theo lựa chọn
- Giỏ hàng chi tiết với ghi chú
- Gọi nhân viên (Bell button)
- Yêu cầu thanh toán
- Cập nhật Real-time giỏ hàng

#### 2. **Kitchen Display System (KDS)** 🔥 Dark Mode
- **Giao diện siêu tối** (giảm mỏi mắt cho đầu bếp)
- **Quy trình đơn hàng**: Pending → Preparing → Ready → Served
- **Burn Effect** ⚠️:
  - **Yellow border**: Quá 10 phút
  - **Red border + Flashing**: Quá 15 phút (cảnh báo khẩn cấp)
  - **Timer tích tắc** hiển thị thời gian từng đơn
- **Sidebar Aggregation**:
  - Tự động gom nhóm số lượng từng món
  - VD: "Tổng cần 5 đĩa Bò Mỹ"
- **Internal Notes**: Bếp gửi tin nhắn cho phục vụ ("Hết tôm")
- **Filter**: Tất cả / Bếp / Bar

#### 3. **Staff View** 👔 (Phục vụ)
- **Sơ đồ Bàn trực quan**:
  - Trắng: Trống
  - Xanh: Có khách
  - Cam: Chờ thanh toán
  - Đỏ: Chờ dọn
- **Ready Alerts**: Số lượng món xong tại từng bàn
- **Quản lý Bàn**:
  - Check-in khách
  - Chuyển bàn
  - Gộp bàn
  - Chốt đơn
- **Đặt bàn trước**: Quản lý reservations

#### 4. **Cashier View** 💳 (Thu ngân)
- **Priority List**: Bàn chờ thanh toán nổi lên đầu
- **Billing Engine** 🧮:
  - Tự động trừ món Cancelled
  - Tính VAT (8% hoặc 10% theo cấu hình)
  - Hỗ trợ giảm giá (Phần trăm hoặc Tiền cố định)
  - Hiển thị: Subtotal → Discount → After Discount → VAT → Grand Total
- **Payment Methods**:
  - Tiền mặt (CASH)
  - QR Code
  - Thẻ tín dụng (CARD)
- **Chuyển sang trạng thái DIRTY** sau khi thanh toán

#### 5. **Admin View** 📊 (Quản lý)
- **Dashboard**:
  - Biểu đồ doanh thu (Recharts)
  - Top 10 món bán chạy
  - Thống kê thanh toán
  - KPI tức thời
- **AI Insights** 🤖:
  - Tích hợp Google Gemini
  - Phân tích báo cáo bán hàng
  - Gợi ý chiến lược tăng doanh thu
  - Phân tích menu performance
- **Menu Management**:
  - Thêm/Sửa/Xóa món
  - Drag & Drop sắp xếp thứ tự
  - Quản lý Combo Groups
  - Upload ảnh

## 🏗️ Architecture

### Real-time Sync 🔄
- **Supabase Realtime Subscriptions**: Tất cả thay đổi đồng bộ tức thì
- **Multi-device**: Một thay đổi ở máy Khách → Phục vụ + Bếp nhìn thấy ngay
- **Optimistic UI**: Cập nhật giao diện trước khi server confirm

### State Management 💾
- React Context API (Global State)
- `RestaurantContext`: Quản lý menu, bàn, đơn hàng, người dùng
- Custom hooks: `useToast`, `useDebounce`, `useStorage`

### Data Flow
```
Customer View
    ↓ (addItemToOrder)
RestaurantContext → Supabase
    ↓ (Realtime subscription)
Kitchen View + Staff View + Cashier View
```

## 📊 Data Structures

### MenuItem
```typescript
{
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  type: ItemType; // SINGLE or COMBO
  comboGroups: ComboGroup[]; // Chỉ với COMBO
  isRecommended: boolean;
  available: boolean;
}
```

### ComboGroup (Tùy chọn trong Combo)
```typescript
{
  id: string;
  title: string;
  min: number;  // Tối thiểu chọn
  max: number;  // Tối đa chọn
  options: ComboOption[]; // Các lựa chọn
}
```

### Order & OrderItem
```typescript
Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  startTime: number;
  totalAmount: number;    // Chưa VAT
  isPaid: boolean;
  discount?: Discount;
  finalAmount?: number;   // Sau discount
  grandTotal?: number;    // Có VAT
}

OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  status: OrderItemStatus; // PENDING/PREPARING/READY/SERVED/CANCELLED
  selectedOptions?: string[]; // Combo choices
  price: number;
  note?: string;
  kitchenNote?: string;
  prepStartTime?: number; // Dùng tính burn effect
}
```

### Table
```typescript
{
  id: string;
  name: string;
  status: TableStatus; // EMPTY/OCCUPIED/DIRTY/RESERVED
  currentOrderId?: string;
  guestCount?: number;
  billRequested?: boolean;
  position?: { x: number; y: number }; // Cho sơ đồ bàn
  section?: string;
}
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI Components |
| **Build** | Vite 5 | Fast bundling |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **Icons** | Lucide React | SVG icons |
| **Charts** | Recharts 3 | Data visualization |
| **State** | React Context | Global state |
| **Database** | Supabase (Postgres) | Data storage |
| **Real-time** | Supabase Realtime | Live subscriptions |
| **AI** | Google Gemini | Business insights |
| **Routing** | React Router 6 | Navigation |

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repo-url>
cd lau-ngon-pos
npm install
```

### 2. Setup Environment
Tạo `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_VAT_RATE=0.08
```

### 3. Start Dev Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/      # UI Components
├── context/        # React Context
├── hooks/          # Custom hooks
├── services/       # External services (Supabase, Gemini)
├── utils/          # Utility functions
├── views/          # Page components (5 main views)
├── types.ts        # TypeScript definitions
├── constants.ts    # App constants
├── App.tsx         # Root component
└── index.tsx       # Entry point
```

## 📱 Mobile Optimization

- ✅ Mobile-first responsive design
- ✅ Touch-friendly buttons (48px min)
- ✅ Safe area insets (iPhone notch)
- ✅ Prevents zoom on iOS input focus
- ✅ Optimized images with lazy loading

## 🎨 Customization

### Colors Theme
Edit `tailwind.config.js`:
```javascript
theme: {
  colors: {
    'primary': '#D32F2F',    // Tomato red
    'secondary': '#FFA500',  // Orange
  }
}
```

### VAT Rates
`.env.local`:
```env
VITE_VAT_RATE=0.08          # Default: 8%
VITE_ALTERNATE_VAT_RATE=0.10 # Alternate: 10%
```

## 🔐 Security & Performance

### ✅ Best Practices
- Environment variables for sensitive data
- Safe API key fallbacks
- Graceful error handling
- CORS properly configured
- Supabase RLS for authorization

### ⚡ Performance
- `useMemo` for expensive calculations
- Debounce/Throttle for expensive operations
- Lazy component loading
- Optimistic UI updates

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Chi tiết cấu hình
- [API Reference](./API.md) - Context & Services

## 🧪 Testing

```bash
npm test
npm run test:watch
```

## 📄 License

MIT License

## 👥 Team

- **Product**: Lẩu Ngon Team
- **Development**: Senior Fullstack Developers

---

**Lẩu Ngon POS** - Quản lý nhà hàng lẩu hiệu quả, chuyên nghiệp, đơn giản.

*Version 1.0.0 - December 2025*## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
