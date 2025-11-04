"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  OnChangeFn,
} from "@tanstack/react-table"
import { TablePaginationState } from '@/types/shared/pagination';

import { Button } from "@/components/elements/Button";
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

import { DataTableSelectFilter } from "./DataTableSelectFilter"
import { DataTableHierarchicalFilter, CategoryItem } from "./DataTableHierarchicalFilter"
import { DataTableDateFilter } from "./DataTableDateFilter"
import { Trash, Search, Download, Printer } from "lucide-react"
import { TableLoadingCompact } from "@/components/elements/TableLoading"
import { PaginationControls } from "@/components/shared/Pagination"


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
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
}

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
  searchConfig: providedSearchConfig,
  filterConfig = [],
  deleteConfig,
  exportConfig,
  exportConfigs,
  onPrint,
  pageSizeOptions = [10, 20, 30, 50],
  searchValue,
}: DataTableProps<TData, TValue, TClientFilters>) {

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(controlledState.columnVisibility ?? {});

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

  const searchConfig = {
    placeholder: "جستجو...",
    columnId: "search",
    ...providedSearchConfig,
  };

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

  // Determine which export configs to use
  const activeExportConfigs = exportConfigs || (exportConfig ? [exportConfig] : []);

  return (
    <Card 
      className="gap-0 shadow-sm border border-border hover:shadow-lg transition-all duration-300"
      data-table="portfolio-table"
    >
      <CardHeader className="border-b">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
           <div className="flex items-center gap-2 flex-wrap">
             <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:max-w-[320px]">
               <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
               <Input
                 placeholder="جستجو..."
                 value={searchValue ?? ""}
                 onChange={(event) => {
                   onFilterChange("search", event.target.value);
                 }}
                 className="pr-8 h-8 text-sm"
               />
             </div>
             {activeExportConfigs.map((config, index) => (
               <Button
                 key={index}
                 variant={config.variant || "outline"}
                 onClick={() => handleExportClick(config)}
                 className="gap-2"
               >
                 <Download className="h-4 w-4" />
                 {config.buttonText || "خروجی"}
               </Button>
             ))}
             {onPrint && (
               <Button
                 variant="outline"
                 onClick={onPrint}
                 className="gap-2"
               >
                 <Printer className="h-4 w-4" />
                 پرینت
               </Button>
             )}
             {selectedRowCount > 0 && deleteConfig && (
               <Button
                 variant="destructive"
                 onClick={handleDeleteSelectedClick}
               >
                 <Trash className="" />
                 {deleteConfig.buttonText || "حذف"}
               </Button>
             )}
            </div>

           <div className="flex flex-col flex-wrap gap-2 md:flex-row md:items-center md:gap-2">
             {filterConfig.map((filter) => {
               // برای فیلترهایی که مربوط به ستون جدول هستند
               // بررسی می‌کنیم که ستون وجود دارد
               const column = table.getColumn(filter.columnId);
               
               if (!column && filter.columnId !== 'categories') return null;
               
               if (filter.type === 'hierarchical') {
                 return (
                   <DataTableHierarchicalFilter
                     key={filter.columnId}
                     title={filter.title}
                     items={filter.options as unknown as CategoryItem[]}
                     placeholder={filter.placeholder || "انتخاب کنید..."}
                     value={clientFilters[filter.columnId as keyof TClientFilters] as string | number | undefined}
                     onChange={(value) => onFilterChange(filter.columnId, value)}
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
                     placeholder={filter.placeholder || "انتخاب تاریخ..."}
                   />
                 );
               }
               
               return (
                 <DataTableSelectFilter
                   key={filter.columnId}
                   title={filter.title}
                   options={filter.options || []}
                   placeholder={filter.placeholder || "انتخاب کنید..."}
                   value={clientFilters[filter.columnId as keyof TClientFilters] as string | boolean | undefined}
                   onChange={(value) => onFilterChange(filter.columnId, value)}
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
                            width: header.column.columnDef.size === 60 ? '60px' : (header.column.id === 'is_active' && header.column.columnDef.size ? `${header.column.columnDef.size}px` : undefined),
                            minWidth: header.column.columnDef.size === 60 ? '60px' : (header.column.id === 'is_active' && header.column.columnDef.size ? `${header.column.columnDef.size}px` : (header.column.columnDef.minSize || header.getSize())),
                            maxWidth: header.column.columnDef.maxSize === 60 ? '60px' : undefined,
                            ...(header.column.id === 'select' && {
                              paddingLeft: '0.5rem',
                              paddingRight: '0.5rem'
                            })
                          }}
                          className={header.column.id === 'select' ? 'text-center' : 'text-right'}
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
                            width: cell.column.columnDef.size === 60 ? '60px' : (cell.column.id === 'is_active' && cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : undefined),
                            minWidth: cell.column.columnDef.size === 60 ? '60px' : (cell.column.id === 'is_active' && cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : (cell.column.columnDef.minSize || cell.column.getSize())),
                            maxWidth: cell.column.columnDef.maxSize === 60 ? '60px' : undefined,
                            ...(cell.column.id === 'select' && {
                              paddingLeft: '0.5rem',
                              paddingRight: '0.5rem'
                            }),
                            ...(cell.column.id === 'actions' && {
                              paddingLeft: '1.3rem',
                              paddingRight: '0.9rem'
                            })
                          }}
                          className={cell.column.id === 'select' ? 'text-center' : undefined}
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
                        <TableLoadingCompact />
                      ) : (
                        <div className="py-8 text-muted-foreground">
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
          totalPages={pageCount} // Use the pageCount prop from API instead of table.getPageCount()
          onPageChange={(page: number) => table.setPageIndex(page - 1)}
          pageSize={table.getState().pagination.pageSize}
          onPageSizeChange={(size: number) => {
            table.setPageSize(size);
            // Reset to first page when page size changes
            table.setPageIndex(0);
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