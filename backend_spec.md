# Lẩu Ngon POS - Backend Specification & Feature Checklist

Tài liệu này mô tả chi tiết các chức năng, luồng dữ liệu và logic nghiệp vụ cần thiết kế phía Backend để phục vụ cho Frontend hiện tại.

## 1. Core Entities (Thực thể cốt lõi)

Backend cần thiết kế Database Schema xoay quanh các thực thể sau:

*   **Users/Employees**: Quản lý nhân viên, mật khẩu (hash) và phân quyền (RBAC).
*   **Tables**: Quản lý trạng thái bàn ăn, số lượng khách.
*   **Menu**: Quản lý món ăn, danh mục, nguyên liệu (`ingredients`), cờ ưu tiên (`isRecommended`) và cấu hình Combo phức tạp.
*   **Orders**: Quản lý đơn hàng tổng (theo bàn/phiên).
*   **OrderItems**: Quản lý chi tiết từng món, các option đi kèm (`selectedOptions`) và trạng thái chế biến.

---

## 2. Chi tiết chức năng theo Modules

### Module 0: Hệ thống & Xác thực (System & Auth) - **MỚI**

| Chức năng | Logic Backend | API Endpoint gợi ý |
| :--- | :--- | :--- |
| **Đăng nhập** | Xác thực Username/Password. Trả về JWT Token + Role (`CUSTOMER`, `STAFF`, `KITCHEN`, `CASHIER`, `ADMIN`). | `POST /api/auth/login` |
| **Health Check** | API nhẹ để Frontend kiểm tra kết nối internet/server (Icon Wifi ở màn hình Bếp). | `GET /api/health` |
| **Upload Ảnh** | Nhận file ảnh (Multipart/form-data), lưu vào Storage (Disk/S3), trả về Public URL để lưu vào Menu. | `POST /api/upload/image` |

### Module 1: Quản lý Menu (Master Data)

Logic menu của hệ thống này có độ phức tạp cao do hỗ trợ **Combo**.

| Chức năng | Logic Backend | API Endpoint gợi ý |
| :--- | :--- | :--- |
| **CRUD Món ăn** | Lưu thêm các trường: `ingredients` (Array string), `isRecommended` (Boolean) để hiển thị phần "Món ngon phải thử". | `GET/POST/PUT/DELETE /api/menu` |
| **Cấu hình Combo** | Một món `COMBO` chứa danh sách `ComboGroups`. Mỗi Group có `min`, `max`. Option có thể có `price` (giá phụ thu). | `POST /api/menu/combo` |
| **Sắp xếp Menu** | Nhận một danh sách ID món ăn theo thứ tự mới để cập nhật index hiển thị. | `PUT /api/menu/reorder` |
| **Quản lý kho** | Toggle trạng thái `available` (True/False). | `PATCH /api/menu/{id}/availability` |

### Module 2: Quản lý Bàn (Table Session)

| Chức năng | Logic Backend | API Endpoint gợi ý |
| :--- | :--- | :--- |
| **Trạng thái bàn** | Enum: `EMPTY`, `OCCUPIED`, `DIRTY`. | `GET /api/tables` |
| **Mở bàn (Check-in)** | Chuyển trạng thái `OCCUPIED`, lưu `guestCount` (số khách). Tạo `order_id` mới. | `POST /api/tables/{id}/session` |
| **Yêu cầu thanh toán** | Cập nhật flag `billRequested = true`. Bắn Socket `TABLE_UPDATE` cho Thu ngân. | `POST /api/tables/{id}/request-bill` |
| **Đóng bàn (Clean)** | Reset về `EMPTY`, xóa `currentOrderId`, xóa flag `billRequested`. | `POST /api/tables/{id}/close` |

### Module 3: Đặt món (Ordering Flow)

**QUAN TRỌNG:** Backend phải chịu trách nhiệm tính tiền để đảm bảo bảo mật.

| Chức năng | Logic Backend | API Endpoint gợi ý |
| :--- | :--- | :--- |
| **Thêm món (Validation)** | Client gửi: `menuItemId`, `quantity`, `note`, `selectedOptions` (List tên/ID). <br> **Server Logic:** <br> 1. Lấy giá gốc món ăn từ DB. <br> 2. Nếu là Combo: Duyệt qua `selectedOptions`, cộng thêm giá phụ thu (nếu có) từ cấu hình Menu trong DB. <br> 3. **KHÔNG** dùng giá Client gửi lên. <br> 4. Kiểm tra rule Combo (đủ min/max chưa). | `POST /api/orders/{id}/items` |
| **Ghi chú món** | Lưu note của khách vào `OrderItem`. | (Kèm trong payload thêm món) |
| **Gọi nhân viên** | Bắn Socket event `CALL_STAFF` kèm `tableId`. | `POST /api/notifications/staff` |

### Module 4: Bếp & Bar (KDS)

| Chức năng | Logic Backend | API Endpoint gợi ý |
| :--- | :--- | :--- |
| **Phân loại Bếp/Bar** | Query Param `?type=KITCHEN` (Lấy món ăn) hoặc `?type=BAR` (Lấy Category=DRINK). | `GET /api/kitchen/items` |
| **Quy trình trạng thái** | Flow: `PENDING` -> `PREPARING` -> `READY` -> `SERVED`. <br> Cập nhật status phải bắn Socket để màn hình Staff biết món đã `READY`. | `PATCH /api/order-items/{id}/status` |
| **Hủy/Hết món** | Chuyển `CANCELLED`. Tính lại tổng tiền Order ngay lập tức (trừ tiền món hủy). | `PATCH /api/order-items/{id}/cancel` |
| **Ghi chú nội bộ** | Lưu `kitchenNote` (ví dụ: "Khách đổi món"). | `PATCH /api/order-items/{id}/kitchen-note` |

### Module 5: Phục vụ (Staff)

| Chức năng | Logic Backend | API Endpoint gợi ý |
| :--- | :--- | :--- |
| **Nhận món (Serving)** | Chuyển trạng thái `SERVED`. | `PATCH /api/order-items/{id}/serve` |
| **Order hộ khách** | Quyền tương tự Customer nhưng không cần check session (Staff override). | `POST /api/orders/{id}/items` |
| **Xem chi tiết** | Trả về danh sách món của bàn, sắp xếp theo: Ready -> Preparing -> Pending. | `GET /api/tables/{id}/order-details` |

### Module 6: Thu ngân (Cashier)

| Chức năng | Logic Backend | API Endpoint gợi ý |
| :--- | :--- | :--- |
| **Tính Bill** | Tính tổng: `Sum(Items)`. Loại bỏ các item `CANCELLED`. | `GET /api/orders/{id}/bill` |
| **Thanh toán** | Cập nhật `isPaid = true`, `paymentMethod` (`CASH`/`QR`/`CARD`). <br> Chuyển trạng thái bàn: `OCCUPIED` -> `DIRTY` (Để Staff biết vào dọn). | `POST /api/orders/{id}/checkout` |

### Module 7: Báo cáo & Admin

| Chức năng | Logic Backend | API Endpoint gợi ý |
| :--- | :--- | :--- |
| **Dashboard** | Aggregation: Doanh thu ngày, Top món bán chạy (`isRecommended` items performance). | `GET /api/stats/daily` |
| **Quản lý User** | CRUD nhân viên. Reset mật khẩu về mặc định. | `POST /api/admin/users`, `POST /api/admin/users/reset-password` |
| **AI Report** | Proxy gọi Google Gemini API. Input: JSON sale data. Output: Text analysis. | `POST /api/ai/generate-report` |
| **Backup** | Dump toàn bộ DB ra JSON. | `GET /api/admin/backup` |

---

## 3. Yêu cầu phi chức năng (Non-functional Requirements)

1.  **Real-time (WebSocket)**:
    *   Bắt buộc dùng Socket.io hoặc WebSocket thuần.
    *   Events: `ORDER_NEW` (Bếp), `ITEM_READY` (Staff), `CALL_STAFF` (Staff), `BILL_REQUEST` (Thu ngân), `TABLE_UPDATE` (Toàn bộ).

2.  **Data Consistency**:
    *   Sử dụng Transaction khi Thanh toán (Cập nhật Order + Cập nhật Bàn).
    *   Optimistic Locking khi 2 nhân viên cùng sửa 1 order.

3.  **Performance**:
    *   Index các trường thường xuyên query: `tableId`, `status`, `category`.
