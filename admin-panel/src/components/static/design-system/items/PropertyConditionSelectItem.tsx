import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Building2 } from "lucide-react";

export function PropertyConditionSelectItem() {
  return (
    <div className="w-full max-w-130 rounded-2xl border border-blue bg-blue p-3">
      <div className="mb-2.5 flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-0 text-blue-2">
          <Building2 className="size-4" />
        </div>

        <div className="text-right">
          <p className="text-xs text-font-s">وضعیت ملک</p>
          <p className="mt-1 text-xl font-bold leading-none text-blue-2">تنظیم نشده</p>
        </div>
      </div>

      <Select>
        <SelectTrigger className="h-10 rounded-xl border-br bg-bg">
          <SelectValue placeholder="انتخاب کنید..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">نوساز</SelectItem>
          <SelectItem value="old">قدیمی</SelectItem>
          <SelectItem value="renovated">بازسازی شده</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
