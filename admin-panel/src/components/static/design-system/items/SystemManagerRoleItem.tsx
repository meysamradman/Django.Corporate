import { CheckCircle2, ShieldCheck } from "lucide-react";

export function SystemManagerRoleItem() {
  return (
    <div className="relative w-full max-w-190 rounded-2xl border-2 border-blue bg-blue p-4">
      <div className="absolute left-3 top-3 text-blue-2">
        <CheckCircle2 className="size-4 fill-current" />
      </div>

      <div className="flex items-center justify-between gap-3 pr-2">
        <div className="text-right">
          <h3 className="text-xl font-bold text-blue-2">مدیر سیستم</h3>
          <p className="mt-1 text-xs text-blue-2">دسترسی کامل یا محدود به بخش‌های مدیریتی و تنظیمات فنی</p>
        </div>

        <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-0 text-blue-2">
          <ShieldCheck className="size-6" />
        </div>
      </div>
    </div>
  );
}
