import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook برای debounce کردن فانکشن‌ها
 * @param callback - تابعی که باید debounce بشه
 * @param delay - تاخیر به میلی‌ثانیه (پیش‌فرض: 500ms)
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}
