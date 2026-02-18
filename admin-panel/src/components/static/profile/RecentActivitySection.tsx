import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { RECENT_ACTIVITY_ITEMS } from "@/components/static/profile/data";
import { Search, SquareDashedMousePointer } from "lucide-react";

export function RecentActivitySection() {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="text-lg">فعالیت‌های اخیر</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RECENT_ACTIVITY_ITEMS.map((item, index) => {
            const isSearch = item.startsWith("جستجو");
            return (
              <div key={`${item}-${index}`} className="flex items-center gap-3 text-sm text-font-p rounded-lg border border-br p-3 bg-bg">
                {isSearch ? <Search className="size-4 text-font-s" /> : <SquareDashedMousePointer className="size-4 text-font-s" />}
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
