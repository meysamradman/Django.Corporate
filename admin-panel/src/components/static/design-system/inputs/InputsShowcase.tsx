import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";

export function InputsShowcase() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-4xl">
      <div className="space-y-2">
        <Label htmlFor="input-title">عنوان</Label>
        <Input id="input-title" placeholder="عنوان را وارد کنید" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="input-email">ایمیل</Label>
        <Input id="input-email" type="email" placeholder="example@site.com" dir="ltr" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="input-password">رمز عبور</Label>
        <Input id="input-password" type="password" placeholder="••••••••" dir="ltr" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="input-number">قیمت</Label>
        <Input id="input-number" type="number" placeholder="12500000000" dir="ltr" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="input-readonly">شناسه (readonly)</Label>
        <Input id="input-readonly" value="PR-2026-1024" readOnly dir="ltr" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="input-disabled">فیلد غیرفعال</Label>
        <Input id="input-disabled" value="غیرفعال" disabled />
      </div>
    </div>
  );
}
