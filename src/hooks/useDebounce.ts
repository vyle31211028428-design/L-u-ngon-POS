/**
 * Custom hook for debouncing and throttling
 */

import { useRef, useCallback, useEffect } from 'react';

export const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
};

export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  limit: number
): T => {
  const inThrottleRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: any[]) => {
      if (!inThrottleRef.current) {
        callback(...args);
        inThrottleRef.current = true;

        timeoutRef.current = setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [callback, limit]
  ) as T;
};
