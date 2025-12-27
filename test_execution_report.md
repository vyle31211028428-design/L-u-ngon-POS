# Báo Cáo Kiểm Thử Phần Mềm (Test Execution Report)

**Ứng dụng:** Lẩu Ngon POS
**Phiên bản:** 1.0 (Frontend Prototype)
**Người kiểm thử:** AI Senior QA Engineer
**Ngày kiểm thử:** 24/05/2024

---

## 1. Tóm tắt kết quả (Executive Summary)

Dựa trên việc phân tích mã nguồn (`Static Code Analysis`), ứng dụng có logic frontend rất chặt chẽ, xử lý tốt các luồng nghiệp vụ phức tạp như Combo và trạng thái đơn hàng. Tuy nhiên, vì chưa có Backend thực tế, ứng dụng gặp giới hạn về đồng bộ dữ liệu giữa các vai trò.

*   **Tổng số Test Case:** 12
*   **Passed (Đạt):** 10
*   **Failed (Trượt):** 0
*   **Warning (Cảnh báo):** 2 (Liên quan đến kiến trúc và bảo mật)

---

## 2. Chi tiết Test Cases & Kết quả

### Phân hệ: Khách hàng (Customer View)

| ID | Kịch bản kiểm thử (Scenario) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected) | Kết quả thực tế (Actual) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Đặt món Combo (Luồng phức tạp)** | 1. Chọn "Combo Lẩu Uyên Ương".<br>2. Chọn nước lẩu "Tứ Xuyên" (Phụ thu 39k).<br>3. Chọn đủ 2 loại thịt, 2 loại rau.<br>4. Thêm vào giỏ. | - Giá món trong giỏ = Giá gốc (299k) + 39k = 338k.<br>- Hiển thị chi tiết các lựa chọn. | Code `CustomerView.tsx` hàm `confirmCombo` tính toán `extraPrice` chính xác và hiển thị `selectedOptions`. | ✅ PASS |
| **TC-02** | **Validation số lượng Combo** | 1. Chọn Combo.<br>2. Không chọn đủ số lượng tối thiểu (Min) của nhóm "Chọn thịt".<br>3. Bấm "Thêm vào giỏ". | Nút "Thêm vào giỏ" bị vô hiệu hóa (Disabled) hoặc báo lỗi. | Hàm `isComboValid()` kiểm tra `selectedCount >= group.min` và disable nút thêm. | ✅ PASS |
| **TC-03** | **Sửa ghi chú trong giỏ hàng** | 1. Thêm món vào giỏ.<br>2. Mở giỏ hàng, bấm icon sửa ghi chú.<br>3. Nhập "Không hành". | Ghi chú được cập nhật vào item trong giỏ. | State `cart` được cập nhật qua `setCart` khi sửa input. | ✅ PASS |
| **TC-04** | **Đặt món khi hết hàng** | 1. Tìm món có `available: false`.<br>2. Cố gắng bấm nút "Thêm". | Nút thêm bị mờ (Disabled) hoặc thông báo lỗi. | Code render check `!item.available` để disable button và thêm class `grayscale`. | ✅ PASS |

### Phân hệ: Bếp (Kitchen View)

| ID | Kịch bản kiểm thử (Scenario) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected) | Kết quả thực tế (Actual) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-05** | **Lọc món ăn/đồ uống** | 1. Vào màn hình Bếp.<br>2. Bấm tab "Quầy Bar". | Chỉ hiển thị các món có Category là `DRINK`. | `filteredItems` sử dụng `menuItem.category === ProductCategory.DRINK` để lọc. | ✅ PASS |
| **TC-06** | **Chuyển trạng thái đơn hàng** | 1. Đơn mới (PENDING) -> Bấm "Nhận đơn".<br>2. Đang nấu (PREPARING) -> Bấm "Báo xong". | - Trạng thái chuyển sang PREPARING.<br>- Trạng thái chuyển sang READY. | Hàm `handleStatusChange` xử lý đúng luồng trạng thái tuần tự. | ✅ PASS |
| **TC-07** | **Giao tiếp Bếp -> Phục vụ** | 1. Bếp bấm vào "Note" trên món ăn.<br>2. Nhập "Hết bò, khách đổi gà được không?".<br>3. Lưu. | Staff hoặc Thu ngân nhìn thấy ghi chú này. | Context `updateOrderItemKitchenNote` lưu vào order. StaffView hiển thị `item.kitchenNote`. | ✅ PASS |

### Phân hệ: Thu ngân & Thanh toán (Cashier View)

| ID | Kịch bản kiểm thử (Scenario) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected) | Kết quả thực tế (Actual) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-08** | **Tính tổng tiền khi có món Hủy** | 1. Bàn có 2 món: Món A (100k), Món B (50k).<br>2. Bếp hủy món B.<br>3. Thu ngân xem hóa đơn. | Tổng tiền chỉ còn 100k (Không tính món B). | Hàm tính toán trong `RestaurantContext` có logic `i.status === OrderItemStatus.CANCELLED ? sum : ...`. | ✅ PASS |
| **TC-09** | **Quy trình thanh toán & Dọn bàn** | 1. Thu ngân bấm Thanh toán (Tiền mặt).<br>2. Sau đó bấm "Dọn bàn". | - Order chuyển `isPaid=true`.<br>- Bàn chuyển `DIRTY` -> `EMPTY`.<br>- Doanh thu được ghi nhận. | Logic `checkoutTable` và `closeTable` xử lý đầy đủ việc reset state bàn và cập nhật order. | ✅ PASS |

### Phân hệ: Admin & Hệ thống

| ID | Kịch bản kiểm thử (Scenario) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected) | Kết quả thực tế (Actual) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-10** | **Tạo báo cáo AI** | 1. Vào Dashboard.<br>2. Bấm "Tạo báo cáo". | Gọi API Gemini và trả về text phân tích. | Code `geminiService.ts` đã setup đúng SDK. **Lưu ý:** Cần `process.env.API_KEY` thực tế. | ⚠️ WARNING |
| **TC-11** | **Kéo thả Menu (Drag & Drop)** | 1. Vào quản lý Menu.<br>2. Kéo món A thả vào vị trí món B. | Thứ tự món thay đổi trên giao diện Khách hàng. | Logic `handleDrop` cập nhật mảng menu và lưu vào Context. | ✅ PASS |
| **TC-12** | **Đồng bộ dữ liệu (Giả lập)** | 1. Mở 2 Tab trình duyệt (Tab A: Khách, Tab B: Bếp).<br>2. Khách đặt món bên Tab A. | Tab B tự động hiển thị đơn hàng mới. | **Hiện tại:** Dùng `localStorage` nên cần F5 hoặc sự kiện `storage` để đồng bộ. Context hiện tại chưa lắng nghe sự kiện `storage` của window. | ⚠️ WARNING |

---

## 3. Phân tích lỗi & Cảnh báo (Technical Audit)

### ⚠️ Warning 1: Bảo mật API Key (File: `services/geminiService.ts`)
*   **Mô tả:** Code hiện tại đang truy cập `process.env.API_KEY` trực tiếp ở phía Frontend (Client-side).
*   **Rủi ro:** Khi build production (ví dụ bằng Vite/Webpack), API Key sẽ bị lộ trong source code JS của trình duyệt. Hacker có thể lấy Key này để dùng chùa hạn mức OpenAI/Gemini của bạn.
*   **Khuyến nghị:** Di chuyển logic gọi AI này sang Backend (Node.js) như đã đề cập trong `backend_spec.md`. Frontend chỉ gọi `POST /api/ai/generate-report`.

### ⚠️ Warning 2: Đồng bộ Real-time (File: `context/RestaurantContext.tsx`)
*   **Mô tả:** Ứng dụng đang hoạt động như một "Single User App". Nếu Bếp dùng iPad, Thu ngân dùng PC, họ sẽ **không thấy** dữ liệu của nhau vì `localStorage` chỉ nằm trên trình duyệt của từng máy.
*   **Khuyến nghị:** Đây là giới hạn đã biết của bản Prototype. Bắt buộc phải triển khai Backend + Database + WebSocket để chạy thực tế.

### ✅ Điểm cộng (Good Practices Found)
1.  **Logic tính tiền (Pricing Logic):**
    *   Trong `RestaurantContext.tsx`: `const newTotal = updatedItems.reduce(...)`. Logic này rất tốt vì nó tính toán lại tổng tiền mỗi khi trạng thái món thay đổi (ví dụ: bị Hủy), đảm bảo Thu ngân không bao giờ thu sai tiền món khách không ăn.
2.  **Xử lý Combo:**
    *   Cách `CustomerView` xử lý `selectedOptions` và đẩy xuống Context dưới dạng text string kèm giá phụ thu (`Lẩu Thái (+29k)`) là cách xử lý thông minh để Bếp dễ đọc và Thu ngân dễ check bill mà không cần join bảng phức tạp ở phía Frontend.

---

## 4. Kết luận
Mã nguồn Frontend có chất lượng logic tốt (High Logic Quality). Các luồng nghiệp vụ F&B đặc thù (Lẩu, Combo, Bếp/Bar, Hủy món) đều đã được xử lý chính xác.

**Hành động tiếp theo:**
1.  Developer có thể dùng bộ code này làm "Specification sống" để code Backend.
2.  Cần fix ngay vấn đề bảo mật API Key nếu định deploy bản demo lên internet.
