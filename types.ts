export enum Role {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
  ADMIN = 'ADMIN'
}

export enum TableStatus {
  EMPTY = 'EMPTY',           // Trống, sẵn sàng nhận khách
  OCCUPIED = 'OCCUPIED',     // Có khách đang ăn
  DIRTY = 'DIRTY',           // Chờ dọn bàn
  RESERVED = 'RESERVED'      // Được đặt trước
}

export enum OrderItemStatus {
  PENDING = 'PENDING',     // Mới order
  PREPARING = 'PREPARING', // Bếp đang làm
  READY = 'READY',         // Bếp làm xong
  SERVED = 'SERVED',       // Đã mang ra bàn
  CANCELLED = 'CANCELLED'  // Đã hủy/Hết món
}

export enum ProductCategory {
  COMBO = 'COMBO',   
  BROTH = 'BROTH',   
  MEAT = 'MEAT',     
  SEAFOOD = 'SEAFOOD', 
  VEGGIE = 'VEGGIE', 
  DRINK = 'DRINK',   
  OTHER = 'OTHER'    
}

export enum ItemType {
  SINGLE = 'SINGLE',
  COMBO = 'COMBO'
}

export interface ComboOption {
  id: string;
  name: string;
  price?: number; 
}

export interface ComboGroup {
  id: string;
  title: string; 
  min: number;   
  max: number;   
  options: ComboOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  description?: string;
  available: boolean;
  type: ItemType; 
  comboGroups?: ComboGroup[]; 
  isRecommended?: boolean; 
  ingredients?: string[]; 
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;           // Giá gốc (bao gồm phụ thu nếu có)
  quantity: number;
  note?: string;           // Ghi chú khách hàng (VD: "Không cay", "Thêm mỡ")
  kitchenNote?: string;    // Ghi chú phục vụ gửi cho bếp
  selectedOptions?: string[]; // Chi tiết combo (VD: ["Lẩu Thái", "Ba chỉ bò", "Rau muống"])
  status: OrderItemStatus;
  timestamp: number;       // Thời điểm order
  prepStartTime?: number;  // Thời điểm bắt đầu nấu (dùng tính burn effect)
}

export interface Table {
  id: string;
  name: string;
  status: TableStatus;  // Link tới Order hiện tại
  guestCount?: number;       // Số khách hiện tại
  billRequested?: boolean;   // Khách yêu cầu thanh toán
  reservationId?: string;    // Link tới Reservation nếu có
  position?: { x: number; y: number }; // Vị trí trên sơ đồ bàn (cho StaffView)
  section?: string;          // Khu vực (VD: "Tầng 1", "Ngoài trời")
  currentOrderId?: string;   // ID đơn hàng hiện tại
}

export interface Discount {
  type: 'PERCENT' | 'FIXED';
  value: number;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  time: string; // ISO String or HH:mm
  guestCount: number;
  tableId?: string; // Có thể gán bàn trước hoặc không
  status: 'PENDING' | 'ARRIVED' | 'CANCELLED';
  note?: string;
}

export interface Order {
  id: string;
  tableId: string;           // Link tới bàn
  items: OrderItem[];        // Danh sách items trong đơn
  startTime: number;         // Thời điểm mở bàn
  totalAmount: number;       // Tổng tiền (chưa trừ discount, chưa tính VAT)
  isPaid: boolean;           // Đã thanh toán chưa
  paymentMethod?: 'CASH' | 'QR' | 'CARD';
  discount?: Discount;       // Giảm giá
  finalAmount?: number;      // Tổng cuối cùng (sau discount, chưa VAT)
  taxAmount?: number;        // Tiền VAT
  grandTotal?: number;       // Tổng cộng (cuối cùng, có VAT)
  updatedAt?: number;        // Lần cập nhật cuối cùng
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  pinCode: string;           // 4 chữ số
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}