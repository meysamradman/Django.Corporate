import { Avatar, AvatarFallback } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent } from "@/components/elements/Card";
import { AtSign, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Send, Smartphone } from "lucide-react";

export function InfoSidebar() {
  const roleLabel = "مدیر محتوا";
  const accountTypeLabel = "مشاور املاک";

  const infoRows = [
    { icon: AtSign, label: "نام کاربری", value: "barakat_admin" },
    { icon: Mail, label: "ایمیل", value: "admin@example.com" },
    { icon: Smartphone, label: "موبایل", value: "09124707989" },
    { icon: Phone, label: "تلفن", value: "02112345678" },
    { icon: MapPin, label: "موقعیت", value: "تهران، تهران" },
  ] as const;

  return (
    <Card className="gap-0 h-fit">
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center text-center gap-3 pb-4 border-b border-br">
          <Avatar className="size-24 rounded-full">
            <AvatarFallback className="rounded-full bg-blue text-blue-2 text-2xl font-bold">
              BK
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-font-p">باراکت الله</h2>
            <p className="text-base text-font-s">barakat_admin@</p>
            <p className="text-base text-font-s">مدیر محتوا</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full size-8 bg-pink text-pink-2 border border-pink">
              <Instagram className="size-4" />
            </span>
            <span className="inline-flex items-center justify-center rounded-full size-8 bg-blue text-blue-2 border border-blue">
              <Send className="size-4" />
            </span>
            <span className="inline-flex items-center justify-center rounded-full size-8 bg-green text-green-2 border border-green">
              <MessageCircle className="size-4" />
            </span>
            <span className="inline-flex items-center justify-center rounded-full size-8 bg-indigo text-indigo-2 border border-indigo">
              <Linkedin className="size-4" />
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-br bg-card-2 p-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="blue">نقش: {roleLabel}</Badge>
            <Badge variant="teal">نوع حساب: {accountTypeLabel}</Badge>
            <Badge variant="green">وضعیت: فعال</Badge>
          </div>
        </div>

        <div className="rounded-xl border border-br bg-card-2 p-3 space-y-1.5">
          <p className="text-sm font-semibold text-font-p">درباره من</p>
          <p className="text-sm text-font-s leading-7">
            مدیر سیستم با تمرکز روی معماری، امنیت و بهینه‌سازی فرآیندهای ادمین.
          </p>
        </div>

        <div className="space-y-2 border-y border-br py-4">
          {infoRows.map((row) => {
            const RowIcon = row.icon;

            return (
              <div key={row.label} className="rounded-lg border border-br bg-card-2 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="inline-flex items-center justify-center size-7 rounded-md bg-card border border-br shrink-0">
                      <RowIcon className="size-4 text-font-s" />
                    </span>
                    <span className="text-sm text-font-s">{row.label}</span>
                  </div>
                  <span className="text-base font-semibold text-font-p truncate">{row.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
