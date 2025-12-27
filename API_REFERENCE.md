# 📚 Lẩu Ngon POS - API & Context Reference

## RestaurantContext API

### State Properties

```typescript
const {
  // Authentication & Role
  role: Role | null,
  setRole: (role: Role | null) => void,

  // Data Collections
  menu: MenuItem[],
  tables: Table[],
  orders: Order[],
  reservations: Reservation[],

  // Current Session
  activeTableId: string | null,
  setActiveTableId: (id: string | null) => void,
} = useRestaurant();
```

### Order Management Functions

#### Start Table Session
```typescript
startTableSession(tableId: string, guestCount: number): Promise<void>
```
- Creates new Order for a table
- Updates table status to OCCUPIED
- Stores guest count
- **When to use**: Guest arrives, sit down

#### Add Item to Order
```typescript
addItemToOrder(
  tableId: string,
  item: MenuItem,
  quantity: number,
  note?: string,
  selectedOptions?: string[],
  variantPrice?: number
): Promise<void>
```
- Merges SINGLE items by menuItemId and note
- Creates new OrderItem for COMBO items
- Updates totalAmount and finalAmount
- **When to use**: Customer orders a dish

**Example**:
```typescript
const { addItemToOrder, orders } = useRestaurant();
const currentOrder = orders.find(o => o.tableId === tableId && !o.isPaid);

await addItemToOrder(
  tableId,
  menuItem,
  2,
  'Không cay',
  ['Lẩu Thái', 'Ba chỉ bò', 'Rau muống'],
  someVariantPrice
);
```

#### Update Order Item Status
```typescript
updateOrderItemStatus(
  orderId: string,
  itemId: string,
  status: OrderItemStatus
): Promise<void>
```
- Status flow: PENDING → PREPARING → READY → SERVED
- Auto-recalculates totals
- **When to use**: Kitchen marks item ready, staff marks item served

**Status Values**:
- `PENDING`: Just ordered, waiting for kitchen
- `PREPARING`: Kitchen started cooking
- `READY`: Cooked, ready to serve
- `SERVED`: Brought to customer
- `CANCELLED`: Hết / Cancel by customer

#### Update Kitchen Note
```typescript
updateOrderItemKitchenNote(
  orderId: string,
  itemId: string,
  note: string
): Promise<void>
```
- Kitchen sends message back to staff
- VD: "Hết tôm", "Chờ thêm 5 phút"
- **When to use**: Kitchen communication

---

### Table Management Functions

#### Request Bill
```typescript
requestBill(tableId: string): Promise<void>
```
- Sets `billRequested = true` on table
- Alerts cashier and staff
- **When to use**: Customer calls for bill

#### Checkout Table
```typescript
checkoutTable(
  tableId: string,
  paymentMethod: 'CASH' | 'QR' | 'CARD'
): Promise<void>
```
- Marks order as `isPaid = true`
- Stores payment method
- Updates table status to DIRTY (chờ dọn)
- Clears billRequested flag
- **When to use**: Payment completed

#### Close Table
```typescript
closeTable(tableId: string): Promise<void>
```
- Resets table to EMPTY
- Clears currentOrderId
- Clears guestCount, reservation, etc.
- **When to use**: Table cleaned and ready for next guests

#### Move Table
```typescript
moveTable(
  fromTableId: string,
  toTableId: string
): Promise<void>
```
- Transfers order from one table to another
- Updates both table statuses
- **When to use**: Customer requests to change table

---

### Discount & Payment

#### Apply Discount
```typescript
applyDiscount(
  orderId: string,
  discount: Discount
): Promise<void>
```
- Type: 'PERCENT' or 'FIXED'
- Recalculates finalAmount and grandTotal
- **Example**:
```typescript
// 10% discount
await applyDiscount(orderId, { type: 'PERCENT', value: 10 });

// 50,000 VND off
await applyDiscount(orderId, { type: 'FIXED', value: 50000 });
```

---

### Inventory & Menu

#### Mark Item Out of Stock
```typescript
markItemOutOfStock(menuItemId: string): Promise<void>
```
- Sets `available = false`
- Customers can't order it
- **When to use**: Hết nguyên liệu

#### Add Menu Item
```typescript
addMenuItem(
  item: Omit<MenuItem, 'id'>
): Promise<void>
```
- Creates new menu item
- Auto-generates ID
- **When to use**: Add new dish

#### Update Menu Item
```typescript
updateMenuItem(item: MenuItem): Promise<void>
```
- Updates existing menu item
- **When to use**: Change price, description, etc.

#### Delete Menu Item
```typescript
deleteMenuItem(id: string): Promise<void>
```
- Removes from menu permanently
- **When to use**: Discontinue a dish

#### Reorder Menu
```typescript
reorderMenu(newMenu: MenuItem[]): Promise<void>
```
- Changes display order
- Useful for drag & drop
- **When to use**: Admin rearranges menu

---

### Reservations

#### Add Reservation
```typescript
addReservation(
  res: Omit<Reservation, 'id' | 'status'>
): Promise<void>
```
- Creates reservation
- Optionally reserves a table
- **Example**:
```typescript
await addReservation({
  customerName: 'Nguyễn Văn A',
  phone: '0987654321',
  time: '19:00',
  guestCount: 4,
  tableId: 'table-5',
  note: 'Có bé nhỏ'
});
```

#### Cancel Reservation
```typescript
cancelReservation(id: string): Promise<void>
```
- Marks as CANCELLED
- Frees up table if reserved
- **When to use**: Customer cancels booking

#### Check In Reservation
```typescript
checkInReservation(
  reservationId: string,
  tableId: string
): Promise<void>
```
- Marks reservation as ARRIVED
- Starts table session automatically
- **When to use**: Reserved customer arrives

---

## Utility Functions Quick Reference

### Billing (`utils/billing.ts`)

```typescript
// Single calculations
const subtotal = calculateSubtotal(items);
const vat = calculateVAT(subtotal);
const discounted = applyDiscount(subtotal, discount);

// Complete breakdown
const breakdown = calculateOrderTotal(items, discount, includeVAT);
// Returns: { subtotal, discount, afterDiscount, vat, grandTotal }

// Formatting
const text = formatCurrency(150000); // "150.000 ₫"
const num = formatNumber(150000);     // "150.000"
```

### Combo (`utils/combo.ts`)

```typescript
// Validation
const valid = isComboValid(comboGroups, selections);
const groupValid = isGroupValid(group, selectedCount);

// Messages
const errors = getComboValidationMessages(groups, selections);
const msg = getGroupValidationMessage(group, selectedCount);

// Formatting
const description = formatComboSelection(groups, selections);
// Returns: ["Chọn vị nước lẩu: Lẩu Thái", "Chọn 2 loại thịt: 2 món", ...]

// Price calculation
const price = calculateComboVariantPrice(
  299000,
  selectedOptions,
  allOptions
);
```

### Time (`utils/time.ts`)

```typescript
// Elapsed time
const minutes = getElapsedMinutes(startTime);
const status = getBurnStatus(startTime);
// Returns: 'normal' | 'yellow' | 'red'

// Formatting
formatElapsedTime(startTime);  // "05:32"
formatTime(timestamp);          // "19:30"
formatDateTime(timestamp);      // "27/12/2025 19:30:15"
formatRelativeTime(timestamp);  // "5p trước"
getTimeUntil(reservationTime);  // "Sau 2h nữa"
```

### Kitchen (`utils/kitchen.ts`)

```typescript
// Aggregation
const needed = aggregateKitchenItems(orders, tables);
// Returns: [{ menuItemId, name, totalQuantity, items: [...] }]

// Filtering
const pending = getItemsByStatus(orders, tables, ['PENDING']);
const ready = getItemsByStatus(orders, tables, ['READY']);

// Table statistics
const readyPerTable = getReadyItemsByTable(orders);
// Returns: { 'table-1': 3, 'table-2': 1, ... }

// Item status
const status = getOrderItemBurnStatus(item);
// Returns: 'normal' | 'yellow' | 'red'

// Quick counts
const count = getPendingItemCount(orders);
```

### Table (`utils/table.ts`)

```typescript
// Status information
const color = getTableStatusColor(TableStatus.OCCUPIED);  // #4CAF50
const className = getTableStatusClass(status);
const label = getTableStatusLabel(status);                // "Có khách"
const available = isTableAvailable(status);

// Grouping
const grouped = getTablesByStatus(tables);
// Returns: { EMPTY: [...], OCCUPIED: [...], ... }

// Sorting
const sorted = sortTables(tables);

// Statistics
const readyCount = getTableReadyCount(table, orders);
const needsAttention = doesTableNeedAttention(table);

// Complete info
const info = getTableInfo(table, orders);
// Returns: { name, status, guestCount, readyCount, needsAttention }
```

### UI (`utils/ui.ts`)

```typescript
// String manipulation
truncateText(longText, 20);
capitalize(text);
getStatusLabel('PENDING'); // "Chờ xử lý"

// Validation
isValidPhoneNumber('0987654321');  // true
isValidEmail('user@domain.com');   // true

// Utilities
const id = generateId('item');     // "item1735291234567-abc123def"
debounce(expensiveFunc, 300);
throttle(scrollHandler, 1000);
isEmpty(obj);
copyToClipboard(text);
```

---

## Custom Hooks Quick Reference

### useToast
```typescript
import { useToast } from '@/hooks';

const { toasts, addToast, success, error, warning, info } = useToast();

// Usage
success('Lưu thành công!', 3000);  // 3 second auto-dismiss
error('Có lỗi xảy ra!');
warning('Bạn chắc chứ?');
info('Thông tin cập nhật');
```

### useDebounce & useThrottle
```typescript
import { useDebounce, useThrottle } from '@/hooks';

// Debounce (waits for pause)
const handleSearch = useDebounce((query: string) => {
  // API call after user stops typing
}, 500);

// Throttle (limits frequency)
const handleScroll = useThrottle(() => {
  // Called max once per 1 second
}, 1000);
```

### useLocalStorage & useSessionStorage
```typescript
import { useLocalStorage, useSessionStorage } from '@/hooks';

// Persistent across refreshes
const [savedData, setSavedData] = useLocalStorage('key', {});

// Session only
const [tempData, setTempData] = useSessionStorage('temp', []);
```

---

## Real-time Sync Workflow

### What Happens When Customer Orders

```
1. CustomerView → addItemToOrder()
   ↓
2. RestaurantContext → Supabase INSERT/UPDATE
   ↓
3. Supabase Realtime Broadcast
   ↓
4. KitchenView → Receives update
   KitchenView → Displays new item with burn effect
   ↓
5. StaffView → Receives update
   StaffView → Updates ready item count
   ↓
6. CashierView → Receives update
   CashierView → Adds to bill
```

### What Happens When Kitchen Marks Ready

```
1. KitchenView → updateOrderItemStatus(id, READY)
   ↓
2. Supabase UPDATE orders
   ↓
3. Real-time broadcast to all devices
   ↓
4. StaffView → Ready count increases
   StaffView → Staff picks up and serves
   ↓
5. StaffView → updateOrderItemStatus(id, SERVED)
   ↓
6. KitchenView → Item disappears (status filter)
```

---

## Performance Tips

### Optimize Calculations
```typescript
// ✅ Good: Use useMemo
const totals = useMemo(() => calculateOrderTotal(items), [items]);

// ❌ Bad: Recalculate every render
const totals = calculateOrderTotal(items);
```

### Avoid Unnecessary Renders
```typescript
// ✅ Good: Only when dependencies change
const filtered = useMemo(() => 
  items.filter(i => i.status === 'READY'),
  [items]
);

// ❌ Bad: Creates new array every render
const filtered = items.filter(i => i.status === 'READY');
```

### Debounce Expensive Operations
```typescript
// ✅ Good: Waits for typing to stop
const handleSearch = useDebounce((query) => {
  fetchMenuItems(query);
}, 500);

// ❌ Bad: API call on every keystroke
const handleSearch = (query) => {
  fetchMenuItems(query);
};
```

---

## Common Patterns

### Loading Order for a Table
```typescript
const { orders, tables } = useRestaurant();

const tableOrder = orders.find(
  o => o.tableId === activeTableId && !o.isPaid
);

if (!tableOrder) {
  // No active order
}
```

### Filtering Items by Status
```typescript
const readyItems = order?.items.filter(
  i => i.status === OrderItemStatus.READY
) ?? [];
```

### Handling Payment
```typescript
await checkoutTable(tableId, 'CASH');
// Table now DIRTY (waiting to be cleaned)
// Order marked as isPaid = true
```

### Formatting Display
```typescript
const totalText = formatCurrency(order.grandTotal);
// "150.000 ₫"

const timeText = formatTime(order.startTime);
// "19:30"

const elapsedText = formatElapsedTime(item.timestamp);
// "05:32"
```

---

## Error Handling

### Safe API Calls
```typescript
try {
  await addItemToOrder(tableId, item, qty);
} catch (error) {
  console.error('Failed to add item:', error);
  // Show error toast
}
```

### Check Before Operations
```typescript
const order = orders.find(o => o.tableId === tableId && !o.isPaid);
if (!order) {
  return; // No active order to update
}
```

### Validate User Input
```typescript
if (!isValidPhoneNumber(phone)) {
  error('Số điện thoại không hợp lệ');
  return;
}
```

---

## Testing Examples

```typescript
// Test combo validation
test('should validate combo groups', () => {
  const groups = [
    { id: 'g1', title: 'Broth', min: 1, max: 1, options: [] }
  ];
  const selections = { 'g1': ['Thái'] };
  
  expect(isComboValid(groups, selections)).toBe(true);
});

// Test billing
test('should calculate with discount', () => {
  const items = [{ price: 100000, quantity: 2 }];
  const discount = { type: 'PERCENT', value: 10 };
  
  const result = calculateOrderTotal(items, discount, false);
  expect(result.afterDiscount).toBe(180000);
});

// Test time formatting
test('should format elapsed time', () => {
  const now = Date.now();
  const past = now - 5 * 60 * 1000; // 5 minutes ago
  
  expect(formatElapsedTime(past)).toBe('05:00');
});
```

---

**Last Updated**: December 27, 2025  
**For**: Lẩu Ngon POS v1.0.0
