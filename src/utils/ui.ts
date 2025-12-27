/**
 * Utility functions for UI/UX helpers
 * Formatting, validation, string manipulation
 */

/**
 * Truncate long text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert enum name to readable label
 * e.g., "PENDING" -> "Chờ xử lý"
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    // Order Item Status
    PENDING: 'Chờ xử lý',
    PREPARING: 'Đang nấu',
    READY: 'Xong',
    SERVED: 'Đã lên bàn',
    CANCELLED: 'Đã hủy',

    // Table Status
    EMPTY: 'Trống',
    OCCUPIED: 'Có khách',
    DIRTY: 'Chờ dọn',
    RESERVED: 'Đã đặt',

    // Reservation Status
    ARRIVED: 'Đã tới',
  };

  return labels[status] || capitalize(status);
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Vietnamese phone: remove non-digits, format as +84 xxx xxx xxxx
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+84 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+84 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }

  return phone;
};

/**
 * Validate phone number (Vietnamese)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('0'));
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate unique ID
 */
export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
