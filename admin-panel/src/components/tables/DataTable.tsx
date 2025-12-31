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

import { ProtectedButton } from "@/components/admins/permissions/components/ProtectedButton";
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
import { Trash, Search, Download, Printer, FileSpreadsheet, FileText } from "lucide-react"
import { Loader } from "@/components/elements/Loader"
import { PaginationControls } from "@/components/shared/Pagination"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/elements/Select"
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
  deleteConfig?: DeleteConfig;
  exportConfig?: ExportConfig<TClientFilters>;
  exportConfigs?: ExportConfig<TClientFilters>[];
  onPrint?: () => void;
  pageSizeOptions?: number[];
  searchValue?: string;
  customHeaderActions?: ReactNode;
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
                 className="pr-8 h-8 text-sm"
               />
             </div>
             {(activeExportConfigs.length > 0 || onPrint) && (
               <Select onValueChange={handleExportSelect}>
                 <SelectTrigger className="w-[140px]">
                   <span>خروجی</span>
                 </SelectTrigger>
                 <SelectContent>
                   {activeExportConfigs.map((config, index) => {
                     const getIcon = () => {
                       if (config.value === 'excel') {
                         return <FileSpreadsheet className="h-4 w-4" />;
                       }
                       if (config.value === 'pdf') {
                         return <FileText className="h-4 w-4" />;
                       }
                       return <Download className="h-4 w-4" />;
                     };
                     return (
                       <SelectItem key={index} value={config.value || `export-${index}`}>
                         <div className="flex items-center gap-2">
                           {getIcon()}
                           <span>{config.buttonText || "خروجی"}</span>
                         </div>
                       </SelectItem>
                     );
                   })}
                   {onPrint && (
                     <SelectItem value="print">
                       <div className="flex items-center gap-2">
                         <Printer className="h-4 w-4" />
                         <span>پرینت</span>
                       </div>
                     </SelectItem>
                   )}
                 </SelectContent>
               </Select>
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
              {filterConfig.map((filter) => {
               const column = table.getColumn(filter.columnId);
               
               // Allow rendering for non-column filters like date_from, date_to, date_range, date_range_dropdown, categories, property_type
               const isNonColumnFilter = ['categories', 'property_type', 'date_from', 'date_to', 'date_range', 'date_range_dropdown'].includes(filter.columnId);
               if (!column && !isNonColumnFilter) return null;
               
               if (filter.type === 'hierarchical') {
                 return (
                   <DataTableHierarchicalFilter
                     key={filter.columnId}
                     title={filter.title}
                     items={filter.options as unknown as CategoryItem[]}
                     placeholder={filter.placeholder || filter.title || "انتخاب کنید..."}
                     value={clientFilters[filter.columnId as keyof TClientFilters] as string | number | undefined}
                     onChange={(value) => onFilterChange(filter.columnId, value)}
                   />
                 );
               }
               
               if (filter.type === 'date_range') {
                 // Get range from filters, or construct from date_from/date_to
                 const rangeValue = clientFilters[filter.columnId as keyof TClientFilters] as { from?: string; to?: string } | undefined;
                 const dateFrom = clientFilters['date_from' as keyof TClientFilters] as string | undefined;
                 const dateTo = clientFilters['date_to' as keyof TClientFilters] as string | undefined;
                 
                 const currentRange = rangeValue || (dateFrom || dateTo ? { from: dateFrom, to: dateTo } : { from: undefined, to: undefined });
                 
                 return (
                   <DataTableDateRangeFilter
                     key={filter.columnId}
                     title={filter.title}
                     value={currentRange}
                     onChange={(range) => {
                       // Store the range object for UI
                       onFilterChange(filter.columnId, range);
                       // Also set date_from and date_to for backend compatibility
                       onFilterChange('date_from', range.from);
                       onFilterChange('date_to', range.to);
                     }}
                     placeholder={filter.placeholder || filter.title || "انتخاب بازه تاریخ"}
                   />
                 );
               }
               
               if (filter.type === 'date_range_dropdown') {
                 // Get range from filters, or construct from date_from/date_to
                 const rangeValue = clientFilters[filter.columnId as keyof TClientFilters] as { from?: string; to?: string } | undefined;
                 const dateFrom = clientFilters['date_from' as keyof TClientFilters] as string | undefined;
                 const dateTo = clientFilters['date_to' as keyof TClientFilters] as string | undefined;
                 
                 const currentRange = rangeValue || (dateFrom || dateTo ? { from: dateFrom, to: dateTo } : { from: undefined, to: undefined });
                 
                 return (
                   <DataTableDateRangeFilterDropdown
                     key={filter.columnId}
                     title={filter.title}
                     options={(filter.options || []) as DateRangeOption[]}
                     value={currentRange}
                     onChange={(range) => {
                       // Store the range object for UI
                       onFilterChange(filter.columnId, range);
                       // Also set date_from and date_to for backend compatibility
                       onFilterChange('date_from', range.from);
                       onFilterChange('date_to', range.to);
                     }}
                     placeholder={filter.placeholder || filter.title || "بازه تاریخ"}
                   />
                 );
               }
               
               if (filter.type === 'date') {
                 return (
                   <DataTableDateFilter
                     key={filter.columnId}
                     title={filter.title}
                     value={clientFilters[filter.columnId as keyof TClientFilters] as string || undefined}
                     onChange={(value) => onFilterChange(filter.columnId, value)}
                     placeholder={filter.placeholder || filter.title || "تاریخ"}
                   />
                 );
               }
               
               if (filter.type === 'faceted') {
                 return (
                   <DataTableFacetedFilterSimple
                     key={filter.columnId}
                     title={filter.title}
                     options={(filter.options || []) as Array<{ label: string; value: string | boolean; icon?: React.ComponentType<{ className?: string }>; count?: number }>}
                     value={clientFilters[filter.columnId as keyof TClientFilters] as string | boolean | (string | boolean)[] | undefined}
                     onChange={(value) => onFilterChange(filter.columnId, value)}
                     multiSelect={false}
                     showSearch={filter.showSearch !== false}
                   />
                 );
               }
               
               // Default to faceted filter for backward compatibility
               return (
                 <DataTableFacetedFilterSimple
                   key={filter.columnId}
                   title={filter.title}
                   options={(filter.options || []) as Array<{ label: string; value: string | boolean; icon?: React.ComponentType<{ className?: string }>; count?: number }>}
                   value={clientFilters[filter.columnId as keyof TClientFilters] as string | boolean | (string | boolean)[] | undefined}
                   onChange={(value) => onFilterChange(filter.columnId, value)}
                   multiSelect={false}
                   showSearch={filter.showSearch !== false && (filter.options || []).length > 5}
                 />
               );
             })}
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