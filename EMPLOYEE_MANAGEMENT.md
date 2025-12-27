# Employee Management Module - Hướng Dẫn Hoàn Chỉnh

## Tổng Quan

Module Quản Lý Nhân Sự cho phép quản lý đội ngũ nhân viên nhà hàng với chức năng:
- ✅ Thêm/Sửa/Xóa nhân viên
- ✅ Gán vai trò (Admin, Kitchen, Cashier, Staff)
- ✅ Quản lý mã PIN đăng nhập (4 chữ số)
- ✅ Quản lý trạng thái (Active/Inactive)
- ✅ Giao diện sang trọng với avatar theo vai trò
- ✅ Real-time sync qua Supabase

---

## 1. Database Schema (Supabase)

### Bảng `employees`

```sql
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'KITCHEN', 'CASHIER')),
  pin_code TEXT NOT NULL CHECK (pin_code ~ '^\d{4}$'),  -- Exactly 4 digits
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Cột Dữ Liệu

| Cột | Kiểu | Mô Tả | Ví Dụ |
|-----|------|-------|-------|
| id | UUID | ID Nhân viên (Tự sinh) | `550e8400-e29b-41d4-a716-446655440000` |
| name | TEXT | Tên nhân viên | `Nguyễn Văn A` |
| role | TEXT | Vai trò (Enum) | `KITCHEN`, `CASHIER`, `STAFF`, `ADMIN` |
| pin_code | TEXT | Mã PIN 4 chữ số | `1234`, `0000`, `9999` |
| status | TEXT | Trạng thái | `ACTIVE` hoặc `INACTIVE` |
| created_at | TIMESTAMPTZ | Ngày tạo | `2025-12-27T10:00:00Z` |
| updated_at | TIMESTAMPTZ | Ngày sửa cuối | `2025-12-27T10:00:00Z` |

### Constraints

- ✅ PIN code chính xác 4 chữ số: `pin_code ~ '^\d{4}$'`
- ✅ Role chỉ là: ADMIN, STAFF, KITCHEN, CASHIER
- ✅ Status mặc định: ACTIVE
- ✅ REPLICA IDENTITY FULL (cho Real-time)
- ✅ Indexes trên: role, status, pin_code

---

## 2. Frontend Types (types.ts)

```typescript
export interface Employee {
  id: string;
  name: string;
  role: Role;  // ADMIN | STAFF | KITCHEN | CASHIER
  pinCode: string;  // 4 digits
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 3. RestaurantContext CRUD Operations

### State

```typescript
const [employees, setEmployees] = useState<Employee[]>([]);
```

### Hàm Fetch Ban Đầu

Tự động fetch khi app khởi động:

```typescript
const employeesRes = await supabase.from('employees').select('*');
if (employeesRes.data) setEmployees(employeesRes.data.map(transformEmployee));
```

### Real-time Subscription

Lắng nghe thay đổi từ Supabase:

```typescript
const employeesSubscription = supabase
  .channel('public:employees')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, ...)
  .subscribe();
```

### CRUD Operations

#### 1. **addEmployee** - Thêm nhân viên mới

```typescript
const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
  // Validate PIN code (phải 4 chữ số)
  if (!employee.pinCode || !/^\d{4}$/.test(employee.pinCode)) {
    throw new Error('PIN code must be exactly 4 digits');
  }
  
  await supabase
    .from('employees')
    .insert({
      name: employee.name,
      role: employee.role,
      pin_code: employee.pinCode,
      status: employee.status,
    });
}, []);
```

**Sử dụng:**
```typescript
await addEmployee({
  name: 'Nguyễn Văn A',
  role: 'KITCHEN',
  pinCode: '1234',
  status: 'ACTIVE'
});
```

#### 2. **updateEmployee** - Sửa thông tin nhân viên

```typescript
const updateEmployee = useCallback(async (employee: Employee) => {
  if (!employee.pinCode || !/^\d{4}$/.test(employee.pinCode)) {
    throw new Error('PIN code must be exactly 4 digits');
  }
  
  await supabase
    .from('employees')
    .update({
      name: employee.name,
      role: employee.role,
      pin_code: employee.pinCode,
      status: employee.status,
    })
    .eq('id', employee.id);
}, []);
```

**Sử dụng:**
```typescript
await updateEmployee({
  id: 'uuid-here',
  name: 'Nguyễn Văn B',
  role: 'CASHIER',
  pinCode: '5678',
  status: 'ACTIVE'
});
```

#### 3. **deleteEmployee** - Xóa nhân viên (Soft Delete)

```typescript
const deleteEmployee = useCallback(async (id: string) => {
  // Soft delete: chuyển status thành INACTIVE
  await supabase
    .from('employees')
    .update({ status: 'INACTIVE' })
    .eq('id', id);
}, []);
```

**Sử dụng:**
```typescript
await deleteEmployee('uuid-here');
// Nhân viên sẽ bị khóa (status = INACTIVE) chứ không bị xóa hẳn
```

**Ghi chú:** Sử dụng **Soft Delete** (chuyển status) thay vì xóa hẳn để giữ lại lịch sử.

---

## 4. AdminView UI Components

### Tab Navigation

```
[TỔNG QUAN] [THỰC ĐƠN] [NHÂN SỰ] [CÀI ĐẶT]
```

### NHÂN SỰ Tab - Giao Diện Chính

#### Header

- Tiêu đề: "NHÂN SỰ"
- Nút: "+ Thêm nhân viên mới" (Rose-600)

#### Grid Layout

- **Responsive:** 1 cột (mobile) → 2 cột (tablet) → 3 cột (desktop)
- **Card Style:** Rounded-[32px], subtle shadow, hover effect
- **Spacing:** Gap-6 giữa các card

### Employee Card Components

#### 1. Avatar Zone

- Màu nền: Gradient slate-100 → slate-200
- Icon theo vai trò:
  - 🛡️ **ADMIN**: Shield (slate-900)
  - 👨‍🍳 **KITCHEN**: ChefHat (orange-600)
  - 💳 **CASHIER**: Phone (blue-600)
  - 👤 **STAFF**: Users (emerald-600)
- Trạng thái (Dot):
  - 🟢 **ACTIVE**: emerald-500
  - 🔴 **INACTIVE**: red-500

#### 2. Employee Info

- **Tên:** Font size xl, font-black
- **Vai trò:** Badge với màu:
  - `ADMIN`: bg-slate-900 text-white
  - `KITCHEN`: bg-orange-100 text-orange-800
  - `CASHIER`: bg-blue-100 text-blue-800
  - `STAFF`: bg-emerald-100 text-emerald-800

#### 3. PIN Code Zone

```
┌─────────────────────────────┐
│ MÃ PIN                      │
│ ••••    [👁️ Icon]           │
└─────────────────────────────┘
```

- Mặc định ẩn: `••••`
- Click eye icon để xem mã PIN
- Font: monospace, tracking-widest

#### 4. Status Display

```
Trạng thái: ✓ Hoạt động    (emerald-600)
            ✗ Bị khóa      (red-600)
```

#### 5. Action Buttons

- **[Sửa]** Button xanh (blue-100) - Mở modal sửa
- **[Khóa]** Button đỏ (red-100) - Soft delete (đổi status → INACTIVE)

### Employee Modal - Thêm/Sửa

#### Modal Structure

```
┌─────────────────────────────────┐
│ Thêm Nhân Viên          [X]     │
├─────────────────────────────────┤
│                                 │
│ Tên nhân viên: [_________]      │
│                                 │
│ Vai trò:                        │
│  ○ ADMIN                        │
│  ○ KITCHEN                      │
│  ⦿ CASHIER                      │
│  ○ STAFF                        │
│                                 │
│ Mã PIN (4 chữ số): [••••]       │
│                                 │
│ Trạng thái:                     │
│  ⦿ Hoạt động   ○ Bị khóa       │
│                                 │
├─────────────────────────────────┤
│ [Hủy]  [💾 Lưu]                │
└─────────────────────────────────┘
```

#### Form Validation

✅ **Tên:** Không được rỗng
✅ **PIN:** Phải đúng 4 chữ số
✅ **Vai trò:** Bắt buộc chọn
✅ **Trạng thái:** Mặc định ACTIVE

#### PIN Input Features

- Type: `password` (ẩn)
- Max length: 4
- Chỉ nhập số (0-9)
- Hiển thị: `••••` để che mã PIN

---

## 5. Deployment Checklist

### Step 1: Deploy Database Schema

Chạy SQL migration trong Supabase:

```sql
-- Sao chép toàn bộ SQL từ supabase_schema.sql
-- Rồi execute trong SQL Editor của Supabase Dashboard
```

**Hoặc nếu dùng CLI:**
```bash
supabase db push
```

### Step 2: Kiểm tra Real-time

1. Vào Supabase Dashboard
2. Chọn project
3. Settings → Realtime
4. Đảm bảo `employees` được enable

### Step 3: Test trong App

1. Mở Admin → NHÂN SỰ
2. Click "+ Thêm nhân viên mới"
3. Nhập: Tên, Vai trò, PIN, Trạng thái
4. Click "Lưu"
5. Xác nhận nhân viên xuất hiện trong grid

### Step 4: Test Real-time Sync

1. Mở 2 tab browser cùng app
2. Thêm nhân viên ở tab 1
3. Xác nhận xuất hiện ngay trên tab 2 (không cần reload)

---

## 6. Sử Dụng Hàng Ngày

### Thêm Nhân Viên

```
Admin → NHÂN SỰ → [+ Thêm nhân viên mới]
→ Nhập: Tên, Vai trò, PIN (4 chữ số), Trạng thái
→ Click [Lưu]
```

### Sửa Nhân Viên

```
Admin → NHÂN SỰ → Card nhân viên → [Sửa]
→ Chỉnh sửa thông tin
→ Click [Lưu]
```

### Xem Mã PIN

```
Admin → NHÂN SỰ → Card nhân viên → [👁️ Eye Icon]
→ Mã PIN hiển thị (VD: 1234)
→ Click lại để ẩn
```

### Khóa Nhân Viên

```
Admin → NHÂN SỰ → Card nhân viên → [Khóa]
→ Xác nhận: "Bạn chắc chắn muốn khóa nhân viên này không?"
→ Status → INACTIVE (Nhân viên bị khóa nhưng dữ liệu giữ lại)
```

---

## 7. API Reference

### useRestaurant Hook

```typescript
const {
  employees,              // Employee[]
  addEmployee,            // (employee) => Promise<void>
  updateEmployee,         // (employee) => Promise<void>
  deleteEmployee,         // (id) => Promise<void>
} = useRestaurant();
```

### Ví Dụ Đầy Đủ

```typescript
// Thêm nhân viên
await addEmployee({
  name: 'Nguyễn Văn A',
  role: 'KITCHEN' as Role,
  pinCode: '1234',
  status: 'ACTIVE'
});

// Cập nhật
await updateEmployee({
  id: 'uuid-123',
  name: 'Nguyễn Văn A',
  role: 'CASHIER' as Role,
  pinCode: '5678',
  status: 'ACTIVE'
});

// Khóa nhân viên
await deleteEmployee('uuid-123');  // Soft delete, status → INACTIVE

// Lấy danh sách
const employees = useRestaurant().employees;
```

---

## 8. Styling Details

### Color Scheme

| Vai Trò | Màu Nền | Màu Chữ | Icon |
|---------|---------|---------|------|
| ADMIN | slate-900 | white | Shield |
| KITCHEN | orange-100 | orange-800 | ChefHat |
| CASHIER | blue-100 | blue-800 | Phone |
| STAFF | emerald-100 | emerald-800 | Users |

### Typography

- **Tiêu đề:** text-4xl font-black tracking-tighter
- **Card Title:** text-xl font-black
- **Badge:** text-xs font-black uppercase
- **Status:** text-xs font-bold
- **PIN:** text-lg font-black tracking-widest

### Spacing

- **Card Padding:** p-6
- **Gap giữa Card:** gap-6
- **Border Radius:** rounded-[32px] (card), rounded-2xl (button)
- **Shadow:** shadow-sm → shadow-lg on hover

---

## 9. FAQ & Troubleshooting

### Q: Tại sao nhân viên bị xóa mà không thể khôi phục?
**A:** Chúng tôi dùng Soft Delete (chỉ chuyển status → INACTIVE) nên dữ liệu vẫn giữ lại. Để khôi phục, hãy sửa nhân viên đó và chuyển status về ACTIVE.

### Q: Có thể set PIN code là gì?
**A:** PIN phải đúng **4 chữ số**. VD: 1234, 0000, 9999, v.v. Bạn có thể nhập tay hoặc click nút "Tạo" để sinh mã PIN ngẫu nhiên 4 số, hệ thống sẽ kiểm tra không trùng với nhân viên khác.

### Q: Real-time không hoạt động?
**A:** Kiểm tra:
1. Supabase Dashboard → Settings → Realtime
2. Đảm bảo bảng `employees` được enabled
3. Kiểm tra RLS policies

### Q: Làm sao để xem lịch sử thay đổi nhân viên?
**A:** Xem cột `updated_at` trên bảng Supabase. Có thể thêm Audit Log cho từng thay đổi nếu cần.

---

## 10. Mở Rộng Tương Lai

### Tính Năng Tiềm Năng

1. **Shifts & Schedule** - Lịch làm việc
2. **Performance Metrics** - Đánh giá nhân viên
3. **Salary Management** - Quản lý lương
4. **Login Audit** - Log tất cả lần đăng nhập
5. **Role-based Permissions** - Phân quyền chi tiết
6. **Backup/Export** - Export danh sách nhân viên

---

## 11. Liên Hệ & Support

Nếu gặp lỗi hoặc có câu hỏi, vui lòng:

1. Kiểm tra lại schema Supabase
2. Xem logs trong browser console (F12)
3. Kiểm tra connection tới Supabase
4. Kiểm tra Network tab (API requests)

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/12/2025
**Trạng thái:** Production Ready ✅
