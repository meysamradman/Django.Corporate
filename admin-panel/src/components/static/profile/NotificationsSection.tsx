import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { NOTIFICATION_ITEMS } from "@/components/static/profile/data";
import { BellRing } from "lucide-react";

export function NotificationsSection() {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="text-lg">اعلان‌ها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.id} className="rounded-xl border border-br bg-bg p-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <BellRing className="size-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-font-p">{item.title}</p>
                  <p className="text-xs text-font-s mt-1">{item.description}</p>
                </div>
              </div>
              <span className="text-xs text-font-s whitespace-nowrap">{item.time}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
