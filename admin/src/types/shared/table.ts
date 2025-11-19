import React from 'react';

// Table Component Types
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
  type?: 'select' | 'hierarchical' | 'date';
}

export interface DeleteConfig {
  onDeleteSelected: (selectedIds: (string | number)[]) => void;
  buttonText?: string;
  /**
   * Permission required for bulk delete (e.g., "blog.delete", "user.delete")
   * If not provided, defaults to "delete"
   */
  permission?: string;
  /**
   * Custom deny message when user doesn't have permission
   * Defaults to "اجازه حذف ندارید"
   */
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
  icon?: React.ReactNode;
  onClick: (item: TData) => void;
  condition?: (item: TData) => boolean;
  isDestructive?: boolean;
  /**
   * Permission required for this action (e.g., "blog.update", "user.delete")
   * If user doesn't have permission, the action will be disabled (silently, no toast)
   * For main buttons (Create, Delete All), use ProtectedButton with showDenyToast
   */
  permission?: string | string[];
  /**
   * If true, user must have ALL permissions (AND logic)
   * If false, user needs ANY permission (OR logic) - default
   */
  requireAllPermissions?: boolean;
  /**
   * Custom disabled logic based on the item data
   * Return true to disable the action for this specific item
   */
  isDisabled?: (item: TData) => boolean;
}

