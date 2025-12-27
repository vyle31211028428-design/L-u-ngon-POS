/**
 * Utility functions for combo validation
 * Validates combo group selections against min/max requirements
 */

import { ComboGroup } from '../../types';

/**
 * Validate if a single group meets min/max requirements
 */
export const isGroupValid = (
  group: ComboGroup,
  selectedCount: number
): boolean => {
  return selectedCount >= group.min && selectedCount <= group.max;
};

/**
 * Validate entire combo (all groups)
 */
export const isComboValid = (
  groups: ComboGroup[] | undefined,
  selections: Record<string, string[]>
): boolean => {
  if (!groups || groups.length === 0) return false;

  return groups.every(group => {
    const selectedCount = (selections[group.id] || []).length;
    return isGroupValid(group, selectedCount);
  });
};

/**
 * Get validation message for a group
 */
export const getGroupValidationMessage = (
  group: ComboGroup,
  selectedCount: number
): string | null => {
  if (selectedCount < group.min) {
    return `Chọn thêm ${group.min - selectedCount} ${group.min === 1 ? 'mục' : 'mục'}`;
  }
  if (selectedCount > group.max) {
    return `Chỉ được chọn tối đa ${group.max} ${group.max === 1 ? 'mục' : 'mục'}`;
  }
  return null;
};

/**
 * Get validation messages for entire combo
 */
export const getComboValidationMessages = (
  groups: ComboGroup[] | undefined,
  selections: Record<string, string[]>
): Record<string, string> => {
  const messages: Record<string, string> = {};

  if (!groups) return messages;

  groups.forEach(group => {
    const selectedCount = (selections[group.id] || []).length;
    const message = getGroupValidationMessage(group, selectedCount);
    if (message) {
      messages[group.id] = message;
    }
  });

  return messages;
};

/**
 * Calculate extra price for combo variant
 * Some options may have additional charges
 */
export const calculateComboVariantPrice = (
  basePrice: number,
  selectedOptions: string[],
  allOptions: Record<string, { name: string; price?: number }>
): number => {
  let totalPrice = basePrice;

  selectedOptions.forEach(optionName => {
    const option = Object.values(allOptions).find(opt => opt.name === optionName);
    if (option?.price) {
      totalPrice += option.price;
    }
  });

  return totalPrice;
};

/**
 * Format combo selection for display
 * Combines group selections into readable string
 */
export const formatComboSelection = (
  groups: ComboGroup[] | undefined,
  selections: Record<string, string[]>
): string[] => {
  if (!groups) return [];

  return groups.map(group => {
    const selected = selections[group.id] || [];
    const label = selected.length === 1
      ? selected[0]
      : selected.length > 1
      ? `${selected.length} món`
      : 'Chưa chọn';
    return `${group.title}: ${label}`;
  });
};

/**
 * Flatten all selected options into a single array (for OrderItem.selectedOptions)
 */
export const flattenComboSelections = (
  selections: Record<string, string[]>
): string[] => {
  return Object.values(selections).flat();
};
