import { PlusCircle } from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { Checkbox } from "@/components/elements/Checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/elements/Command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/elements/Popover";

interface FacetedFilterOption {
  label: string;
  value: string | boolean;
  icon?: ComponentType<{ className?: string }>;
  count?: number;
}

interface DataTableFacetedFilterSimpleProps {
  title?: string;
  options: FacetedFilterOption[];
  value?: string | boolean | (string | boolean)[];
  onChange: (value: string | boolean | (string | boolean)[] | undefined) => void;
  multiSelect?: boolean;
  showSearch?: boolean;
}

export function DataTableFacetedFilterSimple({
  title,
  options,
  value,
  onChange,
  multiSelect = false,
  showSearch = true,
}: DataTableFacetedFilterSimpleProps) {
  const selectedValues = new Set<string | boolean>();

  if (multiSelect) {
    if (Array.isArray(value)) {
      value.forEach(v => selectedValues.add(v));
    } else if (typeof value === 'string') {
      value.split(',').forEach(v => {
        const trimmed = v.trim();
        if (trimmed) selectedValues.add(trimmed);
      });
    }
  } else if (value !== undefined && value !== null && !Array.isArray(value)) {
    selectedValues.add(value as string | boolean);
  }

  const handleToggle = (optionValue: string | boolean) => {
    if (multiSelect) {
      const newSet = new Set(selectedValues);
      if (newSet.has(optionValue)) {
        newSet.delete(optionValue);
      } else {
        newSet.add(optionValue);
      }
      onChange(newSet.size > 0 ? Array.from(newSet) : undefined);
    } else {
      if (selectedValues.has(optionValue)) {
        onChange(undefined);
      } else {
        onChange(optionValue);
      }
    }
  };

  const hasSelection = selectedValues.size > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle />
          {title}
          {hasSelection && (
            <>
              <span className="mx-2 h-4 w-px bg-border" />
              {multiSelect ? (
                selectedValues.size > 2 ? (
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
                )
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-sm px-1 font-normal"
                >
                  {options.find(opt => selectedValues.has(opt.value))?.label}
                </Badge>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          {showSearch && <CommandInput placeholder={title || "جستجو..."} />}
          <CommandList>
            <CommandEmpty>نتیجه‌ای یافت نشد</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={String(option.value)}
                    onSelect={() => handleToggle(option.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="me-2"
                    />
                    {option.icon && (
                      <option.icon className="h-4 w-4 text-font-s me-2" />
                    )}
                    <span className="flex-1">{option.label}</span>
                    {option.count !== undefined && (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 ms-2"
                      >
                        {option.count}
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
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
  );
}

