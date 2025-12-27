
# Lẩu Ngon POS - AI System Context & Developer Guide

Tài liệu này cung cấp toàn bộ ngữ cảnh hệ thống cho AI để hỗ trợ bảo trì, nâng cấp và xây dựng Backend.

## 1. Tổng quan Hệ thống (System Overview)
Đây là hệ thống Quản lý nhà hàng (POS) chuyên biệt cho mô hình **Nhà hàng Lẩu**, đa vai trò (Multi-role), đa tính năng (Multi-feature).

### Các Vai trò (RBAC):
- **CUSTOMER**: Xem menu, đặt món (hỗ trợ Combo phức tạp), gọi nhân viên, yêu cầu thanh toán.
- **STAFF**: Quản lý sơ đồ bàn, mở bàn, dọn bàn, đặt bàn (Reservation), phục vụ món.
- **KITCHEN**: Nhận đơn theo thời gian thực (KDS), quản lý quy trình chế biến, báo hết món.
- **CASHIER**: Quản lý hóa đơn, áp dụng giảm giá, xử lý thanh toán, xem lịch sử giao dịch.
- **ADMIN**: Dashboard doanh thu, quản lý nhân sự, quản lý Menu (Drag & Drop), báo cáo AI (Gemini).

## 2. Logic Nghiệp vụ Cốt lõi (Core Business Logic)

### A. Kitchen Display System (KDS) Elite
Hệ thống bếp được tối ưu cho hiệu suất cao:
- **Burn Effect**: Món ăn sau 10 phút sẽ chuyển cảnh báo Amber, sau 15 phút sẽ chuyển Red "Burn" (nháy cảnh báo) để đầu bếp ưu tiên.
- **Aggregation Sidebar**: Tự động gom nhóm các món cùng loại đang chờ xử lý để đầu bếp chuẩn bị nguyên liệu một lần cho nhiều bàn.
- **Touch-First UI**: Các nút hành động có kích thước tối thiểu 64px để thao tác chính xác trong môi trường bận rộn.

### B. Logic Combo (Phức tạp nhất)
Hệ thống xử lý món ăn dạng `COMBO` khác với `SINGLE`.
- **Cấu trúc**: Một Combo gồm nhiều `ComboGroup` (Ví dụ: Chọn nước lẩu, Chọn thịt).
- **Ràng buộc**: Mỗi group có `min` và `max` số lượng lựa chọn.
- **Phụ thu (Extra Price)**: Một số option trong Combo có thể có giá phụ thu (Ví dụ: Lẩu Thái +29k).

### C. Vòng đời Bàn (Table Lifecycle)
`EMPTY` (Trống) -> `RESERVED` (Đặt trước) -> `OCCUPIED` (Có khách) -> `DIRTY` (Khách về, chờ dọn) -> `EMPTY`.

## 3. Quy tắc Thiết kế Thị giác (Visual Hierarchy Rules)
Khi cập nhật giao diện, AI phải tuân thủ:
- **Typography**: Sử dụng font chữ "Black" (font-black) cho các thông tin quan trọng như Tên Bàn, Số lượng món.
- **Color Palettes**: 
  - Admin/Kitchen: Nền Slate-950/Black để giảm mỏi mắt.
  - Customer: Nền White/Slate-50 với điểm nhấn Rose-600 để kích thích vị giác.
- **Borders**: Sử dụng border-radius lớn (rounded-[32px] hoặc rounded-[40px]) để tạo cảm giác hiện đại.
- **Shadows**: Sử dụng shadow-2xl và shadow-inner cho các nút bấm trạng thái.

## 4. Hướng dẫn cho AI khi làm việc với Codebase này

### Khi sửa lỗi (Debugging):
- Luôn kiểm tra `types.ts` trước để đảm bảo tính nhất quán về kiểu dữ liệu.
- Kiểm tra `calculateTotal` trong `RestaurantContext` nếu có lỗi liên quan đến tiền bạc.

### Khi nâng cấp Backend (Migration):
- Chuyển toàn bộ logic trong `RestaurantContext` sang các API Controller.
- Thay thế `localStorage` bằng việc gọi API thực tế.
- Thiết lập WebSocket để thay thế cơ chế đồng bộ giả lập hiện tại.

## 5. Lưu ý Bảo mật
- API Key của Gemini hiện đang ở Frontend (Chỉ dùng cho Demo). Khi deploy thật, AI phải hướng dẫn người dùng chuyển logic này về phía Server.
