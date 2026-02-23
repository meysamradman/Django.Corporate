import { Button } from "@/components/elements/Button";
import { Plus, Search, Trash2, ArrowLeft, Save } from "lucide-react";

export function ButtonsShowcase() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="default">پیش‌فرض</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">حذف</Button>
        <Button variant="link">لینک</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">کوچک</Button>
        <Button size="default">نرمال</Button>
        <Button size="lg">بزرگ</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button>
          <Plus />
          افزودن مورد
        </Button>
        <Button variant="outline">
          <Search />
          جستجو
        </Button>
        <Button variant="destructive">
          <Trash2 />
          حذف آیتم
        </Button>
        <Button variant="outline">
          بازگشت
          <ArrowLeft />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button isLoading loadingText="در حال ذخیره...">
          <Save />
          ذخیره
        </Button>
        <Button variant="outline" isLoading loadingText="در حال دریافت...">
          دریافت داده
        </Button>
      </div>
    </div>
  );
}
