/**
 * Utility functions for table sorting defaults
 * همه جدول‌ها پیش‌فرض بر اساس تاریخ (جدیدترین اول) هستند
 * اما می‌توان در هر اپ خاص آن را override کرد
 */

import { SortingState } from "@tanstack/react-table";

/**
 * Get default sorting state from URL or use default
 * @param defaultSortField - Field to sort by default (default: 'created_at')
 * @param defaultSortDesc - Whether to sort descending by default (default: true - newest first)
 * @returns SortingState
 */
export function getDefaultSortingState(
  defaultSortField: string = 'created_at',
  defaultSortDesc: boolean = true
): SortingState {
  if (typeof window === 'undefined') {
    return [{ id: defaultSortField, desc: defaultSortDesc }];
  }

  const urlParams = new URLSearchParams(window.location.search);
  const orderBy = urlParams.get('order_by');
  const orderDesc = urlParams.get('order_desc');

  if (orderBy && orderDesc !== null) {
    return [{
      id: orderBy,
      desc: orderDesc === 'true',
    }];
  }

  // Default: newest first (created_at descending)
  return [{ id: defaultSortField, desc: defaultSortDesc }];
}

/**
 * Initialize sorting state from URL or use default
 * This is a hook-like function that can be used in useState initializer
 * 
 * @example
 * // Default: created_at descending (newest first)
 * const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
 * 
 * @example
 * // Custom: name ascending
 * const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL('name', false));
 */
export function initSortingFromURL(
  defaultSortField: string = 'created_at',
  defaultSortDesc: boolean = true
): SortingState {
  return getDefaultSortingState(defaultSortField, defaultSortDesc);
}

