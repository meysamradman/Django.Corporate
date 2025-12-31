import { PersianDatePicker } from "@/components/elements/PersianDatePicker"

interface DataTableDateFilterProps {
  title?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

export function DataTableDateFilter({
  title,
  value,
  onChange,
  placeholder,
}: DataTableDateFilterProps) {
  const defaultPlaceholder = placeholder || title || "تاریخ";
  return (
    <div className="flex items-center gap-2">
      {title && (
        <label className="text-sm font-medium text-font-s whitespace-nowrap">
          {title}
        </label>
      )}
      <PersianDatePicker
        value={value || ""}
        onChange={(date) => onChange(date)}
        placeholder={defaultPlaceholder}
        className="h-9 w-36"
      />
    </div>
  )
}