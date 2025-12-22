import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { useDataTableLogic } from '@/components/tables/logic/useDataTableLogic';
import type {
  BaseApiFilterParams,
  BaseClientFilterParams 
} from '@/types/shared/tableFilters';
import type {
  SearchConfig,
  FilterConfig,
  DeleteConfig,
  BaseTableData
} from '@/types/shared/table';

export interface TableConfig<TData extends BaseTableData, TApiFilters extends BaseApiFilterParams, TClientFilters extends BaseClientFilterParams> {
  fetchDataFn: (filters: TApiFilters) => Promise<unknown>;
  deleteItemFn?: (id: string | number) => Promise<unknown>;
  deleteMultipleItemsFn?: (ids: (string | number)[]) => Promise<unknown>;

  columns: ColumnDef<TData, unknown>[];
  filterConfig?: FilterConfig[];
  searchConfig?: SearchConfig;
  deleteConfig?: DeleteConfig;

  mapClientFiltersToApiFilters: (
    pagination: { pageIndex: number; pageSize: number },
    sorting: { id: string; desc: boolean }[],
    clientFilters: TClientFilters,
    search: string | undefined
  ) => TApiFilters;

  initialData: TData[];
  totalItems: number;
  initialFilters: BaseClientFilterParams & TClientFilters;

  idField?: keyof TData;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  updateUrlOnFilterChange?: boolean;
  searchDebounceMs?: number;
}

export interface UniversalTableTemplateProps<
  TData extends BaseTableData,
  TApiFilters extends BaseApiFilterParams,
  TClientFilters extends BaseClientFilterParams
> {
  config: TableConfig<TData, TApiFilters, TClientFilters>;
  className?: string;
}

export function UniversalTableTemplate<
  TData extends BaseTableData,
  TApiFilters extends BaseApiFilterParams,
  TClientFilters extends BaseClientFilterParams
>({
  config,
  className
}: UniversalTableTemplateProps<TData, TApiFilters, TClientFilters>) {
  
  const {
    data,
    totalItems: _totalItems,
    pageCount,
    isLoading,
    pagination,
    setPagination,
    sorting,
    setSorting,
    clientFilters,
    handleFilterChange,
    rowSelection,
    setRowSelection,
    columnVisibility: _columnVisibility,
    setColumnVisibility: _setColumnVisibility,
    refetchData: _refetchData,
    handleDeleteItem: _handleDeleteItem,
    handleDeleteSelected,
    hasSelectedItems: _hasSelectedItems,
    searchValue,
  } = useDataTableLogic({
    fetchDataFn: config.fetchDataFn,
    deleteItemFn: config.deleteItemFn,
    deleteMultipleItemsFn: config.deleteMultipleItemsFn,
    initialData: config.initialData,
    totalItems: config.totalItems,
    initialFilters: config.initialFilters,
    idField: config.idField,
    defaultPageSize: config.defaultPageSize,
    pageSizeOptions: config.pageSizeOptions,
    updateUrlOnFilterChange: config.updateUrlOnFilterChange,
    searchDebounceMs: config.searchDebounceMs,
    mapClientFiltersToApiFilters: config.mapClientFiltersToApiFilters,
  });

  return (
    <div className={className}>
      <DataTable
        columns={config.columns}
        data={data}
        pageCount={pageCount}
        isLoading={isLoading}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        onRowSelectionChange={setRowSelection}
        clientFilters={clientFilters}
        onFilterChange={handleFilterChange}
        state={{
          pagination,
          sorting,
          rowSelection,
          columnVisibility: _columnVisibility,
        }}
        searchConfig={config.searchConfig}
        filterConfig={config.filterConfig}
        deleteConfig={{
          onDeleteSelected: handleDeleteSelected,
          buttonText: config.deleteConfig?.buttonText,
        }}
        pageSizeOptions={config.pageSizeOptions}
        searchValue={searchValue}
      />
    </div>
  );
} 