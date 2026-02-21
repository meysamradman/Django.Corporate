import { Avatar, AvatarFallback } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent } from "@/components/elements/Card";
import { Shield, Smartphone, Mail, UserCog } from "lucide-react";

interface AdminStaticSidebarProps {
  fullName: string;
  mobile: string;
  email: string;
  roleLabel: string;
  isActive: boolean;
}

export function AdminStaticSidebar({
  fullName,
  mobile,
  email,
  roleLabel,
  isActive,
}: AdminStaticSidebarProps) {
  return (
    <Card className="gap-0 h-fit">
      <CardContent className="space-y-5">
        <div className="flex flex-col items-center text-center gap-3 pb-4 border-b border-br">
          <Avatar className="size-24 rounded-full">
            <AvatarFallback className="rounded-full bg-blue text-blue-2 text-3xl font-black">
              ب
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-font-p">{fullName}</h2>
            <p className="text-sm text-font-s">ادمین سیستم</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="blue">ادمین</Badge>
            <Badge variant={isActive ? "green" : "red"}>{isActive ? "فعال" : "غیرفعال"}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-font-p">
            <Smartphone className="size-4 text-font-s" />
            <span>{mobile}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-font-p">
            <Mail className="size-4 text-font-s" />
            <span className="break-all">{email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-font-p">
            <UserCog className="size-4 text-font-s" />
            <span>{roleLabel}</span>
          </div>
        </div>

        <div className="rounded-xl border border-br bg-bg p-3 space-y-2">
          <p className="text-xs text-font-s">وضعیت دسترسی</p>
          <div className="flex items-center gap-2 text-sm text-font-p">
            <Shield className="size-4 text-primary" />
            <span>پروفایل قابل ویرایش و مشاهده</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
