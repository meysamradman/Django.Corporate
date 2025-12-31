import type { ReactNode, SetStateAction } from 'react';
import type {
  PaginationState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import type { BaseApiFilterParams, BaseClientFilterParams } from './tableFilters';

export interface SearchConfig {
  placeholder: string;
  columnId: string;
}

export interface FilterOption {
  label: string;
  value: string | boolean;
}

export interface FilterConfig {
  columnId: string;
  title: string;
  options?: FilterOption[];
  placeholder?: string;
  type?: 'select' | 'hierarchical' | 'date' | 'date_range';
}

export interface DeleteConfig {
  onDeleteSelected: (selectedIds: (string | number)[]) => void;
  buttonText?: string;
  permission?: string;
  denyMessage?: string;
}

export interface ExportConfig<TClientFilters extends Record<string, unknown> = Record<string, unknown>> {
  onExport: (filters: TClientFilters, search: string) => Promise<void>;
  buttonText?: string;
  value?: string;
  variant?: 'default' | 'outline' | 'destructive' | 'link';
}

export interface BaseTableData {
  id: string | number;
}

export interface CategoryItem {
  id: string | number;
  label: string;
  value: string;
  parent_id?: string | number | null;
  children?: CategoryItem[];
}

export interface DataTableRowAction<TData> {
  label: string | ((item: TData) => string);
  icon?: ReactNode;
  onClick: (item: TData) => void;
  condition?: (item: TData) => boolean;
  isDestructive?: boolean;
  permission?: string | string[];
  requireAllPermissions?: boolean;
  isDisabled?: (item: TData) => boolean;
}

export type FetchDataFn<_TData, TApiFilters extends BaseApiFilterParams> = (
  filters: TApiFilters,
  options?: { 
    cookieHeader?: string;
  }
) => Promise<unknown>;

export type DeleteItemFn = (id: string | number) => Promise<unknown>;
export type DeleteMultipleItemsFn = (ids: (string | number)[]) => Promise<unknown>;

export interface UseDataTableLogicOptions<
  TData,
  TApiFilters extends BaseApiFilterParams,
  TClientFilters extends BaseClientFilterParams,
> {
  fetchDataFn: FetchDataFn<TData, TApiFilters>;
  deleteItemFn?: DeleteItemFn;
  deleteMultipleItemsFn?: DeleteMultipleItemsFn;
  initialData: TData[];
  totalItems: number;
  initialFilters: BaseClientFilterParams & TClientFilters;
  idField?: keyof TData;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  updateUrlOnFilterChange?: boolean;
  searchDebounceMs?: number;
  
  mapClientFiltersToApiFilters: (
    pagination: PaginationState,
    sorting: SortingState,
    clientFilters: TClientFilters,
    search: string | undefined
  ) => TApiFilters;
}

export interface UseDataTableLogicResult<TData, TClientFilters> {
  data: TData[];
  totalItems: number;
  pageCount: number;
  isLoading: boolean;
  pagination: PaginationState;
  setPagination: (value: SetStateAction<PaginationState>) => void;
  sorting: SortingState;
  setSorting: (value: SetStateAction<SortingState>) => void;
  clientFilters: TClientFilters;
  handleFilterChange: (filterId: keyof TClientFilters | 'search', value: unknown) => void;
  rowSelection: RowSelectionState;
  setRowSelection: (value: SetStateAction<RowSelectionState>) => void;
  columnVisibility: VisibilityState;
  setColumnVisibility: (value: SetStateAction<VisibilityState>) => void;
  refetchData: () => Promise<void>;
  handleDeleteItem: (id: number | string) => Promise<void>;
  handleDeleteSelected: (idsToUse?: (string | number)[]) => Promise<void>;
  hasSelectedItems: boolean;
  searchValue: string;
}

