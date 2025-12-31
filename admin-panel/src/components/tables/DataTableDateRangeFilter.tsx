import { PersianDateRangePicker } from "@/components/elements/PersianDateRangePicker"

interface DataTableDateRangeFilterProps {
  title?: string
  value?: { from?: string; to?: string }
  onChange: (value: { from?: string; to?: string }) => void
  placeholder?: string
}

export function DataTableDateRangeFilter({
  value,
  onChange,
  placeholder,
}: DataTableDateRangeFilterProps) {
  return (
    <PersianDateRangePicker
      value={value || { from: undefined, to: undefined }}
      onChange={(range) => onChange(range)}
      placeholder={placeholder || ""}
      className="h-9 w-full md:w-auto min-w-[120px]"
    />
  )
}

