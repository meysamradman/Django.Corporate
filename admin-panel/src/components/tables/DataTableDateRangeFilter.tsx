import { PersianDateRangePicker } from "@/components/elements/PersianDateRangePicker"

interface DataTableDateRangeFilterProps {
  title?: string
  value?: { from?: string; to?: string }
  onChange: (value: { from?: string; to?: string }) => void
  placeholder?: string
}

export function DataTableDateRangeFilter({
  title,
  value,
  onChange,
  placeholder,
}: DataTableDateRangeFilterProps) {
  const defaultPlaceholder = placeholder || title || "انتخاب بازه تاریخ";
  return (
    <div className="flex items-center gap-2">
      {title && (
        <label className="text-sm font-medium text-font-s whitespace-nowrap">
          {title}
        </label>
      )}
      <PersianDateRangePicker
        value={value || { from: undefined, to: undefined }}
        onChange={(range) => onChange(range)}
        placeholder={defaultPlaceholder}
        className="h-9 w-[280px]"
      />
    </div>
  )
}

