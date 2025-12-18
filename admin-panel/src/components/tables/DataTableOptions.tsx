"use client"

import { Settings2 } from "lucide-react"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/elements/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu"


interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="نمایش ستون‌ها"
          variant="outline"
          size="sm"
          className="ms-auto hidden lg:flex"
        >
          <Settings2 className="me-2 h-4 w-4" />
          ستون‌ها
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>نمایش ستون‌ها</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                <span className="truncate">{column.id}</span>
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 