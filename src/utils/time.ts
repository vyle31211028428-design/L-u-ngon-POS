/**
 * Utility functions for time-related calculations
 * Burn effect timing, elapsed time formatting, etc.
 */

/**
 * Calculate elapsed time in minutes
 */
export const getElapsedMinutes = (startTime: number, endTime?: number): number => {
  const end = endTime || Date.now();
  return Math.floor((end - startTime) / 60000);
};

/**
 * Determine burn status based on elapsed time
 * Yellow: > 10 minutes
 * Red: > 15 minutes
 */
export type BurnStatus = 'normal' | 'yellow' | 'red';

export const getBurnStatus = (startTime: number, endTime?: number): BurnStatus => {
  const elapsedMinutes = getElapsedMinutes(startTime, endTime);

  if (elapsedMinutes > 15) return 'red';
  if (elapsedMinutes > 10) return 'yellow';
  return 'normal';
};

/**
 * Format time in MM:SS format
 */
export const formatElapsedTime = (startTime: number, endTime?: number): string => {
  const totalSeconds = Math.floor((endTime || Date.now() - startTime) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Format time in HH:MM format (for display on UI)
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

/**
 * Format date and time
 */
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

/**
 * Format relative time (e.g., "5 phút trước")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000); // seconds

  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;

  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Get time until (for reservations)
 */
export const getTimeUntil = (timestamp: number): string => {
  const now = Date.now();
  const diff = Math.floor((timestamp - now) / 1000); // seconds

  if (diff < 0) return 'Đã qua';
  if (diff < 60) return `${diff}s nữa`;
  if (diff < 3600) return `${Math.floor(diff / 60)}p nữa`;

  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};
