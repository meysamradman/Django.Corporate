import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { User } from "lucide-react";

interface AdminStaticAccountTabProps {
  isEditMode: boolean;
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  onChange: (field: string, value: string) => void;
}

export function AdminStaticAccountTab({
  isEditMode,
  fullName,
  mobile,
  email,
  password,
  onChange,
}: AdminStaticAccountTabProps) {
  return (
    <CardWithIcon
      icon={User}
      title="اطلاعات احراز هویت"
      iconBgColor="bg-blue"
      iconColor="stroke-blue-2"
      cardBorderColor="border-b-blue-1"
      className="gap-0"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="static-full-name">نام کامل</Label>
          <Input
            id="static-full-name"
            value={fullName}
            disabled={!isEditMode}
            onChange={(e) => onChange("fullName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="static-mobile">شماره موبایل</Label>
          <Input
            id="static-mobile"
            value={mobile}
            inputMode="tel"
            disabled={!isEditMode}
            onChange={(e) => onChange("mobile", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="static-email">ایمیل</Label>
          <Input
            id="static-email"
            value={email}
            type="email"
            disabled={!isEditMode}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="static-password">رمز عبور</Label>
          <Input
            id="static-password"
            value={password}
            type="password"
            placeholder="••••••••"
            disabled={!isEditMode}
            onChange={(e) => onChange("password", e.target.value)}
          />
        </div>
      </div>
    </CardWithIcon>
  );
}
