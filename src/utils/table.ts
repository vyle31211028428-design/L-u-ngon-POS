/**
 * Utility functions for table operations and staff view
 */

import { Table, TableStatus, Order, OrderItem } from '../../types';

/**
 * Get color for table status (for visual indication)
 */
export const getTableStatusColor = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.EMPTY:
      return '#FFFFFF'; // White
    case TableStatus.OCCUPIED:
      return '#4CAF50'; // Green
    case TableStatus.DIRTY:
      return '#F44336'; // Red
    case TableStatus.RESERVED:
      return '#FF9800'; // Orange
    default:
      return '#E0E0E0'; // Gray
  }
};

/**
 * Get Tailwind class for table status
 */
export const getTableStatusClass = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.EMPTY:
      return 'bg-white border-2 border-gray-300 hover:shadow-md';
    case TableStatus.OCCUPIED:
      return 'bg-green-400 text-white shadow-md';
    case TableStatus.DIRTY:
      return 'bg-red-400 text-white shadow-md';
    case TableStatus.RESERVED:
      return 'bg-orange-400 text-white shadow-md';
    default:
      return 'bg-gray-300';
  }
};

/**
 * Get Vietnamese label for status
 */
export const getTableStatusLabel = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.EMPTY:
      return 'Trống';
    case TableStatus.OCCUPIED:
      return 'Có khách';
    case TableStatus.DIRTY:
      return 'Chờ dọn';
    case TableStatus.RESERVED:
      return 'Đã đặt';
    default:
      return 'Không xác định';
  }
};

/**
 * Check if table can be used
 */
export const isTableAvailable = (status: TableStatus): boolean => {
  return status === TableStatus.EMPTY;
};

/**
 * Get tables grouped by status
 */
export const getTablesByStatus = (tables: Table[]): Record<TableStatus, Table[]> => {
  return {
    [TableStatus.EMPTY]: tables.filter(t => t.status === TableStatus.EMPTY),
    [TableStatus.OCCUPIED]: tables.filter(t => t.status === TableStatus.OCCUPIED),
    [TableStatus.DIRTY]: tables.filter(t => t.status === TableStatus.DIRTY),
    [TableStatus.RESERVED]: tables.filter(t => t.status === TableStatus.RESERVED),
  };
};

/**
 * Sort tables (empty first, then occupied, reserved, dirty)
 */
export const sortTables = (tables: Table[]): Table[] => {
  const order = {
    [TableStatus.EMPTY]: 0,
    [TableStatus.OCCUPIED]: 1,
    [TableStatus.RESERVED]: 2,
    [TableStatus.DIRTY]: 3,
  };

  return [...tables].sort((a, b) => {
    const orderDiff = order[a.status] - order[b.status];
    if (orderDiff !== 0) return orderDiff;

    // Sort by name if same status
    return a.name.localeCompare(b.name, 'vi');
  });
};

/**
 * Get ready count for a table (dishes ready to serve)
 */
export const getTableReadyCount = (
  table: Table,
  orders: Order[]
): number => {
  const order = orders.find(o => o.id === table.currentOrderId);
  if (!order) return 0;

  return order.items.filter(
    (item: OrderItem) => item.status === 'READY'
  ).reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);
};

/**
 * Check if table needs attention (bill requested)
 */
export const doesTableNeedAttention = (table: Table): boolean => {
  return table.billRequested === true;
};

/**
 * Get table info for display
 */
export const getTableInfo = (
  table: Table,
  orders: Order[]
): {
  name: string;
  status: string;
  guestCount?: number;
  readyCount: number;
  needsAttention: boolean;
} => {
  return {
    name: table.name,
    status: getTableStatusLabel(table.status),
    guestCount: table.guestCount,
    readyCount: getTableReadyCount(table, orders),
    needsAttention: doesTableNeedAttention(table),
  };
};
