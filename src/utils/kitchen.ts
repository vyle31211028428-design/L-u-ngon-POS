/**
 * Utility functions for kitchen operations
 * Aggregation, grouping, filtering items for KDS
 */

import { Order, OrderItem, Table } from '../../types';
import { getElapsedMinutes } from './time';

export interface AggregatedItem {
  menuItemId: string;
  name: string;
  totalQuantity: number;
  items: Array<{ orderId: string; tableId: string; tableName: string; quantity: number; timestamp: number }>;
}

/**
 * Aggregate items by name across all tables
 * Used by kitchen to see total of each dish needed
 */
export const aggregateKitchenItems = (orders: Order[], tables: Table[]): AggregatedItem[] => {
  const aggregated: Record<string, AggregatedItem> = {};

  const tableMap = new Map(tables.map(t => [t.id, t]));

  orders.forEach((order: Order) => {
    if (order.isPaid) return; // Skip paid orders

    const table = tableMap.get(order.tableId);
    if (!table) return;

    order.items.forEach((item: OrderItem) => {
      if (!aggregated[item.menuItemId]) {
        aggregated[item.menuItemId] = {
          menuItemId: item.menuItemId,
          name: item.name,
          totalQuantity: 0,
          items: [],
        };
      }

      aggregated[item.menuItemId].items.push({
        orderId: order.id,
        tableId: order.tableId,
        tableName: table.name,
        quantity: item.quantity,
        timestamp: item.timestamp,
      });

      aggregated[item.menuItemId].totalQuantity += item.quantity;
    });
  });

  return Object.values(aggregated).sort((a, b) => b.totalQuantity - a.totalQuantity);
};

/**
 * Get items for kitchen display by status
 */
export const getItemsByStatus = (
  orders: Order[],
  tables: Table[],
  statuses: string[]
): OrderItem[] => {
  const tableMap = new Map(tables.map(t => [t.id, t]));
  const items: (OrderItem & { tableId: string; tableName: string; orderId: string })[] = [];

  orders.forEach((order: Order) => {
    if (order.isPaid) return;

    const table = tableMap.get(order.tableId);
    if (!table) return;

    order.items.forEach((item: OrderItem) => {
      if (statuses.includes(item.status)) {
        items.push({
          ...item,
          tableId: order.tableId,
          tableName: table.name,
          orderId: order.id,
        });
      }
    });
  });

  return items.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Calculate total ready items per table
 */
export const getReadyItemsByTable = (orders: Order[]): Record<string, number> => {
  const result: Record<string, number> = {};

  orders.forEach((order: Order) => {
    if (order.isPaid) return;

    const readyCount = order.items.filter(
      (item: OrderItem) => item.status === 'READY'
    ).reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);

    if (readyCount > 0) {
      result[order.tableId] = (result[order.tableId] || 0) + readyCount;
    }
  });

  return result;
};

/**
 * Check if order item is burned (old)
 * Returns: 'normal', 'yellow' (>10min), 'red' (>15min)
 */
export const getOrderItemBurnStatus = (
  item: OrderItem
): 'normal' | 'yellow' | 'red' => {
  // Use prepStartTime if available, otherwise use timestamp
  const startTime = item.prepStartTime || item.timestamp;
  const elapsedMinutes = getElapsedMinutes(startTime);

  if (elapsedMinutes > 15) return 'red';
  if (elapsedMinutes > 10) return 'yellow';
  return 'normal';
};

/**
 * Get pending item count (quick overview for kitchen)
 */
export const getPendingItemCount = (orders: Order[]): number => {
  return orders.reduce((sum, order) => {
    if (order.isPaid) return sum;
    return sum + order.items.filter((item: OrderItem) => item.status === 'PENDING').length;
  }, 0);
};
