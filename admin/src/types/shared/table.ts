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
}

