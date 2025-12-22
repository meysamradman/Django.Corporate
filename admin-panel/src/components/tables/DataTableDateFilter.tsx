import { Calendar } from "lucide-react"
import { Input } from "@/components/elements/Input"

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
      <div className="relative">
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-36 pl-8"
          placeholder={defaultPlaceholder}
        />
        <Calendar className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-font-s" />
      </div>
    </div>
  )
}