import type { SortingState } from "@tanstack/react-table";

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

  return [{ id: defaultSortField, desc: defaultSortDesc }];
}

export function initSortingFromURL(
  defaultSortField: string = 'created_at',
  defaultSortDesc: boolean = true
): SortingState {
  return getDefaultSortingState(defaultSortField, defaultSortDesc);
}

