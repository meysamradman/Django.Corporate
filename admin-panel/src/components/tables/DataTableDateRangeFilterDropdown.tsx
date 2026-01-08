import { PlusCircle, Check } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
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
import { cn } from "@/core/utils/cn";

export interface DateRangeOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  dateRange: { from?: string; to?: string };
}

interface DataTableDateRangeFilterDropdownProps {
  title?: string;
  placeholder?: string;
  options: DateRangeOption[];
  value?: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string }) => void;
}

export function DataTableDateRangeFilterDropdown({
  title = "بازه تاریخ",
  options,
  value,
  onChange,
}: DataTableDateRangeFilterDropdownProps) {
  const selectedOption = options.find(
    (option) =>
      option.dateRange.from === value?.from &&
      option.dateRange.to === value?.to
  );

  const hasSelection = !!value?.from || !!value?.to;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle />
          {title}
          {hasSelection && selectedOption && (
            <>
              <CommandSeparator className="mx-2 h-4" />
              <Badge
                variant="outline"
                className="rounded-sm px-1 font-normal"
              >
                {selectedOption.label}
              </Badge>
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
                const isSelected =
                  option.dateRange.from === value?.from &&
                  option.dateRange.to === value?.to;
                const Icon = option.icon;

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        onChange({ from: undefined, to: undefined });
                      } else {
                        onChange(option.dateRange);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary me-2",
                        isSelected
                          ? "bg-primary text-static-w"
                          : "opacity-50"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {Icon && <Icon className="h-4 w-4 text-font-s me-2" />}
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
                    onSelect={() => {
                      onChange({ from: undefined, to: undefined });
                    }}
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

