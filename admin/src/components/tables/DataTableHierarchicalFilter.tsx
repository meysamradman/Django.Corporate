"use client"

import * as React from "react"
import { Check, ChevronsUpDown, ChevronRight } from "lucide-react"
import { cn } from '@/core/utils/cn';
import { Button } from "@/components/elements/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/elements/Command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/elements/Popover"
import { CategoryItem } from "@/types/shared/table";

interface DataTableHierarchicalFilterProps<TValue> {
  title?: string
  items: CategoryItem[]
  placeholder?: string
  value?: TValue
  onChange: (value: TValue | undefined) => void
}

export function DataTableHierarchicalFilter<TValue extends string | number>({
  title,
  items,
  placeholder,
  value,
  onChange
}: DataTableHierarchicalFilterProps<TValue>) {

  const [open, setOpen] = React.useState(false)
  const [selectedLabel, setSelectedLabel] = React.useState<string>("")
  const filterValue = value === undefined ? undefined : String(value);
  const defaultPlaceholder = placeholder || title || "انتخاب کنید...";

  React.useEffect(() => {
    if (filterValue) {
      const findLabel = (items: CategoryItem[]): string => {
        for (const item of items) {
          if (item.value === filterValue) return item.label
          if (item.children?.length) {
            const childLabel = findLabel(item.children)
            if (childLabel) return childLabel
          }
        }
        return ""
      }
      setSelectedLabel(findLabel(items))
    } else {
      setSelectedLabel("")
    }
  }, [filterValue, items])

  const handleValueChange = (newValue: string) => {
    if (newValue === "all") {
      onChange(undefined)
    } else {
      // Find the original value type (number or string) from the items
      const findItemValue = (items: CategoryItem[]): TValue | undefined => {
        for (const item of items) {
          if (item.value === newValue) {
            // Return the original id type (number or string)
            const id = item.id;
            return (typeof value === 'number' && typeof id === 'number') ? id as TValue : String(id) as TValue;
          }
          if (item.children?.length) {
            const childValue = findItemValue(item.children);
            if (childValue !== undefined) return childValue;
          }
        }
        return undefined;
      }
      const originalValue = findItemValue(items);
      onChange(originalValue);
    }
    setOpen(false)
  }

  const renderItems = (items: CategoryItem[], depth = 0) => {
    return items.map((item) => (
      <React.Fragment key={`item-${item.id}-${depth}`}>
        <CommandItem
          key={`command-${item.id}-${depth}`}
          value={item.value}
          onSelect={() => handleValueChange(item.value)}
          className="flex items-center"
        >
          <div
            style={{ marginRight: `${depth * 16}px` }}
            className={cn(
              "flex items-center flex-1",
              depth > 0 && "relative before:absolute before:right-[-8px] before:h-full before:w-[2px] before:bg-bg/50"
            )}
          >
            {item.children?.length ? (
              <ChevronRight className="mr-1 h-3 w-3 shrink-0 opacity-50" />
            ) : (
              <div className="mr-1 w-3"></div>
            )}
            <span className={cn(
              "ml-1",
              item.children?.length ? "font-medium" : "text-font-s"  
            )}>
              {item.label}
            </span>
          </div>
          <Check
            className={cn(
              "ml-auto h-4 w-4",
              filterValue === item.value ? "opacity-100" : "opacity-0"
            )}
          />
        </CommandItem>
        {item.children?.length ? renderItems(item.children, depth + 1) : null}
      </React.Fragment>
    ))
  }

  let triggerText: string;
  if (filterValue === undefined) {
            triggerText = defaultPlaceholder ?? title ?? "انتخاب کنید...";
  } else if (filterValue === "all") {
    triggerText = "همه";
  } else {
    triggerText = selectedLabel || (defaultPlaceholder ?? title ?? "انتخاب کنید...");
  }

  return (
    <div className="filter-width">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full h-8 px-3 text-xs filter-title"
          >
            <span className="truncate">
              {triggerText}
            </span>
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={defaultPlaceholder ?? title ?? "انتخاب کنید..."} className="h-9" />
            <CommandList className="max-h-[300px] overflow-auto">
              <CommandEmpty>نتیجه‌ای یافت نشد</CommandEmpty>
              <CommandGroup>
                                  <CommandItem value="all" onSelect={() => handleValueChange("all")}>
                    <div className="flex items-center font-medium">
                      همه
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      filterValue === undefined ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
                {renderItems(items)}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}