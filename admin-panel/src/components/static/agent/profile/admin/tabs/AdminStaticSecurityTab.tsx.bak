import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { LockKeyhole } from "lucide-react";

interface AdminStaticSecurityTabProps {
  isEditMode: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  forcePasswordChange: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export function AdminStaticSecurityTab(props: AdminStaticSecurityTabProps) {
  const {
    isEditMode,
    currentPassword,
    newPassword,
    confirmPassword,
    twoFactorEnabled,
    forcePasswordChange,
    onChange,
  } = props;

  return (
    <CardWithIcon
      icon={LockKeyhole}
      title="امنیت حساب"
      iconBgColor="bg-yellow"
      iconColor="stroke-yellow-2"
      cardBorderColor="border-b-yellow-1"
      className="gap-0"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="static-current-password">رمز عبور فعلی</Label>
            <Input
              id="static-current-password"
              type="password"
              value={currentPassword}
              disabled={!isEditMode}
              onChange={(e) => onChange("currentPassword", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="static-new-password">رمز عبور جدید</Label>
            <Input
              id="static-new-password"
              type="password"
              value={newPassword}
              disabled={!isEditMode}
              onChange={(e) => onChange("newPassword", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="static-confirm-password">تکرار رمز عبور</Label>
            <Input
              id="static-confirm-password"
              type="password"
              value={confirmPassword}
              disabled={!isEditMode}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-br bg-card-2 p-4">
            <div>
              <p className="text-sm text-font-p">احراز هویت دو مرحله‌ای</p>
              <p className="text-xs text-font-s">در حالت استاتیک برای نمایش فرم فعال است.</p>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={(checked) => onChange("twoFactorEnabled", checked)} disabled={!isEditMode} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-br bg-card-2 p-4">
            <div>
              <p className="text-sm text-font-p">اجبار تغییر رمز عبور</p>
              <p className="text-xs text-font-s">برای ورود بعدی کاربر اعمال می‌شود.</p>
            </div>
            <Switch checked={forcePasswordChange} onCheckedChange={(checked) => onChange("forcePasswordChange", checked)} disabled={!isEditMode} />
          </div>
        </div>
      </div>
    </CardWithIcon>
  );
}
