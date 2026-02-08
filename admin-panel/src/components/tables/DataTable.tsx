import { useState } from "react"
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  OnChangeFn,
} from "@tanstack/react-table"
import type { ReactNode } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { TablePaginationState } from '@/types/shared/pagination';
import { cn } from "@/core/utils/cn";

import { ProtectedButton } from "@/core/permissions/components/ProtectedButton";
import { Input } from "@/components/elements/Input"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/elements/Card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/elements/Table"

import { DataTableHierarchicalFilter } from "./DataTableHierarchicalFilter"
import type { CategoryItem } from "@/types/shared/table";
import { DataTableDateFilter } from "./DataTableDateFilter"
import { DataTableDateRangeFilter } from "./DataTableDateRangeFilter"
import { DataTableDateRangeFilterDropdown } from "./DataTableDateRangeFilterDropdown"
import { DataTableFacetedFilterSimple } from "./DataTableFacetedFilterSimple"
import type { DateRangeOption } from "@/types/shared/table"
import { Trash, Search, Download, Printer, FileSpreadsheet, FileText, ChevronDown, ListFilter, X, SlidersHorizontal, Save } from "lucide-react"
import { Loader } from "@/components/elements/Loader"
import { PaginationControls } from "@/components/shared/Pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu"
import { Badge } from "@/components/elements/Badge"
import { Button } from "@/components/elements/Button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/elements/Drawer"
import type {
  SearchConfig,
  FilterConfig,
  DeleteConfig,
  ExportConfig
} from "@/types/shared/table";

interface DataTableProps<TData extends { id: number | string }, TValue, TClientFilters extends Record<string, unknown> = Record<string, unknown>> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  isLoading?: boolean;
  onPaginationChange?: OnChangeFn<TablePaginationState>;
  onSortingChange?: OnChangeFn<SortingState>;
  onRowSelectionChange?: OnChangeFn<Record<string, boolean>>;
  clientFilters: TClientFilters;
  onFilterChange: (filterId: keyof TClientFilters | 'search', value: unknown) => void;
  state?: {
    pagination?: TablePaginationState;
    sorting?: SortingState;
    rowSelection?: Record<string, boolean>;
    columnVisibility?: VisibilityState;
  };
  searchConfig?: SearchConfig;
  filterConfig?: FilterConfig[];
  filterVariant?: 'inline' | 'sidebar';
  deleteConfig?: DeleteConfig;
  exportConfig?: ExportConfig<TClientFilters>;
  exportConfigs?: ExportConfig<TClientFilters>[];
  onPrint?: () => void;
  pageSizeOptions?: number[];
  searchValue?: string;
  customHeaderActions?: ReactNode;
}

/**
 * Reusable filter renderer to maintain consistency between inline and sidebar layouts
 */
function DataTableFilters<TClientFilters extends Record<string, unknown>>({
  filterConfig,
  clientFilters,
  onFilterChange,
  layout = 'inline',
  table
}: {
  filterConfig: FilterConfig[];
  clientFilters: TClientFilters;
  onFilterChange: (filterId: string, value: unknown) => void;
  layout?: 'inline' | 'sidebar';
  table: any;
}) {
  return (
    <>
      {filterConfig.map((filter) => {
        const isNonColumnFilter = ['category', 'property_type', 'date_from', 'date_to', 'date_range', 'date_range_dropdown'].includes(filter.columnId);
        const column = isNonColumnFilter ? null : table.getColumn(filter.columnId);

        if (!column && !isNonColumnFilter) return null;

        const filterElement = (
          <div key={filter.columnId} className={cn(layout === 'sidebar' && "flex flex-col gap-3")}>
            {layout === 'sidebar' && (
              <label className="text-[11px] font-black text-font-s uppercase tracking-wider flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-blue-1/40" />
                {filter.title}
              </label>
            )}
            <div className="w-full">
              {filter.type === 'hierarchical' && (
                <DataTableHierarchicalFilter
                  title={filter.title}
                  items={filter.options as unknown as CategoryItem[]}
                  placeholder={filter.placeholder || filter.title || "انتخاب کنید..."}
                  value={clientFilters[filter.columnId as keyof TClientFilters] as string | number | undefined}
                  onChange={(value) => onFilterChange(filter.columnId, value)}
                  multiSelect={filter.multiSelect}
                />
              )}

              {filter.type === 'date_range' && (
                <DataTableDateRangeFilter
                  title={filter.title}
                  value={(clientFilters[filter.columnId as keyof TClientFilters] as { from?: string; to?: string }) || (clientFilters['date_from' as keyof TClientFilters] || clientFilters['date_to' as keyof TClientFilters] ? { from: clientFilters['date_from' as keyof TClientFilters] as string, to: clientFilters['date_to' as keyof TClientFilters] as string } : { from: undefined, to: undefined })}
                  onChange={(range) => {
                    onFilterChange(filter.columnId, range);
                    onFilterChange('date_from', range.from);
                    onFilterChange('date_to', range.to);
                  }}
                  placeholder={filter.placeholder || filter.title || "انتخاب بازه تاریخ"}
                />
              )}

              {filter.type === 'date_range_dropdown' && (
                <DataTableDateRangeFilterDropdown
                  title={filter.title}
                  options={(filter.options || []) as DateRangeOption[]}
                  value={(clientFilters[filter.columnId as keyof TClientFilters] as { from?: string; to?: string }) || (clientFilters['date_from' as keyof TClientFilters] || clientFilters['date_to' as keyof TClientFilters] ? { from: clientFilters['date_from' as keyof TClientFilters] as string, to: clientFilters['date_to' as keyof TClientFilters] as string } : { from: undefined, to: undefined })}
                  onChange={(range) => {
                    onFilterChange(filter.columnId, range);
                    onFilterChange('date_from', range.from);
                    onFilterChange('date_to', range.to);
                  }}
                  placeholder={filter.placeholder || filter.title || "بازه تاریخ"}
                />
              )}

              {filter.type === 'date' && (
                <DataTableDateFilter
                  title={filter.title}
                  value={clientFilters[filter.columnId as keyof TClientFilters] as string || undefined}
                  onChange={(value) => onFilterChange(filter.columnId, value)}
                  placeholder={filter.placeholder || filter.title || "تاریخ"}
                />
              )}

              {(filter.type === 'faceted' || !filter.type) && (
                <DataTableFacetedFilterSimple
                  title={filter.title}
                  options={(filter.options || []) as Array<{ label: string; value: string | boolean; icon?: React.ComponentType<{ className?: string }>; count?: number }>}
                  value={clientFilters[filter.columnId as keyof TClientFilters] as string | boolean | (string | boolean)[] | undefined}
                  onChange={(value) => onFilterChange(filter.columnId, value)}
                  multiSelect={filter.multiSelect !== false}
                  showSearch={filter.showSearch !== false && (filter.options || []).length > 5}
                />
              )}
            </div>
          </div>
        );

        return filterElement;
      })}
    </>
  )
}

export function DataTable<TData extends { id: number | string }, TValue, TClientFilters extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  pageCount,
  isLoading = false,
  onPaginationChange,
  onSortingChange,
  onRowSelectionChange,
  clientFilters,
  onFilterChange,
  state: controlledState = {},
  searchConfig: _providedSearchConfig,
  filterConfig = [],
  filterVariant = 'inline',
  deleteConfig,
  exportConfig,
  exportConfigs,
  onPrint,
  pageSizeOptions: _pageSizeOptions = [10, 20, 30, 50],
  searchValue,
  customHeaderActions,
}: DataTableProps<TData, TValue, TClientFilters>) {

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(controlledState.columnVisibility ?? {});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: controlledState.sorting,
      columnVisibility: columnVisibility,
      rowSelection: controlledState.rowSelection ?? {},
      pagination: controlledState.pagination,
    },
    pageCount: pageCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: true,
    onRowSelectionChange: onRowSelectionChange,
    onSortingChange: onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRowCount = Object.keys(controlledState.rowSelection ?? {}).length;

  const handleDeleteSelectedClick = () => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);

    if (deleteConfig && selectedRowCount > 0) {
      deleteConfig.onDeleteSelected(selectedIds);
    }
  };

  const handleExportClick = async (config: ExportConfig<TClientFilters>) => {
    await config.onExport(clientFilters, searchValue || "");
  };

  const handleExportSelect = async (value: string) => {
    if (value === 'print' && onPrint) {
      onPrint();
      return;
    }

    const activeExportConfigs = exportConfigs || (exportConfig ? [exportConfig] : []);
    const config = activeExportConfigs.find(c => c.value === value);
    if (config) {
      await handleExportClick(config);
    }
  };

  const activeExportConfigs = exportConfigs || (exportConfig ? [exportConfig] : []);

  const activeFilterCount = Object.keys(clientFilters).filter(k =>
    clientFilters[k] !== undefined &&
    clientFilters[k] !== "" &&
    clientFilters[k] !== null &&
    k !== 'search'
  ).length;

  return (
    <Card
      className="gap-0 shadow-sm border hover:shadow-lg transition-all duration-300"
      data-table="portfolio-table"
    >
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:max-w-[320px]">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-font-s pointer-events-none" />
              <Input
                placeholder="جستجو..."
                value={searchValue ?? ""}
                onChange={(event) => {
                  onFilterChange("search", event.target.value);
                }}
                className="pr-8"
              />
            </div>
            {(activeExportConfigs.length > 0 || onPrint) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    خروجی
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  {activeExportConfigs.map((config, index) => {
                    const getIcon = () => {
                      const val = config.value?.toLowerCase() || "";
                      if (val.includes('excel')) {
                        return <FileSpreadsheet className="h-4 w-4" />;
                      }
                      if (val.includes('pdf')) {
                        return <FileText className="h-4 w-4" />;
                      }
                      if (val.includes('print')) {
                        return <Printer className="h-4 w-4" />;
                      }
                      return <Download className="h-4 w-4" />;
                    };
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleExportSelect(config.value || `export-${index}`)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {getIcon()}
                          <span>{config.buttonText || "خروجی"}</span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  {onPrint && (
                    <DropdownMenuItem
                      onClick={() => handleExportSelect('print')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Printer className="h-4 w-4" />
                        <span>خروجی پرینت</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {selectedRowCount > 0 && deleteConfig && (
              <ProtectedButton
                permission={deleteConfig.permission || "delete"}
                variant="destructive"
                onClick={handleDeleteSelectedClick}
                denyMessage={deleteConfig.denyMessage || "اجازه حذف ندارید"}
              >
                <Trash className="" />
                {deleteConfig.buttonText || "حذف"}
              </ProtectedButton>
            )}
          </div>

          <div className="flex flex-col flex-wrap gap-2 md:flex-row md:items-center md:gap-2">
            {customHeaderActions}

            {/* Standard Filters (Inline) */}
            {(filterVariant === 'inline' ? filterConfig : filterConfig.filter(f => !f.isAdvanced)).length > 0 && (
              <DataTableFilters
                filterConfig={filterVariant === 'inline' ? filterConfig : filterConfig.filter(f => !f.isAdvanced)}
                clientFilters={clientFilters}
                onFilterChange={onFilterChange as any}
                layout="inline"
                table={table}
              />
            )}

            {/* Advanced Filters (Sidebar) */}
            {filterVariant === 'sidebar' && filterConfig.filter(f => f.isAdvanced).length > 0 && (
              <Drawer direction="left">
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-blue-1/20 bg-blue-1/5 text-blue-1 hover:bg-blue-1/10 hover:border-blue-1/30 transition-all font-bold"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    فیلترهای پیشرفته
                    {activeFilterCount > 0 && (
                      <Badge variant="blue" className="h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="fixed inset-y-5! left-5! z-50 flex w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl focus:outline-none text-right rtl">
                  <DrawerHeader className="flex-none border-b border-muted/5">
                    <div className="flex items-center justify-between w-full">
                      <DrawerTitle className="text-base font-bold text-font-p tracking-tight leading-none flex items-center gap-2">
                        <ListFilter className="size-4 text-blue-1" />
                        فیلترهای پیشرفته
                      </DrawerTitle>
                      <DrawerClose asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-font-s rounded-full border-muted/20 hover:bg-bg shadow-sm transition-all"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </DrawerClose>
                    </div>
                  </DrawerHeader>

                  <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col gap-8">
                    <DataTableFilters
                      filterConfig={filterConfig.filter(f => f.isAdvanced)}
                      clientFilters={clientFilters}
                      onFilterChange={onFilterChange as any}
                      layout="sidebar"
                      table={table}
                    />
                  </div>

                  <div className="border-t border-muted/10 px-6 py-3 flex flex-row gap-3 flex-none bg-bg/50 backdrop-blur-md">
                    <DrawerClose asChild>
                      <Button
                        className="flex-2 bg-blue-1 text-static-w hover:bg-blue-1/90 shadow-md transition-all h-10 text-xs font-bold rounded-xl"
                      >
                        <Save className="h-3.5 w-3.5 me-2" />
                        مشاهده نتایج
                      </Button>
                    </DrawerClose>
                    <Button
                      variant="outline"
                      className="flex-1 border-muted/60 hover:bg-bg transition-colors h-10 text-[10px] font-bold rounded-xl text-red-1 hover:text-red-1"
                      onClick={() => {
                        filterConfig.filter(f => f.isAdvanced).forEach(f => onFilterChange(f.columnId as any, undefined));
                      }}
                    >
                      پاکسازی فیلترها
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>

        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="w-full">
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          width: (header.column.id === 'order' || header.column.id === 'actions') && header.column.columnDef.size
                            ? `${header.column.columnDef.size}px`
                            : header.column.columnDef.size === 60
                              ? '60px'
                              : (header.column.id === 'is_active' && header.column.columnDef.size ? `${header.column.columnDef.size}px` : undefined),
                          minWidth: (header.column.id === 'order' || header.column.id === 'actions') && header.column.columnDef.minSize
                            ? `${header.column.columnDef.minSize}px`
                            : header.column.columnDef.size === 60
                              ? '60px'
                              : (header.column.id === 'is_active' && header.column.columnDef.size ? `${header.column.columnDef.size}px` : (header.column.columnDef.minSize || header.getSize())),
                          maxWidth: (header.column.id === 'order' || header.column.id === 'actions') && header.column.columnDef.maxSize
                            ? `${header.column.columnDef.maxSize}px`
                            : header.column.columnDef.maxSize === 60
                              ? '60px'
                              : undefined,
                          ...(header.column.id === 'select' && {
                            paddingLeft: '0.5rem',
                            paddingRight: '0.5rem'
                          })
                        }}
                        className={header.column.id === 'select' || header.column.id === 'order' || header.column.id === 'actions' ? 'text-center' : 'text-right'}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: (cell.column.id === 'order' || cell.column.id === 'actions') && cell.column.columnDef.size
                            ? `${cell.column.columnDef.size}px`
                            : cell.column.columnDef.size === 60
                              ? '60px'
                              : (cell.column.id === 'is_active' && cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : undefined),
                          minWidth: (cell.column.id === 'order' || cell.column.id === 'actions') && cell.column.columnDef.minSize
                            ? `${cell.column.columnDef.minSize}px`
                            : cell.column.columnDef.size === 60
                              ? '60px'
                              : (cell.column.id === 'is_active' && cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : (cell.column.columnDef.minSize || cell.column.getSize())),
                          maxWidth: (cell.column.id === 'order' || cell.column.id === 'actions') && cell.column.columnDef.maxSize
                            ? `${cell.column.columnDef.maxSize}px`
                            : cell.column.columnDef.maxSize === 60
                              ? '60px'
                              : undefined,
                          ...(cell.column.id === 'select' && {
                            paddingLeft: '0.5rem',
                            paddingRight: '0.5rem'
                          }),
                          ...(cell.column.id === 'actions' && {
                            paddingLeft: '1.3rem',
                            paddingRight: '0.9rem'
                          })
                        }}
                        className={cn(
                          cell.column.id === 'select' || cell.column.id === 'order' || cell.column.id === 'actions' ? 'text-center' : undefined,
                          (cell.column.id === 'question' || cell.column.id === 'answer') && 'whitespace-normal'
                        )}
                        {...(cell.column.id === 'actions' && {
                          'data-actions': 'true'
                        })}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center p-0"
                  >
                    {isLoading ? (
                      <Loader />
                    ) : (
                      <div className="py-8 text-font-s">
                        داده‌ای یافت نشد
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <PaginationControls
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={pageCount}
          onPageChange={(page: number) => {
            const newPageIndex = page - 1;
            const newPagination = {
              pageIndex: newPageIndex,
              pageSize: table.getState().pagination.pageSize,
            };
            table.setPageIndex(newPageIndex);
            if (onPaginationChange) {
              onPaginationChange(newPagination);
            }
          }}
          pageSize={table.getState().pagination.pageSize}
          onPageSizeChange={(size: number) => {
            const newPagination = {
              pageIndex: 0,
              pageSize: size,
            };
            table.setPageSize(size);
            table.setPageIndex(0);
            if (onPaginationChange) {
              onPaginationChange(newPagination);
            }
          }}
          pageSizeOptions={[10, 20, 30, 40, 50]}
          showPageSize={true}
          showInfo={true}
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          totalCount={table.getFilteredRowModel().rows.length}
          infoText={`${((table.getState().pagination.pageIndex) * table.getState().pagination.pageSize) + 1} - ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} از ${table.getFilteredRowModel().rows.length}`}
          showFirstLast={true}
          showPageNumbers={true}
          siblingCount={1}
        />
      </CardFooter>
    </Card>
  )
}

export default DataTable