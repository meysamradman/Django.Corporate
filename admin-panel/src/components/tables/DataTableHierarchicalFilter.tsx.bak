import { useState, useEffect, Fragment } from "react"
import { PlusCircle, ChevronRight } from "lucide-react"
import { cn } from '@/core/utils/cn';
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { Checkbox } from "@/components/elements/Checkbox";
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
import type { CategoryItem } from "@/types/shared/table";

interface DataTableHierarchicalFilterProps<TValue> {
  title?: string
  items: CategoryItem[]
  placeholder?: string
  value?: TValue | TValue[]
  onChange: (value: TValue | TValue[] | undefined) => void
}

export function DataTableHierarchicalFilter<TValue extends string | number>({
  title,
  items,
  placeholder,
  value,
  onChange,
  multiSelect = false,
}: DataTableHierarchicalFilterProps<TValue> & { multiSelect?: boolean }) {

  const [open, setOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>("")

  const selectedValues = new Set<string>();
  if (multiSelect) {
    if (Array.isArray(value)) {
      value.forEach(v => selectedValues.add(String(v)));
    } else if (typeof value === 'string') {
      value.split(',').forEach(v => {
        const trimmed = v.trim();
        if (trimmed) selectedValues.add(trimmed);
      });
    } else if (value !== undefined && value !== null) {
      selectedValues.add(String(value));
    }
  } else if (value !== undefined && value !== null && !Array.isArray(value)) {
    selectedValues.add(String(value));
  }

  const filterValue = !multiSelect && value !== undefined ? String(value) : undefined;
  const defaultPlaceholder = placeholder || title || "انتخاب کنید...";

  useEffect(() => {
    if (multiSelect) {
      return;
    }

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
  }, [filterValue, items, multiSelect])

  const handleValueChange = (newValue: string) => {
    if (newValue === "all") {
      onChange(undefined);
      setOpen(false);
      return;
    }

    const findItemValue = (items: CategoryItem[], searchVal: string): TValue | undefined => {
      for (const item of items) {
        if (item.value === searchVal) {
          const id = item.id;
          return id as unknown as TValue;
        }
        if (item.children?.length) {
          const childValue = findItemValue(item.children, searchVal);
          if (childValue !== undefined) return childValue;
        }
      }
      return undefined;
    }

    const itemValue = findItemValue(items, newValue);
    if (itemValue === undefined) return;

    if (multiSelect) {
      const newSet = new Set(selectedValues);
      if (newSet.has(newValue)) {
        newSet.delete(newValue);
      } else {
        newSet.add(newValue);
      }

      const newValues: TValue[] = [];
      newSet.forEach(val => {
        const found = findItemValue(items, val);
        if (found !== undefined) newValues.push(found);
      });

      onChange(newValues.length > 0 ? newValues : undefined);
    } else {
      onChange(itemValue);
      setOpen(false);
    }
  }

  const renderItems = (items: CategoryItem[], depth = 0) => {
    return items.map((item) => {
      const isSelected = selectedValues.has(item.value);
      return (
        <Fragment key={`item-${item.id}-${depth}`}>
          <CommandItem
            key={`command-${item.id}-${depth}`}
            value={item.value} // Use value for uniqueness in command
            onSelect={() => handleValueChange(item.value)}
          >
            <Checkbox
              checked={isSelected}
              className="me-2"
            />
            <div
              style={{ paddingRight: `${depth * 16}px` }}
              className={cn(
                "flex items-center flex-1",
                depth > 0 && "relative before:absolute before:right-[-8px] before:h-full before:w-[2px] before:bg-bg/50"
              )}
            >
              {item.children?.length ? (
                <ChevronRight className="ms-1 h-3 w-3 shrink-0 opacity-50" />
              ) : (
                <div className="ms-1 w-3"></div>
              )}
              <span className={cn(
                "me-1 flex-1",
                item.children?.length ? "font-medium" : "text-font-s"
              )}>
                {item.label}
              </span>
            </div>
          </CommandItem>
          {item.children?.length ? renderItems(item.children, depth + 1) : null}
        </Fragment>
      )
    })
  }

  let triggerText: string;
  if (!multiSelect) {
    if (filterValue === undefined) {
      triggerText = defaultPlaceholder;
    } else if (filterValue === "all") {
      triggerText = "همه";
    } else {
      triggerText = selectedLabel || defaultPlaceholder;
    }
  } else {
    triggerText = defaultPlaceholder;
  }

  const hasSelection = selectedValues.size > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle />
          {title}
          {hasSelection && (
            <>
              <span className="mx-2 h-4 w-px bg-border" />
              {multiSelect ? (
                <Badge
                  variant="outline"
                  className="rounded-sm px-1 font-normal"
                >
                  {selectedValues.size} انتخاب شده
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-sm px-1 font-normal"
                >
                  {selectedLabel || triggerText}
                </Badge>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={defaultPlaceholder} />
          <CommandList>
            <CommandEmpty>نتیجه‌ای یافت نشد</CommandEmpty>
            <CommandGroup>
              {!multiSelect && (
                <CommandItem value="all" onSelect={() => handleValueChange("all")}>
                  <Checkbox
                    checked={!hasSelection}
                    className="me-2"
                  />
                  <span className="flex-1 font-medium">همه</span>
                </CommandItem>
              )}

              {renderItems(items)}
            </CommandGroup>
            {hasSelection && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange(undefined)}
                    className="justify-center text-center cursor-pointer"
                  >
                    پاک کردن فیلتر
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