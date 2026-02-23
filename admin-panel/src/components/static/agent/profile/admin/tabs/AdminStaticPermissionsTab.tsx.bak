import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { ShieldCheck } from "lucide-react";
import { staticPermissionBadgeClass } from "../mockData";

interface RoleOption {
  value: string;
  label: string;
}

interface PermissionItem {
  id: number;
  codename: string;
  title: string;
  action: string;
  module: string;
}

interface AdminStaticPermissionsTabProps {
  isEditMode: boolean;
  role: string;
  customRole: string;
  roleOptions: RoleOption[];
  permissions: PermissionItem[];
  onChangeRole: (value: string) => void;
  onChangeCustomRole: (value: string) => void;
}

export function AdminStaticPermissionsTab(props: AdminStaticPermissionsTabProps) {
  const { isEditMode, role, customRole, roleOptions, permissions, onChangeRole, onChangeCustomRole } = props;

  return (
    <div className="space-y-6">
      <CardWithIcon
        icon={ShieldCheck}
        title="نقش و دسترسی‌ها"
        iconBgColor="bg-success"
        iconColor="stroke-success-2"
        cardBorderColor="border-b-success-1"
        className="gap-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="static-role">نقش</Label>
            <Select value={role} onValueChange={onChangeRole} disabled={!isEditMode}>
              <SelectTrigger id="static-role">
                <SelectValue placeholder="انتخاب نقش" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="static-custom-role">نقش سفارشی</Label>
            <Input
              id="static-custom-role"
              value={customRole}
              disabled={!isEditMode}
              onChange={(e) => onChangeCustomRole(e.target.value)}
              placeholder="مثال: مدیر محتوا"
            />
          </div>
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={ShieldCheck}
        title="لیست دسترسی‌های نمونه"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        cardBorderColor="border-b-blue-1"
        className="gap-0"
      >
        <div className="overflow-x-auto rounded-xl border border-br bg-card-1">
          <table className="w-full text-sm">
            <thead className="bg-card-2 text-font-p">
              <tr>
                <th className="text-right p-3">عنوان</th>
                <th className="text-right p-3">کدنیم</th>
                <th className="text-right p-3">ماژول</th>
                <th className="text-right p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((item) => (
                <tr key={item.id} className="border-t border-br text-font-p">
                  <td className="p-3">{item.title}</td>
                  <td className="p-3 text-font-s">{item.codename}</td>
                  <td className="p-3">{item.module}</td>
                  <td className="p-3">
                    <Badge className={staticPermissionBadgeClass[item.action] ?? "bg-card-2 text-font-p"}>{item.action}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardWithIcon>
    </div>
  );
}
