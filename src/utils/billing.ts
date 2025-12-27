/**
 * Utility functions for billing calculations
 * Handles VAT, discounts, and final amount calculations
 */

import { Order, OrderItem, Discount, OrderItemStatus } from '../../types';

const VAT_RATE = parseFloat(import.meta.env.VITE_VAT_RATE || '0.08');

/**
 * Calculate subtotal (excluding VAT)
 * Automatically excludes CANCELLED items
 */
export const calculateSubtotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => {
    if (item.status === OrderItemStatus.CANCELLED) return sum;
    return sum + item.price * item.quantity;
  }, 0);
};

/**
 * Calculate VAT amount
 */
export const calculateVAT = (subtotal: number, rate: number = VAT_RATE): number => {
  return Math.round(subtotal * rate * 100) / 100;
};

/**
 * Apply discount to amount
 */
export const applyDiscount = (amount: number, discount?: Discount): number => {
  if (!discount) return amount;
  
  if (discount.type === 'PERCENT') {
    return Math.round(amount * (1 - discount.value / 100) * 100) / 100;
  } else {
    return Math.max(0, Math.round((amount - discount.value) * 100) / 100);
  }
};

/**
 * Calculate complete order total
 * Subtotal -> Apply Discount -> Add VAT -> Grand Total
 */
export const calculateOrderTotal = (
  items: OrderItem[],
  discount?: Discount,
  includeVAT: boolean = true
): {
  subtotal: number;
  discount: number;
  afterDiscount: number;
  vat: number;
  grandTotal: number;
} => {
  const subtotal = calculateSubtotal(items);
  const afterDiscount = applyDiscount(subtotal, discount);
  const discountAmount = subtotal - afterDiscount;
  const vat = includeVAT ? calculateVAT(afterDiscount) : 0;
  const grandTotal = afterDiscount + vat;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    afterDiscount: Math.round(afterDiscount * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
};

/**
 * Format currency (Vietnamese Dong)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format currency without symbol (just number with thousand separator)
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
