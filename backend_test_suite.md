
# Lẩu Ngon POS - Backend Test Suite Specification

Tài liệu này định nghĩa các kịch bản kiểm thử (Test Cases) dành cho Backend API, tập trung vào logic nghiệp vụ và tính chính xác của dữ liệu tài chính.

---

## 1. Module: Authentication & Authorization (Auth)
**Mục tiêu:** Đảm bảo phân quyền RBAC hoạt động đúng.

| Test ID | Scenario | Payload (Input) | Expected Result |
| :--- | :--- | :--- | :--- |
| **AUTH-01** | Đăng nhập đúng | `{ username, password }` | `200 OK`, trả về `accessToken` và `role`. |
| **AUTH-02** | Khách hàng truy cập Admin | `GET /api/admin/stats` | `403 Forbidden` (Token role CUSTOMER không có quyền). |
| **AUTH-03** | Truy cập không Token | `GET /api/orders` | `401 Unauthorized`. |

---

## 2. Module: Table Management (State Machine)
**Mục tiêu:** Kiểm tra logic chuyển đổi trạng thái bàn ăn.

| Test ID | Scenario | Current State | Action | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **TBL-01** | Mở bàn trống | `EMPTY` | `POST /check-in` | State chuyển `OCCUPIED`, tạo `orderId`. |
| **TBL-02** | Mở bàn đang có khách | `OCCUPIED` | `POST /check-in` | `400 Bad Request` (Bàn đang được sử dụng). |
| **TBL-03** | Khách đặt bàn (Reservation) | `EMPTY` | `POST /reserve` | State chuyển `RESERVED`. |
| **TBL-04** | Dọn bàn bẩn | `DIRTY` | `POST /clean` | State chuyển `EMPTY`, reset `currentOrderId`. |

---

## 3. Module: Ordering & Pricing Logic (Critical)
**Mục tiêu:** Đây là phần quan trọng nhất. Kiểm tra logic tính giá Combo và phụ thu.

| Test ID | Scenario | Input Logic | Expected Result |
| :--- | :--- | :--- | :--- |
| **ORD-01** | Thêm món đơn | `menuItemId: "m3" (89k), qty: 2` | `totalAmount = 178,000`. |
| **ORD-02** | **Tính giá Combo + Phụ thu** | `Combo (299k)` + `Lẩu Thái (+29k)` | `totalAmount = 328,000`. (Verify server tự cộng giá option). |
| **ORD-03** | **Validation Combo (Min)** | Nhóm thịt chọn 1 (Yêu cầu 2) | `422 Unprocessable Entity` (Thiếu lựa chọn bắt buộc). |
| **ORD-04** | **Validation Combo (Max)** | Nhóm rau chọn 3 (Cho phép 2) | `422 Unprocessable Entity` (Vượt quá số lượng cho phép). |
| **ORD-05** | Đặt món hết hàng | `available: false` | `400 Bad Request` (Món đã hết hàng). |

---

## 4. Module: Kitchen Display System (KDS) Flow
**Mục tiêu:** Kiểm tra luồng trạng thái món ăn.

| Test ID | Scenario | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| **KDS-01** | Bắt đầu chế biến | `PENDING` -> `PREPARING` | `200 OK`, `updatedAt` thay đổi, bắn Socket `ITEM_STATUS`. |
| **KDS-02** | Báo hoàn tất | `PREPARING` -> `READY` | `200 OK`, bắn Socket cho Staff. |
| **KDS-03** | Hủy món sau khi làm | `READY` -> `CANCELLED` | `400 Bad Request` (Không thể hủy món đã nấu xong). |

---

## 5. Module: Checkout & Finance (Cashier)
**Mục tiêu:** Kiểm tra tính chính xác của VAT, Giảm giá và Doanh thu.

| Test ID | Scenario | Calculation Logic | Expected Result |
| :--- | :--- | :--- | :--- |
| **FIN-01** | Tính hóa đơn có giảm giá % | `Subtotal 1,000k`, `Disc 10%` | `Final: (1000 - 100) * 1.08 = 972k`. |
| **FIN-02** | Tính hóa đơn có giảm giá tiền | `Subtotal 1,000k`, `Disc 50k` | `Final: (1000 - 50) * 1.08 = 1026k`. |
| **FIN-03** | Hủy món giữa chừng | Món B (50k) bị `CANCELLED` | `Subtotal` tự động giảm 50k trước khi tính VAT. |
| **FIN-04** | Thanh toán thành công | `POST /checkout` | `isPaid: true`, Table chuyển `DIRTY`. |

---

## 6. Module: AI & Analytics
**Mục tiêu:** Kiểm tra tính ổn định của việc tổng hợp dữ liệu cho Gemini.

| Test ID | Scenario | Input | Expected Result |
| :--- | :--- | :--- | :--- |
| **AI-01** | Tổng hợp dữ liệu thô | Danh sách Orders trong ngày | JSON Payload chuẩn hóa cho Gemini (không quá 32k tokens). |
| **AI-02** | Xử lý lỗi API Gemini | Gemini trả về 500 hoặc rỗng | Backend trả về fallback message (Báo cáo mẫu có sẵn). |

---

## Hướng dẫn chạy Test (Technical Implementation)

```typescript
// Ví dụ mã nguồn kiểm thử logic tính tiền bằng Jest & Supertest
describe('POST /api/orders/:id/items', () => {
  it('should calculate combo price with extras correctly', async () => {
    const payload = {
      menuItemId: 'c1', // Combo 299k
      selectedOptions: ['opt1'], // Lẩu Thái +29k
      quantity: 1
    };
    const res = await request(app)
      .post('/api/orders/ord-123/items')
      .send(payload);
    
    expect(res.status).toBe(201);
    expect(res.body.item.price).toBe(328000); // 299000 + 29000
  });
});
```
