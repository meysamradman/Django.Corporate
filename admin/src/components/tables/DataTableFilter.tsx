"use client"

import * as React from "react"
import { PlusCircle } from "lucide-react"
import { Column } from "@tanstack/react-table"
import { cn } from '@/core/utils/cn';
import { Badge } from "@/components/elements/Badge"
import { Button } from "@/components/elements/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/elements/Command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/elements/Popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select"


interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string | boolean
    icon?: React.ComponentType<{ className?: string }>
  }[]
  type?: "select" | "command"
  placeholder?: string
  onFilterChange: (columnId: string, value: string | boolean | string[]) => void;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  type = "command",
  placeholder,
  onFilterChange,
}: DataTableFacetedFilterProps<TData, TValue>) {

  const selectedValues = new Set(column?.getFilterValue() as (string | boolean)[])
  const columnId = column?.id;
  const defaultPlaceholder = placeholder || "انتخاب کنید...";

  if (type === 'select') {
    return (
        <Select
          onValueChange={(value) => {
            if (columnId) {
              const filterValue = value === "true" ? true : value === "false" ? false : value;
              onFilterChange(columnId, filterValue);
            }
          }}
          value={String(column?.getFilterValue() ?? "")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={defaultPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <CommandSeparator className="mx-2 h-4" />
              <Badge
                variant="outline"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="outline"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} انتخاب شده
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="outline"
                        key={String(option.value)}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title || "جستجو..."} />
          <CommandList>
            <CommandEmpty>نتیجه‌ای یافت نشد</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={String(option.value)}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value)
                      } else {
                        selectedValues.add(option.value)
                      }
                      const filterValues = Array.from(selectedValues)
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      )
                      if (columnId) {
                        const stringifiedValues = filterValues.map(v => String(v));
                        onFilterChange(columnId, stringifiedValues);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-static-w"
                          : "opacity-50"
                      )}
                    />
                    {option.icon && (
                      <option.icon className="h-4 w-4 text-font-s" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                        column?.setFilterValue(undefined)
                        if (columnId) {
                            onFilterChange(columnId, []);
                        }
                    }}
                    className="justify-center text-center"
                  >
                    پاک کردن فیلترها
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 